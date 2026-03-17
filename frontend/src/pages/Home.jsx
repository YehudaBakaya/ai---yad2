import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, TrendingUp, Zap, Sparkles, ChevronLeft } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import { listingsAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useRecommendations } from '../hooks/useRecommendations';

const CATEGORIES = [
  { id: 'real_estate', icon: '🏠', grad: ['#4F46E5','#6366f1'] },
  { id: 'vehicles',    icon: '🚗', grad: ['#7C3AED','#8B5CF6'] },
  { id: 'electronics', icon: '📱', grad: ['#0891B2','#06B6D4'] },
  { id: 'furniture',   icon: '🛋️', grad: ['#D97706','#F59E0B'] },
  { id: 'clothing',    icon: '👕', grad: ['#DB2777','#EC4899'] },
  { id: 'sports',      icon: '⚽', grad: ['#059669','#10B981'] },
  { id: 'pets',        icon: '🐱', grad: ['#EA580C','#F97316'] },
  { id: 'services',    icon: '🔧', grad: ['#0D9488','#14B8A6'] },
];

const STATS = [
  { key: 'home.stat.listings', value: '12,400+' },
  { key: 'home.stat.users',    value: '58,000+' },
  { key: 'home.stat.deals',    value: '94,000+' },
];

const FEATURED_CACHE = 'yad2_featured_v3';

export default function Home() {
  const { t, tCat } = useLanguage();
  const { user } = useAuth();
  const { recommendations, loading: recLoading, bestCategory, mode: recMode } = useRecommendations();
  const [listings, setListings]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredCat, setHoveredCat]   = useState(null);

  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(FEATURED_CACHE) || 'null');
      if (cached?.length) { setListings(cached); setLoading(false); }
    } catch {}
    listingsAPI.getAll()
      .then(({ data }) => {
        const fresh = data.slice(0, 6);
        setListings(fresh);
        localStorage.setItem(FEATURED_CACHE, JSON.stringify(fresh));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) window.location.href = `/listings?search=${encodeURIComponent(searchQuery)}`;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-page)', transition: 'background 0.4s' }}>

      {/* ─── HERO ─────────────────────────────────────── */}
      <section style={{ position: 'relative', overflow: 'hidden', paddingTop: '80px', paddingBottom: '100px' }}>
        {/* Animated aurora orbs */}
        <div className="animate-aurora" style={{ position: 'absolute', top: '-10%', right: '10%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(40px)' }} />
        <div className="animate-aurora" style={{ position: 'absolute', bottom: '-20%', left: '5%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(50px)', animationDelay: '4s' }} />
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: '800px', height: '300px', background: 'radial-gradient(ellipse, rgba(16,185,129,0.06) 0%, transparent 70%)', pointerEvents: 'none', filter: 'blur(30px)' }} />

        {/* Subtle grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.025,
          backgroundImage: 'linear-gradient(rgba(128,128,128,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.8) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div className="max-w-4xl mx-auto px-4 relative" style={{ zIndex: 1, textAlign: 'center' }}>

          {/* AI badge */}
          <div className="animate-fadeIn" style={{ marginBottom: '24px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: 'rgba(16,185,129,0.1)', backdropFilter: 'blur(16px)',
              border: '1px solid rgba(16,185,129,0.25)',
              padding: '6px 16px', borderRadius: '99px',
              color: '#34D399', fontSize: '13px', fontWeight: '600',
            }}>
              <Zap size={12} fill="#FBBF24" color="#FBBF24" />
              {t('home.aiPowered')}
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34D399', boxShadow: '0 0 8px #34D399', animation: 'pulse 2s infinite' }} />
            </div>
          </div>

          {/* Headline */}
          <h1 className="animate-fadeIn" style={{ fontSize: 'clamp(42px,8vw,80px)', fontWeight: '900', lineHeight: 1.05, letterSpacing: '-2px', color: 'var(--text-primary)', marginBottom: '20px', animationDelay: '0.1s' }}>
            {t('home.title')}{' '}
            <span className="text-gradient-emerald">AI</span>
          </h1>

          <p className="animate-fadeIn" style={{ fontSize: '17px', color: 'var(--text-secondary)', maxWidth: '480px', margin: '0 auto 40px', lineHeight: 1.7, animationDelay: '0.2s' }}>
            {t('home.subtitle')}
          </p>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="animate-slideUp" style={{ display: 'flex', gap: '8px', maxWidth: '600px', margin: '0 auto', animationDelay: '0.3s' }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center',
              background: 'var(--bg-input)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--border-mid)',
              borderRadius: '16px', overflow: 'hidden',
              transition: 'border-color 0.3s, box-shadow 0.3s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-mid)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <Search size={18} style={{ color: 'var(--text-dim)', margin: '0 14px', flexShrink: 0 }} />
              <input
                type="text"
                placeholder={t('home.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', padding: '14px 0', fontSize: '14px', boxShadow: 'none' }}
              />
            </div>
            <button type="submit" className="btn-glow" style={{ padding: '14px 28px', borderRadius: '16px', color: 'white', fontWeight: '700', fontSize: '14px', border: 'none', flexShrink: 0 }}>
              {t('home.search')}
            </button>
          </form>

          {/* Stats */}
          <div className="animate-fadeIn" style={{ display: 'flex', justifyContent: 'center', gap: '48px', marginTop: '52px', animationDelay: '0.4s' }}>
            {STATS.map((s) => (
              <div key={s.key} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '28px', fontWeight: '900', color: 'var(--text-primary)', letterSpacing: '-1px' }}>{s.value}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px', fontWeight: '500' }}>{t(s.key)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CATEGORIES ──────────────────────────────── */}
      <section style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 16px 60px' }}>
        <SectionTitle accent="emerald" title={t('home.categories')} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }} className="sm:grid-cols-8" >
          {CATEGORIES.map((cat, i) => (
            <Link key={cat.id} to={`/listings?category=${cat.id}`}
              onMouseEnter={() => setHoveredCat(cat.id)}
              onMouseLeave={() => setHoveredCat(null)}
              style={{ textDecoration: 'none', animationDelay: `${i * 40}ms` }}
              className="animate-fadeIn"
            >
              <div style={{
                position: 'relative', overflow: 'hidden',
                borderRadius: '18px', padding: '20px 12px 16px',
                textAlign: 'center', cursor: 'pointer',
                background: hoveredCat === cat.id
                  ? `linear-gradient(135deg, ${cat.grad[0]}22, ${cat.grad[1]}33)`
                  : 'var(--bg-glass)',
                border: hoveredCat === cat.id
                  ? `1px solid ${cat.grad[1]}55`
                  : '1px solid var(--border-dim)',
                transform: hoveredCat === cat.id ? 'translateY(-4px) scale(1.03)' : 'none',
                boxShadow: hoveredCat === cat.id ? `0 12px 40px ${cat.grad[0]}30` : 'none',
                transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              }}>
                {hoveredCat === cat.id && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: `radial-gradient(circle at 50% 60%, ${cat.grad[0]}15 0%, transparent 70%)`,
                    pointerEvents: 'none',
                  }} />
                )}
                <div style={{ fontSize: '28px', marginBottom: '8px', transition: 'transform 0.3s', transform: hoveredCat === cat.id ? 'scale(1.2)' : 'none', display: 'block' }}>
                  {cat.icon}
                </div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: hoveredCat === cat.id ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1.3 }}>
                  {tCat(cat.id)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── RECOMMENDATIONS ─────────────────────────── */}
      {user && (recLoading || recommendations.length > 0) && (
        <section style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 16px 60px', borderTop: '1px solid var(--border-dim)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
            <SectionTitle
              accent="violet"
              icon={<Sparkles size={18} color="#A78BFA" />}
              title={recMode === 'personalized' ? 'מומלץ עבורך' : 'פופולרי עכשיו'}
              subtitle={recMode === 'personalized' ? `בהתבסס על המועדפים שלך · ${tCat(bestCategory)}` : 'הוסף מועדפים וקבל המלצות אישיות'}
              inline
            />
            <Link to={recMode === 'personalized' && bestCategory ? `/listings?category=${bestCategory}` : '/listings'}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#A78BFA', fontSize: '13px', fontWeight: '600', textDecoration: 'none', transition: 'color 0.2s' }}
              className="hover:text-violet-300 group">
              <span>{recMode === 'personalized' && bestCategory ? `עוד ב${tCat(bestCategory)}` : 'כל המוצרים'}</span>
              <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>
          {recLoading ? <SkeletonGrid count={3} /> : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '16px' }}>
              {recommendations.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}
        </section>
      )}

      {/* ─── TRENDING ────────────────────────────────── */}
      <section style={{ maxWidth: '1152px', margin: '0 auto', padding: '0 16px 60px', borderTop: '1px solid var(--border-dim)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
          <SectionTitle accent="amber" icon={<TrendingUp size={18} color="#FBBF24" />} title={t('home.trending')} inline />
          <Link to="/listings"
            style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#34D399', fontSize: '13px', fontWeight: '600', textDecoration: 'none', transition: 'color 0.2s' }}
            className="hover:text-emerald-300 group">
            <span>{t('home.viewAll')}</span>
            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? <SkeletonGrid count={6} /> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '16px' }}>
            {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <Link to="/listings" className="btn-shimmer" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            color: 'white', fontWeight: '700', padding: '14px 40px',
            borderRadius: '14px', textDecoration: 'none',
            boxShadow: '0 8px 32px rgba(16,185,129,0.25)',
          }}>
            {t('home.viewAllBtn')}
            <ChevronLeft size={15} />
          </Link>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────── */}
      <section style={{ padding: '0 16px 80px' }}>
        <div style={{
          maxWidth: '800px', margin: '0 auto', position: 'relative', overflow: 'hidden',
          borderRadius: '28px',
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-card-end) 100%)',
          border: '1px solid rgba(16,185,129,0.2)',
          boxShadow: '0 0 80px rgba(16,185,129,0.08), inset 0 1px 0 var(--border-subtle)',
        }}>
          {/* Aurora in CTA */}
          <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-30%', left: '5%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.09) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }} />
          {/* Grid */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: '28px', opacity: 0.03, backgroundImage: 'linear-gradient(rgba(128,128,128,1) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,1) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', textAlign: 'center', padding: '60px 40px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'linear-gradient(135deg, #059669, #10B981)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 32px rgba(16,185,129,0.4)', fontSize: '28px' }}>
              🚀
            </div>
            <h2 style={{ fontSize: '32px', fontWeight: '900', color: 'var(--text-primary)', marginBottom: '12px', letterSpacing: '-0.5px' }}>{t('home.ctaTitle')}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', maxWidth: '400px', margin: '0 auto 32px', lineHeight: 1.7 }}>{t('home.ctaDesc')}</p>
            <Link to="/create" className="btn-glow" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              color: 'white', fontWeight: '700', padding: '16px 40px',
              borderRadius: '14px', textDecoration: 'none', fontSize: '15px',
            }}>
              <Zap size={16} fill="white" color="white" />
              {t('home.ctaBtn')}
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid var(--border-dim)', padding: '32px 16px' }}>
        <div className="max-w-6xl mx-auto" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #10B981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: '8px', fontWeight: '900' }}>S2B</span>
            </div>
            <span style={{ color: 'var(--text-secondary)', fontWeight: '700', fontSize: '13px' }}>S2B AI</span>
          </div>
          <p style={{ color: 'var(--text-dim)', fontSize: '12px' }}>{t('home.footer')}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '11px' }}>{t('home.footerSub')}</p>
        </div>
      </footer>
    </div>
  );
}

function SectionTitle({ accent, icon, title, subtitle, inline = false }) {
  const colors = { emerald: '#10B981', violet: '#8B5CF6', amber: '#F59E0B' };
  if (inline) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '3px', height: '28px', borderRadius: '99px', background: `linear-gradient(to bottom, ${colors[accent]}, ${colors[accent]}88)` }} />
        {icon}
        <div>
          <div style={{ color: 'var(--text-primary)', fontWeight: '800', fontSize: '18px', lineHeight: 1.2 }}>{title}</div>
          {subtitle && <div style={{ color: 'var(--text-dim)', fontSize: '12px', marginTop: '2px' }}>{subtitle}</div>}
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
      <div style={{ width: '3px', height: '28px', borderRadius: '99px', background: `linear-gradient(to bottom, ${colors[accent]}, ${colors[accent]}88)` }} />
      {icon}
      <h2 style={{ color: 'var(--text-primary)', fontWeight: '800', fontSize: '20px', margin: 0 }}>{title}</h2>
    </div>
  );
}

function SkeletonGrid({ count }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '16px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-dim)' }}>
          <div className="skeleton" style={{ height: '200px' }} />
          <div style={{ background: 'var(--bg-card)', padding: '16px' }}>
            <div className="skeleton" style={{ height: '14px', borderRadius: '8px', width: '75%', marginBottom: '10px' }} />
            <div className="skeleton" style={{ height: '12px', borderRadius: '8px', width: '50%', marginBottom: '8px' }} />
            <div className="skeleton" style={{ height: '12px', borderRadius: '8px', width: '100%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
