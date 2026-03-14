import { useState, useEffect } from 'react';
import { useFavorites } from './useFavorites';
import { useViewHistory } from './useViewHistory';
import { listingsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

/** מחזיר קטגוריה הנפוצה ביותר ברשימת פריטים */
function topCategory(items) {
  const count = {};
  items.forEach((i) => { if (i.category) count[i.category] = (count[i.category] || 0) + 1; });
  return Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

export function useRecommendations() {
  const { user } = useAuth();
  const { favoritesList, isFavorite } = useFavorites();
  const { getHistory } = useViewHistory();

  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [bestCategory, setBestCategory]       = useState(null);
  const [mode, setMode]                       = useState('popular');

  useEffect(() => {
    setLoading(true);

    const history = getHistory(); // [{id, category, ...}]
    const viewedIds = new Set(history.map((h) => h.id));

    // משקל: מועדף = 2 נקודות, צפייה = 1 נקודה
    const combined = [
      ...favoritesList.map((f) => ({ ...f, w: 2 })),
      ...history.map((h) => ({ ...h, w: 1 })),
    ];

    const cat = topCategory(combined);

    if (cat) {
      setBestCategory(cat);
      setMode(favoritesList.length > 0 ? 'personalized' : 'history');

      listingsAPI.getAll({ category: cat })
        .then(({ data }) => {
          const filtered = data
            .filter((l) => !isFavorite(l.id) && !viewedIds.has(l.id))
            .slice(0, 6);
          // אם נשארו פחות מ-3 אחרי סינון, נוסיף גם צפויים
          setRecommendations(filtered.length >= 3 ? filtered : data.slice(0, 6));
        })
        .catch(() => setRecommendations([]))
        .finally(() => setLoading(false));
    } else {
      setBestCategory(null);
      setMode('popular');
      listingsAPI.getAll()
        .then(({ data }) => setRecommendations(data.slice(0, 6)))
        .catch(() => setRecommendations([]))
        .finally(() => setLoading(false));
    }
  }, [user?.id, favoritesList.length]); // eslint-disable-line

  return { recommendations, loading, bestCategory, mode };
}
