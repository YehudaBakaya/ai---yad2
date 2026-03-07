import React from 'react';
import { Heart } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';
import ListingCard from '../components/ListingCard';
import { useLanguage } from '../contexts/LanguageContext';

export default function Favorites() {
  const { favoritesList } = useFavorites();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-900 pt-8 pb-16 px-4">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-500/20 border border-red-500/40 rounded-xl flex items-center justify-center">
            <Heart size={20} className="fill-red-500 text-red-500" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">{t('favorites.title')}</h1>
            <p className="text-gray-400 text-sm">{t('favorites.count', { n: favoritesList.length })}</p>
          </div>
        </div>

        {favoritesList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center mb-5">
              <Heart size={36} className="text-slate-600" />
            </div>
            <h2 className="text-white font-bold text-lg mb-2">{t('favorites.empty')}</h2>
            <p className="text-gray-500 text-sm max-w-xs">{t('favorites.emptyDesc')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {favoritesList.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
