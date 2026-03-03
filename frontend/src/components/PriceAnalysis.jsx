import { useState, useEffect } from 'react';
import { TrendingDown, TrendingUp, Minus, AlertCircle } from 'lucide-react';
import { aiAPI } from '../services/api';

export default function PriceAnalysis({ title, category, price, condition }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    aiAPI.analyzePrice({ title, category, price, condition })
      .then(r => setAnalysis(r.data))
      .catch(() => setError('לא הצלחנו לנתח את המחיר'))
      .finally(() => setLoading(false));
  }, [title, category, price, condition]);

  if (loading) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 animate-pulse space-y-4">
        <div className="h-5 bg-slate-700 rounded w-1/3" />
        <div className="h-16 bg-slate-700 rounded-xl" />
        <div className="h-8 bg-slate-700 rounded" />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex items-center gap-3 text-red-400">
        <AlertCircle size={18} />
        <span className="text-sm">{error}</span>
      </div>
    );
  }

  const { verdict, explanation, market, positionPct = 50, confidence, matchedItem, recommendation } = analysis;

  const config = {
    'עסקה טובה': {
      border: 'border-blue-500/50',
      bg:     'bg-blue-500/10',
      badge:  'bg-blue-500/20 text-blue-300 border-blue-500/40',
      icon:   <TrendingDown size={18} className="text-blue-400" />,
      dot:    'bg-blue-500',
      label:  'text-blue-300',
    },
    'מחיר הוגן': {
      border: 'border-emerald-500/50',
      bg:     'bg-emerald-500/10',
      badge:  'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      icon:   <Minus size={18} className="text-emerald-400" />,
      dot:    'bg-emerald-500',
      label:  'text-emerald-300',
    },
    'קצת יקר': {
      border: 'border-amber-500/50',
      bg:     'bg-amber-500/10',
      badge:  'bg-amber-500/20 text-amber-300 border-amber-500/40',
      icon:   <TrendingUp size={18} className="text-amber-400" />,
      dot:    'bg-amber-500',
      label:  'text-amber-300',
    },
    'יקר מדי': {
      border: 'border-red-500/50',
      bg:     'bg-red-500/10',
      badge:  'bg-red-500/20 text-red-300 border-red-500/40',
      icon:   <TrendingUp size={18} className="text-red-400" />,
      dot:    'bg-red-500',
      label:  'text-red-300',
    },
  };
  const c = config[verdict] || config['מחיר הוגן'];

  // Clamp for display
  const dotLeft = Math.min(95, Math.max(5, positionPct));

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-lg shadow-black/20">

      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between">
        <h3 className="font-bold text-white flex items-center gap-2">
          <span>📊</span> ניתוח מחיר בשוק
        </h3>
        {matchedItem && (
          <span className="text-xs text-gray-500 bg-slate-700 px-2 py-0.5 rounded-full truncate max-w-36">
            {matchedItem}
          </span>
        )}
      </div>

      <div className="p-5 space-y-5">

        {/* Verdict card */}
        <div className={`flex items-start gap-3 rounded-xl border p-4 ${c.border} ${c.bg}`}>
          <div className="shrink-0 mt-0.5">{c.icon}</div>
          <div>
            <span className={`font-extrabold text-base ${c.label}`}>{verdict}</span>
            <p className="text-gray-300 text-sm mt-1 leading-relaxed">{explanation}</p>
          </div>
        </div>

        {/* Range bar */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">טווח מחירים בשוק</p>

          {/* Three-column labels */}
          <div className="flex justify-between text-xs font-medium mb-1.5">
            <span className="text-emerald-400">₪{market.min.toLocaleString()}</span>
            <span className="text-blue-400">ממוצע ₪{market.avg.toLocaleString()}</span>
            <span className="text-red-400">₪{market.max.toLocaleString()}</span>
          </div>

          {/* Gradient bar + user price dot */}
          <div className="relative h-3 bg-slate-700 rounded-full overflow-visible">
            {/* Gradient track */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 via-blue-500 to-red-500 opacity-60" />

            {/* Average marker */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-white/30" style={{ left: `${Math.round((market.avg - market.min) / (market.max - market.min) * 100)}%` }} />

            {/* User price dot */}
            <div
              className={`absolute -top-1 w-5 h-5 rounded-full border-2 border-white shadow-lg ${c.dot} transition-all duration-700`}
              style={{ left: `calc(${dotLeft}% - 10px)` }}
              title={`המחיר שלך: ₪${Number(price).toLocaleString()}`}
            />
          </div>

          {/* User price label below dot */}
          <div className="relative h-6 mt-1">
            <div
              className={`absolute text-xs font-bold ${c.label} -translate-x-1/2 whitespace-nowrap`}
              style={{ left: `${dotLeft}%` }}
            >
              ₪{Number(price).toLocaleString()} ← שלך
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'מינימום',  val: market.min, cls: 'text-emerald-400' },
            { label: 'ממוצע',    val: market.avg, cls: 'text-blue-400' },
            { label: 'מקסימום', val: market.max, cls: 'text-red-400' },
          ].map(({ label, val, cls }) => (
            <div key={label} className="bg-slate-700/60 border border-slate-600 rounded-xl py-2.5">
              <div className={`font-extrabold text-sm ${cls}`}>₪{val.toLocaleString()}</div>
              <div className="text-gray-500 text-[10px] mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {recommendation === 'raise' && '💡 שקול להעלות את המחיר'}
            {recommendation === 'lower' && '💡 שקול להוריד את המחיר'}
            {recommendation === 'keep'  && '✅ המחיר מתאים לשוק'}
          </span>
          <span>דיוק {confidence}%</span>
        </div>
      </div>
    </div>
  );
}
