import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X, SlidersHorizontal, Sparkles } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import { listingsAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const CONDITION_IDS  = ['חדש', 'מעולה', 'טוב', 'סביר', 'דורש תיקון'];
const CATEGORY_IDS   = ['', 'real_estate', 'vehicles', 'electronics', 'furniture', 'clothing', 'sports', 'pets', 'services'];
const CATEGORY_ICONS = { '': '✦', real_estate: '🏠', vehicles: '🚗', electronics: '📱', furniture: '🛋️', clothing: '👕', sports: '⚽', pets: '🐱', services: '🔧' };

const CACHE_TTL = 3 * 60 * 1000;
const cacheKey  = (cat) => `yad2_listings_${cat || 'all'}_v3`;

export default function Listings() {
  const { t, tCond, tCat } = useLanguage();
  const [searchParams] = useSearchParams();
  const [listings, setListings]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search:    searchParams.get('search')    || '',
    category:  searchParams.get('category')  || '',
    minPrice:  searchParams.get('minPrice')  || '',
    maxPrice:  searchParams.get('maxPrice')  || '',
    location:  searchParams.get('location')  || '',
    condition: searchParams.get('condition') || '',
  });

  useEffect(() => {
    const noText = !(filters.search || filters.minPrice || filters.maxPrice || filters.location || filters.condition);

    if (noText) {
      try {
        const raw = JSON.parse(localStorage.getItem(cacheKey(filters.category)) || 'null');
        if (raw?.ts && Date.now() - raw.ts < CACHE_TTL && raw.data?.length) {
          setListings(raw.data);
          setLoading(false);
        }
      } catch {}
    }

    const params = {};
    if (filters.category)  params.category  = filters.category;
    if (filters.search)    params.search     = filters.search;
    if (filters.minPrice)  params.minPrice   = filters.minPrice;
    if (filters.maxPrice)  params.maxPrice   = filters.maxPrice;
    if (filters.location)  params.location   = filters.location;
    if (filters.condition) params.condition  = filters.condition;

    setLoading(true);
    listingsAPI.getAll(params)
      .then(({ data }) => {
        setListings(data);
        if (noText) {
          localStorage.setItem(cacheKey(filters.category), JSON.stringify({ ts: Date.now(), data }));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters]);

  const handleFilterChange = (key, value) =>
    setFilters((prev) => ({ ...prev, [key]: value }));

  const handleClearFilters = () =>
    setFilters({ search: '', category: '', minPrice: '', maxPrice: '', location: '', condition: '' });

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6 animate-fadeIn">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-8 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full" />
            <div>
              <h1 className="text-2xl font-bold text-white leading-tight">
                {t('listings.title')}
              </h1>
              {!loading && (
                <p className="text-gray-500 text-xs mt-0.5">
                  {listings.length} {t('listings.results')}
                </p>
              )}
            </div>
          </div>

          {/* Search + Filter bar */}
          <div className="flex gap-2">
            <div className="flex-1 flex items-center glass-medium rounded-xl overflow-hidden focus-within:border-emerald-500/40 focus-within:shadow-[0_0_0_1px_rgba(16,185,129,0.2)] transition-all duration-300">
              <Search size={16} className="text-gray-500 mx-3 shrink-0" />
              <input
                type="text"
                placeholder={t('listings.search')}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="flex-1 bg-transparent outline-none text-gray-100 placeholder-gray-600 py-3 text-sm border-0 shadow-none"
                style={{ background: 'transparent', boxShadow: 'none' }}
              />
              {filters.search && (
                <button onClick={() => handleFilterChange('search', '')} className="mx-2.5 text-gray-600 hover:text-gray-300 transition-colors">
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 py-3 px-4 rounded-xl border font-medium text-sm transition-all duration-200
                ${showFilters || activeFiltersCount > 0
                  ? 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
                  : 'glass text-gray-400 hover:border-emerald-500/30 hover:text-white'}`}
            >
              <SlidersHorizontal size={15} />
              <span className="hidden sm:inline">{t('listings.filters')}</span>
              {activeFiltersCount > 0 && (
                <span className="bg-emerald-500 text-white text-[10px] font-bold w-4.5 h-4.5 px-1.5 py-0.5 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          {CATEGORY_IDS.map((id) => (
            <button
              key={id}
              onClick={() => handleFilterChange('category', id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200
                ${filters.category === id
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                  : 'glass text-gray-400 hover:text-white hover:border-emerald-500/30'}`}
            >
              <span className="text-sm">{CATEGORY_ICONS[id]}</span>
              <span>{id === '' ? t('cat.all') : tCat(id)}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">

          {/* Filters Sidebar */}
          {showFilters && (
            <div className="lg:col-span-1 animate-slideUp">
              <div className="glass-medium rounded-2xl p-5 sticky top-20">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Filter size={14} className="text-emerald-400" />
                    {t('listings.advFilters')}
                  </h3>
                  {activeFiltersCount > 0 && (
                    <button onClick={handleClearFilters} className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 transition-colors">
                      <X size={12} />
                      {t('listings.clearAll')}
                    </button>
                  )}
                </div>

                <div className="space-y-5">
                  {/* Price range */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">
                      {t('listings.priceRange')}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder={t('listings.min')}
                        value={filters.minPrice}
                        onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                        className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-gray-300 placeholder-gray-600 text-xs focus:border-emerald-500/50 focus:outline-none transition-colors"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                      />
                      <input
                        type="number"
                        placeholder={t('listings.max')}
                        value={filters.maxPrice}
                        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                        className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-gray-300 placeholder-gray-600 text-xs focus:border-emerald-500/50 focus:outline-none transition-colors"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">
                      {t('listings.location')}
                    </label>
                    <input
                      type="text"
                      placeholder={t('listings.cityArea')}
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-gray-300 placeholder-gray-600 text-xs focus:border-emerald-500/50 focus:outline-none transition-colors"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    />
                  </div>

                  {/* Condition */}
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2.5">
                      {t('listings.condition')}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {CONDITION_IDS.map((cond) => (
                        <button
                          key={cond}
                          onClick={() => handleFilterChange('condition', filters.condition === cond ? '' : cond)}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all
                            ${filters.condition === cond
                              ? 'bg-emerald-600 text-white'
                              : 'glass text-gray-400 hover:text-white hover:border-emerald-500/30'}`}
                        >
                          {tCond(cond)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Listings Grid */}
          <div className={showFilters ? 'lg:col-span-3' : 'lg:col-span-4'}>
            {loading ? (
              <SkeletonGrid count={6} />
            ) : listings.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="text-center py-24 animate-fadeIn">
                <div className="w-20 h-20 glass rounded-3xl flex items-center justify-center mx-auto mb-5">
                  <Sparkles size={32} className="text-gray-600" />
                </div>
                <p className="text-gray-300 text-lg font-semibold mb-2">{t('listings.noResults')}</p>
                <p className="text-gray-600 text-sm mb-7">{t('listings.tryChange')}</p>
                <button
                  onClick={handleClearFilters}
                  className="btn-glow text-white px-7 py-2.5 rounded-xl text-sm font-semibold"
                >
                  {t('listings.clearFilters')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid({ count }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden border border-white/[0.05]">
          <div className="skeleton h-48" />
          <div className="bg-slate-800 p-4 space-y-3">
            <div className="skeleton h-4 rounded-xl w-3/4" />
            <div className="skeleton h-3 rounded-xl w-1/2" />
            <div className="skeleton h-3 rounded-xl w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
