import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const KEY = (uid) => `yad2_favorites_${uid || 'guest'}`;

const load = (uid) => {
  try { return JSON.parse(localStorage.getItem(KEY(uid)) || '{}'); }
  catch { return {}; }
};

const save = (uid, data) => {
  localStorage.setItem(KEY(uid), JSON.stringify(data));
};

/**
 * useFavorites — manages a per-user favorites list in localStorage.
 * Stores a mini-snapshot of each listing so the Favorites page
 * can render without extra API calls.
 *
 * mini shape: { id, title, price, category, condition, location, date, images: [first] }
 */
export function useFavorites() {
  const { user } = useAuth();
  const uid = user?.id || null;

  const [favorites, setFavorites] = useState(() => load(uid));

  // Reload when user changes (login / logout)
  useEffect(() => {
    setFavorites(load(uid));
  }, [uid]);

  const isFavorite = useCallback(
    (id) => !!favorites[id],
    [favorites]
  );

  const toggleFavorite = useCallback(
    (listing) => {
      const id = listing?.id;
      if (!id) return;

      setFavorites((prev) => {
        const next = { ...prev };
        if (next[id]) {
          delete next[id];
        } else {
          next[id] = {
            id,
            title:     listing.title,
            price:     listing.price,
            category:  listing.category,
            condition: listing.condition,
            location:  listing.location,
            date:      listing.date || listing.createdAt || null,
            images:    listing.images ? [listing.images[0]] : [],
            rating:    listing.rating || null,
            views:     listing.views  || 0,
          };
        }
        save(uid, next);
        return next;
      });
    },
    [uid]
  );

  const favoritesList = Object.values(favorites);

  return { isFavorite, toggleFavorite, favoritesList };
}
