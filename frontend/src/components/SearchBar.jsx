/**
 * SearchBar — חיפוש גלובלי עם debounce ו-dropdown תוצאות
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2 } from 'lucide-react';
import { getListings } from '../services/firestoreService';
import { useLanguage } from '../contexts/LanguageContext';

const DEBOUNCE_MS = 300;
const MAX_RESULTS = 5;

const CATEGORY_ICONS = {
  real_estate: '🏠', vehicles: '🚗', electronics: '📱',
  furniture: '🛋️', clothing: '👕', sports: '⚽',
  pets: '🐱', services: '🔧',
};

export default function SearchBar({ onClose }) {
  const { t } = useLanguage();
  const navigate  = useNavigate();
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);
  const [focused, setFocused] = useState(false);
  const containerRef = useRef(null);
  const inputRef     = useRef(null);
  const timerRef     = useRef(null);

  // סגור dropdown בקליק מחוץ
  useEffect(() => {
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Escape סוגר
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') { setOpen(false); onClose?.(); } };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // חיפוש עם debounce
  const doSearch = useCallback(async (q) => {
    if (q.trim().length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const { results: found } = await getListings({ search: q });
      setResults(found.slice(0, MAX_RESULTS));
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(timerRef.current);
    if (val.trim().length < 2) { setResults([]); setOpen(false); return; }
    timerRef.current = setTimeout(() => doSearch(val), DEBOUNCE_MS);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    navigate(`/listings?search=${encodeURIComponent(query.trim())}`);
    onClose?.();
  };

  const handleResultClick = (id) => {
    setOpen(false);
    setQuery('');
    navigate(`/listings/${id}`);
    onClose?.();
  };

  const clearQuery = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-md" dir="rtl">
      <form onSubmit={handleSubmit}>
        <div className={`flex items-center gap-2 bg-slate-800 border rounded-xl px-3 py-2 transition-all duration-200
          ${focused ? 'border-emerald-500 shadow-md shadow-emerald-500/20' : 'border-slate-700 hover:border-slate-600'}`}>
          {loading
            ? <Loader2 size={16} className="text-emerald-400 animate-spin flex-shrink-0" />
            : <Search size={16} className="text-gray-400 flex-shrink-0" />
          }
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onFocus={() => { setFocused(true); if (results.length) setOpen(true); }}
            onBlur={() => setFocused(false)}
            placeholder={t?.('search.placeholder') || 'חפש מוצרים, קטגוריות...'}
            className="bg-transparent text-white text-sm outline-none flex-1 placeholder-gray-500 min-w-0"
            autoComplete="off"
          />
          {query && (
            <button type="button" onClick={clearQuery}
              className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0">
              <X size={14} />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown תוצאות */}
      {open && (
        <div className="absolute top-full mt-2 right-0 left-0 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50 animate-fadeIn">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-gray-400 text-sm">
              לא נמצאו תוצאות, נסה מילות חיפוש אחרות
            </div>
          ) : (
            <>
              <div className="px-3 pt-2 pb-1">
                <span className="text-xs text-gray-500">תוצאות ({results.length})</span>
              </div>
              {results.map((listing) => (
                <button
                  key={listing.id}
                  onClick={() => handleResultClick(listing.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700/60 transition-colors text-right group"
                >
                  {/* תמונה ממוזערת */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-700">
                    {listing.images?.[0] ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">
                        {CATEGORY_ICONS[listing.categoryEn] || '📦'}
                      </div>
                    )}
                  </div>

                  {/* פרטים */}
                  <div className="flex-1 min-w-0 text-right">
                    <p className="text-white text-sm font-medium truncate group-hover:text-emerald-300 transition-colors">
                      {listing.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-emerald-400 text-sm font-bold">
                        ₪{listing.price?.toLocaleString()}
                      </span>
                      <span className="text-gray-500 text-xs">•</span>
                      <span className="text-gray-400 text-xs truncate">
                        {CATEGORY_ICONS[listing.categoryEn] || '📦'} {listing.location}
                      </span>
                    </div>
                  </div>
                </button>
              ))}

              {/* חיפוש מלא */}
              <button
                onClick={() => { navigate(`/listings?search=${encodeURIComponent(query.trim())}`); setOpen(false); onClose?.(); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-emerald-400 hover:bg-emerald-500/10 transition-colors text-sm border-t border-slate-700 justify-center"
              >
                <Search size={14} />
                הצג את כל התוצאות עבור "{query}"
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
