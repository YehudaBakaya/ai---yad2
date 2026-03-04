import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import { listingsAPI } from '../services/api';

const conditions = ['חדש', 'מעולה', 'טוב', 'סביר', 'דורש תיקון'];

const categories = [
  { id: '',            name: 'הכל',          icon: '🌟' },
  { id: 'real_estate', name: 'נדל"ן',        icon: '🏠' },
  { id: 'vehicles',   name: 'רכבים',         icon: '🚗' },
  { id: 'electronics',name: 'אלקטרוניקה',   icon: '📱' },
  { id: 'furniture',  name: 'ריהוט',         icon: '🛋️' },
  { id: 'clothing',   name: 'ביגוד',         icon: '👕' },
  { id: 'sports',     name: 'ספורט',         icon: '⚽' },
  { id: 'pets',       name: 'חיות מחמד',    icon: '🐱' },
  { id: 'services',   name: 'שירותים',       icon: '🔧' },
];

const CACHE_TTL = 3 * 60 * 1000;
const cacheKey  = (cat) => `yad2_listings_${cat || 'all'}_v3`;

export default function Listings() {
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

    // Show cached data immediately (no-text filters only)
    if (noText) {
      try {
        const raw = JSON.parse(localStorage.getItem(cacheKey(filters.category)) || 'null');
        if (raw?.ts && Date.now() - raw.ts < CACHE_TTL && raw.data?.length) {
          setListings(raw.data);
          setLoading(false);
        }
      } catch {}
    }

    // Fetch fresh from MongoDB backend
    const params = {};
    if (filters.category)  params.category  = filters.category;
    if (filters.search)    params.search     = filters.search;
    if (filters.minPrice)  params.minPrice   = filters.minPrice;
    if (filters.maxPrice)  params.maxPrice   = filters.maxPrice;
    if (filters.location)  params.location   = filters.location;
    if (filters.condition) params.condition  = filters.condition;

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
            <div className="w-1 h-7 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full" />
            <h1 className="text-3xl font-bold text-white">
              מודעות
              {!loading && (
                <span className="mr-3 text-base font-normal text-gray-400">
                  ({listings.length} תוצאות)
                </span>
              )}
            </h1>
          </div>

          {/* Search + filter toggle */}
          <div className="flex gap-2">
            <div className="flex-1 flex items-center bg-slate-800 border border-slate-700 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all">
              <Search size={18} className="text-gray-400 mx-3 shrink-0" />
              <input
                type="text"
                placeholder="חפש מודעות..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="flex-1 bg-transparent outline-none text-gray-100 placeholder-gray-500 py-3 text-sm"
              />
              {filters.search && (
                <button onClick={() => handleFilterChange('search', '')} className="mx-2 text-gray-500 hover:text-gray-300">
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 py-3 px-4 rounded-xl border font-medium text-sm transition-all duration-200
                ${showFilters || activeFiltersCount > 0
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-slate-800 border-slate-700 text-gray-300 hover:border-blue-500 hover:text-white'}`}
            >
              <SlidersHorizontal size={17} />
              <span className="hidden sm:inline">סננים</span>
              {activeFiltersCount > 0 && (
                <span className="bg-white text-blue-600 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleFilterChange('category', cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200
                ${filters.category === cat.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 scale-105'
                  : 'bg-slate-800 border border-slate-700 text-gray-300 hover:border-blue-500 hover:text-white'}`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          {showFilters && (
            <div className="lg:col-span-1 animate-slideUp">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 sticky top-24">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Filter size={16} className="text-blue-400" />
                    סננים מתקדמים
                  </h3>
                  {activeFiltersCount > 0 && (
                    <button onClick={handleClearFilters} className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors">
                      <X size={13} />
                      נקה הכל
                    </button>
                  )}
                </div>

                <div className="space-y-5">
                  {/* Price Range */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-2 tracking-wide">טווח מחיר</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="מינ׳"
                        value={filters.minPrice}
                        onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                        className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-gray-300 placeholder-gray-500 text-sm focus:border-blue-500 focus:outline-none"
                      />
                      <input
                        type="number"
                        placeholder="מקס׳"
                        value={filters.maxPrice}
                        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                        className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-gray-300 placeholder-gray-500 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-2 tracking-wide">מיקום</label>
                    <input
                      type="text"
                      placeholder="עיר או אזור"
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                      className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-gray-300 placeholder-gray-500 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Condition pills */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-2 tracking-wide">מצב</label>
                    <div className="flex flex-wrap gap-2">
                      {conditions.map((cond) => (
                        <button
                          key={cond}
                          onClick={() => handleFilterChange('condition', filters.condition === cond ? '' : cond)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            filters.condition === cond
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-700 text-gray-400 hover:text-white border border-slate-600 hover:border-blue-500'
                          }`}
                        >
                          {cond}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-slate-800 rounded-xl h-72 animate-pulse" />
                ))}
              </div>
            ) : listings.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {listings.map((listing) => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>

              </>
            ) : (
              <div className="text-center py-20 animate-fadeIn">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-gray-400 text-lg mb-2">לא נמצאו מודעות</p>
                <p className="text-gray-500 text-sm mb-6">נסה לשנות את הסננים</p>
                <button
                  onClick={handleClearFilters}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-medium transition-all hover:scale-105"
                >
                  נקה סננים
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
