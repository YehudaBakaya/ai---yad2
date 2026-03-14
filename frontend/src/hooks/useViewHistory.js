import { useAuth } from '../contexts/AuthContext';

const MAX = 30;
const KEY = (uid) => `yad2_viewed_${uid || 'guest'}`;

export function useViewHistory() {
  const { user } = useAuth();
  const uid = user?.id || 'guest';

  const getHistory = () => {
    try { return JSON.parse(localStorage.getItem(KEY(uid)) || '[]'); }
    catch { return []; }
  };

  const addToHistory = (listing) => {
    if (!listing?.id) return;
    const history = getHistory();
    const filtered = history.filter((h) => h.id !== listing.id);
    const entry = {
      id:        listing.id,
      title:     listing.title,
      category:  listing.category,
      price:     listing.price,
      viewedAt:  Date.now(),
    };
    localStorage.setItem(KEY(uid), JSON.stringify([entry, ...filtered].slice(0, MAX)));
  };

  return { getHistory, addToHistory };
}
