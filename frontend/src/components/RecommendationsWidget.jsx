import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRecommendations } from '../hooks/useRecommendations';
import { useViewHistory } from '../hooks/useViewHistory';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '../contexts/AuthContext';
import { aiAPI } from '../services/api';

export default function RecommendationsWidget() {
  const { user } = useAuth();
  const { recommendations, loading, bestCategory } = useRecommendations();
  const { getHistory } = useViewHistory();
  const { favoritesList } = useFavorites();

  const [open, setOpen]         = useState(false);
  const [insight, setInsight]   = useState('');
  const [insightLoading, setInsightLoading] = useState(false);
  const panelRef = useRef(null);

  // סגור בלחיצה מחוץ לפאנל
  useEffect(() => {
    const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // קבל insight מה-AI כשנפתח
  useEffect(() => {
    if (!open || insight) return;
    setInsightLoading(true);
    aiAPI.post('/ai/user-insight', {
      history:   getHistory().slice(0, 20),
      favorites: favoritesList.slice(0, 20),
      userName:  user?.name?.split(' ')[0] || '',
    })
      .then(({ data }) => setInsight(data.message || ''))
      .catch(() => setInsight(''))
      .finally(() => setInsightLoading(false));
  }, [open]); // eslint-disable-line

  if (!user) return null;
  const visible = loading || recommendations.length > 0;
  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col items-start gap-2">
      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          className="w-80 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-slideUp"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-600/20 to-emerald-600/10 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-purple-400" />
              <span className="text-sm font-bold text-white">המלצות AI</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white transition-colors p-0.5">
              <X size={15} />
            </button>
          </div>

          {/* AI Insight message */}
          <div className="px-4 py-3 border-b border-slate-700/60">
            {insightLoading ? (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-gray-400">מנתח את ההעדפות שלך...</span>
              </div>
            ) : (
              <p className="text-xs text-gray-300 leading-relaxed">{insight}</p>
            )}
          </div>

          {/* Recommendations list */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-700/40">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                  <div className="w-12 h-12 bg-slate-700 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-2.5 bg-slate-700 rounded w-3/4" />
                    <div className="h-2 bg-slate-700 rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : (
              recommendations.map((listing) => (
                <Link
                  key={listing.id}
                  to={`/listings/${listing.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 transition-colors group"
                >
                  {listing.images?.[0] ? (
                    <img src={listing.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-600" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center text-xl shrink-0">📦</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate group-hover:text-emerald-300 transition-colors">{listing.title}</p>
                    <p className="text-emerald-400 text-sm font-bold">₪{listing.price?.toLocaleString()}</p>
                  </div>
                  <ChevronLeft size={14} className="text-gray-500 shrink-0" />
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          {bestCategory && (
            <div className="px-4 py-2.5 border-t border-slate-700">
              <Link
                to={`/listings?category=${bestCategory}`}
                onClick={() => setOpen(false)}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
              >
                <span>כל המוצרים בקטגוריה</span>
                <ChevronLeft size={11} />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
          open
            ? 'bg-purple-600 text-white shadow-purple-500/30'
            : 'bg-slate-800 border border-slate-700 text-gray-300 hover:text-white hover:border-purple-500/50 shadow-black/40'
        }`}
      >
        <Sparkles size={16} className={open ? 'text-white' : 'text-purple-400'} />
        <span>מומלץ עבורך</span>
        {recommendations.length > 0 && !open && (
          <span className="bg-purple-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
            {recommendations.length}
          </span>
        )}
      </button>
    </div>
  );
}
