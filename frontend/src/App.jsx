import { useState, useMemo } from 'react';
import {
  BookOpen, AlertCircle, FileText, Type, Hash,
  BarChart2, Sparkles, RefreshCcw,
  Info, ShieldAlert, CheckCircle2, Copy, Check,
  Zap
} from 'lucide-react';

const getScoreConfig = (score) => {
  if (score <= 3) return {
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    bar: 'bg-gradient-to-r from-emerald-500 to-teal-400',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" />,
    label: 'Низкая сложность (Низкий барьер)'
  };
  if (score <= 7) return {
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    bar: 'bg-gradient-to-r from-amber-500 to-orange-400',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: <Info className="w-6 h-6 text-amber-500" />,
    label: 'Средняя сложность (Требуется адаптация)'
  };
  return {
    text: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/20',
    bar: 'bg-gradient-to-r from-rose-500 to-pink-500',
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
    icon: <ShieldAlert className="w-6 h-6 text-rose-500" />,
    label: 'Высокая сложность (Критический барьер)'
  };
};

const StatCard = ({ icon: Icon, label, value, subtext }) => (
  <div className="relative bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md">
    <div className={`flex items-center space-x-3.5 ${subtext ? 'pr-20' : ''}`}>
      <div className="shrink-0 p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100/50">
        <Icon size={20} strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 leading-tight break-words">{label}</p>
        <p className="text-xl font-bold text-slate-900 tracking-tight">{value}</p>
      </div>
    </div>
    {subtext && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-md whitespace-nowrap">{subtext}</span>}
  </div>
);

const EmptyState = () => (
  <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-white/60 backdrop-blur-md rounded-3xl border border-dashed border-slate-300 min-h-[520px]">
    <div className="relative mb-6">
      <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 transform rotate-3 transition-transform hover:rotate-0">
        <BookOpen size={36} strokeWidth={1.5} />
      </div>
      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
        <Sparkles size={18} />
      </div>
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-2">Система готова к парсингу</h3>
    <p className="text-slate-500 max-w-sm text-sm leading-relaxed">
      Вставьте текст учебника слева и запустите алгоритм анализа для автоматического выявления сложных академических конструкций.
    </p>
  </div>
);

const LoadingSkeleton = () => (
  <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm min-h-[520px] animate-pulse space-y-6">
    <div className="flex items-center justify-between pb-6 border-b border-slate-100">
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-slate-200 rounded-2xl"></div>
        <div className="space-y-2">
          <div className="h-5 bg-slate-200 rounded w-40"></div>
          <div className="h-3 bg-slate-200 rounded w-24"></div>
        </div>
      </div>
      <div className="w-16 h-10 bg-slate-200 rounded-xl"></div>
    </div>
    <div className="h-2.5 bg-slate-100 rounded-full w-full overflow-hidden">
      <div className="h-full bg-slate-200 w-2/3 rounded-full"></div>
    </div>
    <div className="h-28 bg-slate-50 rounded-2xl border border-slate-100"></div>
    <div className="space-y-3">
      <div className="h-4 bg-slate-200 rounded w-1/3"></div>
      <div className="h-20 bg-slate-100 rounded-2xl"></div>
    </div>
  </div>
);

const ResultsDisplay = ({ results }) => {
  const config = getScoreConfig(results.complexityIndex);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (results.fullSimplifiedText) {
      navigator.clipboard.writeText(results.fullSimplifiedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-8">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className={`shrink-0 p-3 rounded-2xl ${config.bg} border ${config.border}`}>
              {config.icon}
            </div>
            <div className="min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Результат оценки</span>
              <h3 className="text-base md:text-xl font-bold text-slate-900 leading-tight">{config.label}</h3>
            </div>
          </div>
          <div className="shrink-0 text-right whitespace-nowrap">
            <span className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
              {results.complexityIndex}
            </span>
            <span className="text-lg font-semibold text-slate-400">/10</span>
          </div>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-2.5 p-0.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${config.bar}`}
            style={{ width: `${(results.complexityIndex / 10) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200/60">
        <div className="flex items-center space-x-2 text-indigo-600 mb-2">
          <BarChart2 size={16} />
          <h4 className="text-xs font-bold uppercase tracking-wider">Аналитическое резюме</h4>
        </div>
        <p className="text-slate-700 leading-relaxed text-sm md:text-base font-normal">
          {results.overallSummary}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-600" />
            Выявленные барьеры и рекомендации ({results.complexSentences?.length || 0})
          </h4>
        </div>

        {results.complexSentences && results.complexSentences.length > 0 ? (
          <div className="space-y-4">
            {results.complexSentences.map((item, index) => (
              <div key={index} className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:border-slate-300 transition-all">
                <div className="bg-rose-50/40 p-4 border-b border-rose-100/60">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Оригинал (Сложная конструкция)</span>
                    <span className="shrink-0 text-xs text-rose-500 font-medium bg-rose-100/80 px-2 py-0.5 rounded-full whitespace-nowrap">Академический барьер</span>
                  </div>
                  <p className="text-slate-800 text-sm leading-relaxed font-medium">{item.original}</p>
                </div>

                <div className="bg-slate-50/50 px-4 py-2 border-b border-slate-100 flex items-center space-x-2 text-xs text-slate-500">
                  <AlertCircle size={14} className="text-amber-500 shrink-0" />
                  <span><strong>Причина:</strong> {item.reason}</span>
                </div>

                <div className="bg-emerald-50/40 p-4">
                  <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1.5 block">Адаптированный вариант</span>
                  <p className="text-slate-900 text-sm leading-relaxed font-medium">{item.simplified}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-emerald-800 text-sm font-medium">
            Сложных академических конструкций не обнаружено. Текст уже адаптирован для восприятия.
          </div>
        )}
      </div>

      {results.fullSimplifiedText && (
        <div className="pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText size={18} className="text-indigo-600" />
              Итоговый адаптированный текст
            </h4>
            <button
              onClick={handleCopy}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all active:scale-95"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? 'Скопировано' : 'Скопировать'}</span>
            </button>
          </div>
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/60 text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-normal">
            {results.fullSimplifiedText}
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  const stats = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) return { chars: 0, words: 0, sentences: 0, avgWords: '0.0' };

    const chars = text.length;
    const words = trimmed.split(/\s+/).length;
    const sentences = trimmed.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgWords = sentences > 0 ? (words / sentences).toFixed(1) : '0.0';

    return { chars, words, sentences, avgWords };
  }, [text]);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    setError('');
    setResults(null);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      if (!backendUrl) throw new Error('VITE_BACKEND_URL не задан');

      const response = await fetch(`${backendUrl}/simplify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) throw new Error(`Ошибка сервера: ${response.status}`);

      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error("API Error:", err);
      setError("Произошла ошибка при анализе текста. Попробуйте еще раз.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 antialiased selection:bg-indigo-500 selection:text-white pb-16">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-500/20">
              <BookOpen size={20} />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-none">EduAdapt.AI</h1>
              <span className="text-[11px] text-slate-400 font-medium">Автоматизация снижения языкового барьера</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              <Zap size={12} className="text-indigo-600" /> Web-Прототип
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <label htmlFor="text-input" className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Исходный материал
                </label>
                <span className="text-xs text-slate-400 font-medium">Формат: Русский язык</span>
              </div>

              <textarea
                id="text-input"
                className="w-full h-[320px] p-4 bg-slate-50/80 border border-slate-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none text-slate-800 text-sm leading-relaxed placeholder:text-slate-400"
                placeholder="Вставьте фрагмент учебника или статьи..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isAnalyzing}
              />

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !text.trim()}
                className="w-full py-3.5 px-5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-2xl font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center space-x-2 cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCcw className="animate-spin" size={18} />
                    <span>Обработка запроса...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Запустить анализ сложности</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Type} label="Символы" value={stats.chars.toLocaleString('ru-RU')} />
              <StatCard icon={FileText} label="Слова" value={stats.words.toLocaleString('ru-RU')} />
              <StatCard icon={Hash} label="Предложения" value={stats.sentences.toLocaleString('ru-RU')} />
              <StatCard icon={BarChart2} label="Слов / Предл." value={stats.avgWords} subtext="Плотность" />
            </div>
          </div>

          <div className="lg:col-span-7">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center space-x-3 mb-6 text-sm">
                <AlertCircle size={20} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isAnalyzing ? (
              <LoadingSkeleton />
            ) : results ? (
              <ResultsDisplay results={results} />
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}