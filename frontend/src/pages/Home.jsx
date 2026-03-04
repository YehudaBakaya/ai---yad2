import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, TrendingUp, Zap, ArrowLeft } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import { getListings, seedDemoListings } from '../services/firestoreService';

const categories = [
  { id: 'real_estate', name: 'נדל"ן',     icon: '🏠', color: 'from-blue-600 to-blue-800' },
  { id: 'vehicles',   name: 'רכבים',       icon: '🚗', color: 'from-purple-600 to-purple-800' },
  { id: 'electronics',name: 'אלקטרוניקה', icon: '📱', color: 'from-cyan-600 to-cyan-800' },
  { id: 'furniture',  name: 'ריהוט',       icon: '🛋️', color: 'from-amber-600 to-amber-800' },
  { id: 'clothing',   name: 'ביגוד',       icon: '👕', color: 'from-pink-600 to-pink-800' },
  { id: 'sports',     name: 'ספורט',       icon: '⚽', color: 'from-emerald-600 to-emerald-800' },
  { id: 'pets',       name: 'חיות מחמד',  icon: '🐱', color: 'from-orange-600 to-orange-800' },
  { id: 'services',   name: 'שירותים',     icon: '🔧', color: 'from-teal-600 to-teal-800' },
];

const stats = [
  { label: 'מודעות פעילות', value: '12,400+' },
  { label: 'משתמשים',       value: '58,000+' },
  { label: 'עסקאות הושלמו', value: '94,000+' },
];

const FEATURED_CACHE = 'yad2_featured_v2';
const toCache = (items) => items.map(l => ({ ...l, date: l.date?.toMillis?.() ?? l.date ?? null }));

export default function Home() {
  const [listings, setListings]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredCat, setHoveredCat] = useState(null);

  useEffect(() => {
    // 1. Show cached data immediately (stale-while-revalidate)
    try {
      const cached = JSON.parse(localStorage.getItem(FEATURED_CACHE) || 'null');
      if (cached?.length) {
        setListings(cached);
        setLoading(false);
      }
    } catch {}

    // 2. Fetch fresh from Firestore in background
    const fetchFresh = async () => {
      try {
        if (!localStorage.getItem('yad2_seeded')) {
          await seedDemoListings();
          localStorage.setItem('yad2_seeded', '1');
        }
        const { results } = await getListings();
        const fresh = results.slice(0, 6);
        setListings(fresh);
        localStorage.setItem(FEATURED_CACHE, JSON.stringify(toCache(fresh)));
      } catch (error) {
        console.error('Error fetching listings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFresh();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/listings?search=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">

      {/* ===== HERO ===== */}
      <section className="hero-gradient text-white py-20 px-4 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-800/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-10 animate-fadeIn">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-4 py-1.5 rounded-full text-sm font-medium mb-5">
              <Zap size={14} className="text-yellow-300" />
              <span>מופעל בבינה מלאכותית</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight">
              יד2 עם <span className="bg-gradient-to-r from-violet-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">AI</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-xl mx-auto">
              הפלטפורמה הכי חכמה לקנייה ומכירה בישראל — עם ניהול מחיר אוטומטי ותיאורים מושלמים
            </p>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto animate-slideUp">
            <div className="flex-1 flex items-center bg-white/10 backdrop-blur border border-white/20 rounded-xl overflow-hidden focus-within:border-yellow-300 focus-within:bg-white/15 transition-all duration-300">
              <Search size={20} className="text-white/60 mx-3 shrink-0" />
              <input
                type="text"
                placeholder="חפש מודעות, מוצרים, שירותים..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-white placeholder-white/50 py-3"
              />
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold px-6 py-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-violet-500/30"
            >
              חיפוש
            </button>
          </form>

          {/* Stats */}
          <div className="flex justify-center gap-8 mt-10 animate-fadeIn">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-extrabold bg-gradient-to-r from-violet-300 to-cyan-300 bg-clip-text text-transparent">{s.value}</div>
                <div className="text-white/60 text-xs mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-7 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
          <h2 className="text-2xl font-bold text-white">קטגוריות</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {categories.map((cat, i) => (
            <Link
              key={cat.id}
              to={`/listings?category=${cat.id}`}
              onMouseEnter={() => setHoveredCat(cat.id)}
              onMouseLeave={() => setHoveredCat(null)}
              style={{ animationDelay: `${i * 50}ms` }}
              className="animate-fadeIn"
            >
              <div className={`relative bg-slate-800 border border-slate-700 rounded-xl p-4 text-center transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer overflow-hidden
                ${hoveredCat === cat.id ? 'border-transparent' : ''}`}>
                {/* Gradient bg on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 transition-opacity duration-300 ${hoveredCat === cat.id ? 'opacity-100' : ''}`} />
                <div className="relative z-10">
                  <div className={`text-3xl mb-2 transition-transform duration-300 ${hoveredCat === cat.id ? 'scale-125' : ''}`}>
                    {cat.icon}
                  </div>
                  <div className="text-xs font-semibold text-gray-300 group-hover:text-white transition-colors">
                    {cat.name}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== FEATURED LISTINGS ===== */}
      <section className="max-w-6xl mx-auto px-4 py-10 border-t border-slate-800">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-1 h-7 bg-gradient-to-b from-amber-400 to-orange-500 rounded-full" />
            <TrendingUp className="text-amber-400" size={22} />
            <h2 className="text-2xl font-bold text-white">מודעות הטרנדים</h2>
          </div>
          <Link
            to="/listings"
            className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors group"
          >
            <span>הכל</span>
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-slate-800 rounded-xl h-72 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            to="/listings"
            className="btn-shimmer inline-block text-white font-bold py-3 px-10 rounded-xl shadow-lg shadow-blue-500/30"
          >
            ראה את כל המודעות →
          </Link>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-14 px-4 mt-6">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-slate-800 to-slate-800/50 border border-slate-700 rounded-2xl p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-600/15 to-cyan-600/10 pointer-events-none" />
          <div className="relative z-10">
            <div className="text-4xl mb-4">🚀</div>
            <h2 className="text-3xl font-bold text-white mb-3">רוצה למכור משהו?</h2>
            <p className="text-gray-400 mb-7 text-base max-w-md mx-auto">
              AI שלנו יכתוב תיאור מושלם וינהל משא ומתן בשבילך — בדקות ספורות
            </p>
            <Link
              to="/create"
              className="inline-block bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white font-bold py-3.5 px-10 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/30"
            >
              פרסם מודעה חינם עכשיו ✨
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-slate-800 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-gray-500 text-sm">
          <p className="font-medium text-gray-400">&copy; 2026 יד2 AI</p>
          <p className="mt-1">פלטפורמה פתוחה עם AI מודרני לקנייה ומכירה</p>
        </div>
      </footer>
    </div>
  );
}
