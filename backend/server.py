import os
import re
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import spacy
from langdetect import detect, LangDetectException

# Ключ читается из переменной окружения на сервере (Render/etc.),
# в код и тем более в браузер он никогда не попадает.
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_MODEL = "gemini-3-flash-preview"
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"


class TextSimplifierService:
    def __init__(self):
        self.nlp_models = {}
        # Поддерживаем русский (ru), английский (en) и казахский (kk)
        self.supported_models = {
            'ru': 'ru_core_news_sm',
            'en': 'en_core_web_sm',
            'kk': 'en_core_web_sm',  # для казахского пока используется эвристическая обработка
        }

    def _get_language(self, text):
        try:
            lang_code = detect(text)
            return lang_code if lang_code in self.supported_models else 'en'
        except LangDetectException:
            return 'en'

    def _get_model(self, lang_code):
        model_name = self.supported_models.get(lang_code, 'en_core_web_sm')
        if model_name not in self.nlp_models:
            try:
                self.nlp_models[model_name] = spacy.load(model_name)
            except OSError:
                self.nlp_models[model_name] = spacy.load('en_core_web_sm')
        return self.nlp_models[model_name]

    def _get_tree_depth(self, node):
        if not list(node.children):
            return 1
        return 1 + max(self._get_tree_depth(child) for child in node.children)

    def evaluate_complexity(self, sentence_doc):
        """
        Итоговая оценка сложности предложения, 1-10:
          50% - глубина синтаксического дерева зависимостей
                (вложенные придаточные вроде "который..., который...")
          25% - длина предложения в словах
          25% - доля длинных/редких слов (эвристика: длина слова > 10 символов)
        """
        max_depth = self._get_tree_depth(sentence_doc.root)
        total_words = 0
        complex_words_count = 0
        for token in sentence_doc:
            if token.is_alpha:
                total_words += 1
                if len(token.text) > 10:
                    complex_words_count += 1

        depth_score = min(max_depth / 6.0, 1.0) * 5.0
        length_score = min(total_words / 25.0, 1.0) * 2.5
        lexical_ratio = complex_words_count / max(total_words, 1)
        lexical_score = min(lexical_ratio, 1.0) * 2.5

        raw_score = depth_score + length_score + lexical_score
        return {
            "score": min(max(round(raw_score), 1), 10),
            "depth": max_depth,
            "word_count": total_words,
            "complex_word_ratio": round(lexical_ratio, 2),
        }

    def _build_reason(self, metrics):
        parts = []
        if metrics["depth"] >= 4:
            parts.append(f"глубокая вложенность конструкций (глубина дерева: {metrics['depth']})")
        if metrics["word_count"] >= 20:
            parts.append(f"длинное предложение ({metrics['word_count']} слов)")
        if metrics["complex_word_ratio"] >= 0.15:
            parts.append("много длинных/редких слов")
        return "; ".join(parts) if parts else "повышенная синтаксическая сложность"

    def _call_llm_simplify(self, text, lang_code):
        if not GEMINI_API_KEY:
            # Ключ ещё не настроен на сервере — возвращаем текст как есть,
            # чтобы приложение не падало.
            return text

        prompt = (
            "Ты — редактор, который упрощает сложные предложения на языке оригинала, "
            "сохраняя исходный смысл и факты. Перепиши следующее предложение проще и короче. "
            "Ответь только переписанным предложением, без пояснений и кавычек.\n\n"
            f"Предложение: {text}"
        )
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        try:
            response = requests.post(
                f"{GEMINI_URL}?key={GEMINI_API_KEY}",
                json=payload,
                timeout=20,
            )
            response.raise_for_status()
            data = response.json()
            return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception:
            # Сбой внешнего API не должен ронять весь ответ
            return text

    def process_text(self, text):
        text = re.sub(r'\s+', ' ', text).strip()
        if not text:
            return {
                "complexityIndex": 0,
                "overallSummary": "",
                "complexSentences": [],
                "fullSimplifiedText": "",
            }

        lang_code = self._get_language(text)
        nlp = self._get_model(lang_code)
        doc = nlp(text)

        final_sentences = []
        complex_sentences = []
        scores = []

        for sent in doc.sents:
            sent_text = sent.text.strip()
            if not sent_text:
                continue

            metrics = self.evaluate_complexity(sent)
            scores.append(metrics["score"])

            if metrics["score"] <= 4:
                final_sentences.append(sent_text)
            else:
                simplified = self._call_llm_simplify(sent_text, lang_code)
                final_sentences.append(simplified)
                complex_sentences.append({
                    "original": sent_text,
                    "simplified": simplified,
                    "reason": self._build_reason(metrics),
                })

        avg_score = round(sum(scores) / len(scores)) if scores else 0
        flagged = len(complex_sentences)
        total = len(scores)

        if flagged == 0:
            summary = "Текст написан простым языком, сложных синтаксических конструкций не обнаружено."
        else:
            summary = (
                f"Из {total} предложений {flagged} содержат сложные конструкции "
                f"(глубокая вложенность придаточных, длинные предложения или редкая лексика). "
                f"Средняя оценка сложности — {avg_score}/10."
            )

        return {
            "complexityIndex": avg_score,
            "overallSummary": summary,
            "complexSentences": complex_sentences,
            "fullSimplifiedText": " ".join(final_sentences),
        }


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # при желании можно сузить до домена фронтенда на Vercel
    allow_methods=["*"],
    allow_headers=["*"],
)

simplifier = TextSimplifierService()


class TextRequest(BaseModel):
    text: str


@app.get("/")
def health_check():
    return {"status": "ok"}


@app.post("/simplify")
def simplify_endpoint(request: TextRequest):
    return simplifier.process_text(request.text)
