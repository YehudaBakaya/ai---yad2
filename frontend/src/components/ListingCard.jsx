import React, { useState } from 'react';
import { Eye, MapPin, Star, Heart, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../hooks/useFavorites';
import { useLanguage } from '../contexts/LanguageContext';

const CONDITION_COLOR = {
  'חדש':        { bg: 'rgba(16,185,129,0.15)', text: '#34D399', border: 'rgba(16,185,129,0.3)' },
  'מעולה':      { bg: 'rgba(139,92,246,0.15)', text: '#A78BFA', border: 'rgba(139,92,246,0.3)' },
  'טוב':        { bg: 'rgba(56,189,248,0.15)',  text: '#7DD3FC', border: 'rgba(56,189,248,0.3)' },
  'סביר':       { bg: 'rgba(245,158,11,0.15)',  text: '#FCD34D', border: 'rgba(245,158,11,0.3)' },
  'דורש תיקון':{ bg: 'rgba(239,68,68,0.15)',   text: '#FCA5A5', border: 'rgba(239,68,68,0.3)'  },
};

export default function ListingCard({ listing }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { t, tCond, tCat, lang } = useLanguage();
  const saved = isFavorite(listing.id);
  const [heartAnim, setHeartAnim] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  const formatDate = (date) => {
    const d = date?.toDate ? date.toDate() : new Date(date);
    if (isNaN(d)) return '';
    const diff = Date.now() - d.getTime();
    if (diff < 60000)     return t('card.justNow');
    if (diff < 3600000)   return t('card.minsAgo',  { n: Math.floor(diff / 60000) });
    if (diff < 86400000)  return t('card.hoursAgo', { n: Math.floor(diff / 3600000) });
    if (diff < 604800000) return t('card.daysAgo',  { n: Math.floor(diff / 86400000) });
    return d.toLocaleDateString(lang === 'he' ? 'he-IL' : 'en-US');
  };

  const toggleSave = (e) => {
    e.preventDefault();
    toggleFavorite(listing);
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 300);
  };

  const cond = CONDITION_COLOR[listing.condition];
  const categoryLabel = listing.categoryEn ? tCat(listing.categoryEn) : listing.category;

  return (
    <Link to={`/listings/${listing.id}`} className="block group">
      <div className="card-hover rounded-2xl overflow-hidden animate-fadeIn">

        {/* ── Image ─────────────────────────── */}
        <div className="relative overflow-hidden" style={{ height: '200px' }}>
          {/* Skeleton while loading */}
          {!imgLoaded && <div className="absolute inset-0 skeleton" />}

          <img
            src={listing.images?.[0] || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600'}
            alt={listing.title}
            onLoad={() => setImgLoaded(true)}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            style={{ opacity: imgLoaded ? 1 : 0, transition: 'opacity 0.3s, transform 0.7s' }}
          />

          {/* Deep gradient overlay */}
          <div className="absolute inset-0" style={{ background: 'var(--overlay-img)' }} />

          {/* Top row: category + save */}
          <div className="absolute top-3 right-3 left-3 flex items-start justify-between">
            <div style={{
              background: 'var(--overlay-badge)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(128,128,128,0.2)',
              color: 'var(--text-primary)',
              fontSize: '11px',
              fontWeight: '600',
              padding: '4px 10px',
              borderRadius: '10px',
              letterSpacing: '0.02em',
            }}>
              {categoryLabel}
            </div>

            <button
              onClick={toggleSave}
              style={{
                width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '10px',
                background: saved ? 'rgba(239,68,68,0.9)' : 'var(--overlay-badge)',
                backdropFilter: 'blur(12px)',
                border: `1px solid ${saved ? 'rgba(239,68,68,0.5)' : 'rgba(128,128,128,0.2)'}`,
                transition: 'all 0.2s',
              }}
            >
              <Heart
                size={14}
                className={heartAnim ? 'animate-heartbeat' : ''}
                style={{
                  fill: saved ? 'white' : 'none',
                  color: saved ? 'white' : 'var(--text-primary)',
                }}
              />
            </button>
          </div>

          {/* Bottom: price */}
          <div className="absolute bottom-3 right-3 left-3 flex items-end justify-between">
            <div>
              {listing.price === 0 ? (
                <div style={{
                  background: 'linear-gradient(135deg, #059669, #34D399)',
                  color: 'white', fontSize: '13px', fontWeight: '800',
                  padding: '4px 12px', borderRadius: '10px',
                  boxShadow: '0 4px 16px rgba(16,185,129,0.4)',
                }}>
                  {t('card.free')}
                </div>
              ) : (
                <div style={{ color: 'white', fontWeight: '800', fontSize: '22px', lineHeight: 1, textShadow: '0 2px 12px rgba(0,0,0,0.8)' }}>
                  ₪{listing.price?.toLocaleString()}
                </div>
              )}
            </div>

            {listing.rating && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: 'rgba(245,158,11,0.2)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(245,158,11,0.3)',
                color: '#FCD34D', fontSize: '11px', fontWeight: '700',
                padding: '4px 8px', borderRadius: '10px',
              }}>
                <Star size={10} fill="#FCD34D" />
                {listing.rating}
              </div>
            )}
          </div>
        </div>

        {/* ── Content ───────────────────────── */}
        <div className="p-4 pt-3.5">
          <h3
            className="font-bold mb-2.5 line-clamp-2 transition-colors duration-200 group-hover:text-emerald-400"
            style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.4' }}
          >
            {listing.title}
          </h3>

          {/* Condition pill */}
          {cond && (
            <div style={{
              display: 'inline-flex', alignItems: 'center',
              background: cond.bg, color: cond.text,
              border: `1px solid ${cond.border}`,
              fontSize: '11px', fontWeight: '600',
              padding: '3px 10px', borderRadius: '8px', marginBottom: '12px',
            }}>
              {tCond(listing.condition)}
            </div>
          )}

          {/* Meta row */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderTop: '1px solid var(--border-dim)',
            paddingTop: '10px', fontSize: '11px', color: 'var(--text-dim)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={11} color="#10B981" />
              <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {listing.location}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Clock size={10} />
                {formatDate(listing.date)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Eye size={10} />
                {(listing.views || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
