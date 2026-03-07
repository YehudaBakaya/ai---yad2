import React, { useState } from 'react';
import { Eye, MapPin, Calendar, Star, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';
import { useLanguage } from '../contexts/LanguageContext';

export default function ListingCard({ listing }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { t, tCond, tCat, lang } = useLanguage();
  const saved = isFavorite(listing.id);
  const [heartAnim, setHeartAnim] = useState(false);

  const formatDate = (date) => {
    const d = date?.toDate ? date.toDate() : new Date(date);
    if (isNaN(d)) return '';
    const diff = Date.now() - d.getTime();
    if (diff < 60000)    return t('card.justNow');
    if (diff < 3600000)  return t('card.minsAgo',  { n: Math.floor(diff / 60000) });
    if (diff < 86400000) return t('card.hoursAgo', { n: Math.floor(diff / 3600000) });
    if (diff < 604800000)return t('card.daysAgo',  { n: Math.floor(diff / 86400000) });
    return d.toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US');
  };

  const toggleSave = (e) => {
    e.preventDefault();
    toggleFavorite(listing);
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 300);
  };

  const conditionColor = {
    'חדש':         'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
    'מעולה':       'bg-violet-500/20 text-violet-300 border border-violet-500/40',
    'טוב':         'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40',
    'סביר':        'bg-amber-500/20 text-amber-300 border border-amber-500/40',
    'דורש תיקון': 'bg-red-500/20 text-red-300 border border-red-500/40',
  };

  const categoryLabel = listing.categoryEn ? tCat(listing.categoryEn) : listing.category;

  return (
    <Link to={`/listings/${listing.id}`}>
      <div className="card-hover bg-slate-800 border border-slate-700 rounded-xl overflow-hidden cursor-pointer animate-fadeIn group">

        {/* Image */}
        <div className="relative h-44 bg-slate-700 overflow-hidden">
          <img
            src={listing.images?.[0] || 'https://via.placeholder.com/300x200?text=No+Image'}
            alt={listing.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent group-hover:from-black/50 transition-all duration-300" />

          {/* Category badge */}
          <div className="absolute top-2 right-2 bg-gradient-to-r from-violet-600/90 to-indigo-600/90 backdrop-blur text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-lg shadow-violet-500/30">
            {categoryLabel}
          </div>

          {/* Save button */}
          <button
            onClick={toggleSave}
            className="absolute top-2 left-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 backdrop-blur hover:bg-black/70 transition-all"
          >
            <Heart
              size={16}
              className={`transition-colors duration-200 ${heartAnim ? 'animate-heartbeat' : ''} ${saved ? 'fill-red-500 text-red-500' : 'text-white'}`}
            />
          </button>

          {listing.price === 0 && (
            <div className="absolute bottom-2 left-2 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {t('card.free')}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-base font-bold text-white mb-2 line-clamp-2 group-hover:text-violet-300 transition-colors duration-200">
            {listing.title}
          </h3>

          <div className="text-2xl font-extrabold mb-3 bg-gradient-to-r from-violet-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
            {listing.price === 0 ? t('card.free') : `₪${listing.price?.toLocaleString()}`}
          </div>

          <div className="flex gap-2 mb-3 text-xs">
            <span className={`px-2.5 py-1 rounded-full font-medium ${conditionColor[listing.condition] || 'bg-slate-700 text-gray-300'}`}>
              {tCond(listing.condition)}
            </span>
            {listing.rating && (
              <span className="flex items-center gap-1 bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full font-medium">
                <Star size={11} className="fill-amber-400 text-amber-400" />
                {listing.rating}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5 text-xs text-gray-400 border-t border-slate-700/60 pt-3">
            <div className="flex items-center gap-1.5">
              <MapPin size={13} className="text-cyan-400 shrink-0" />
              <span>{listing.location}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Calendar size={13} className="text-violet-400 shrink-0" />
                <span>{formatDate(listing.date)}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-500">
                <Eye size={13} />
                <span>{(listing.views || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
