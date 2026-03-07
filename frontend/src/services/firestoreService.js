/**
 * firestoreService.js
 * כל פעולות Firestore ו-Firebase Storage עבור listings ו-deals.
 * Express backend נשאר רק לendpoints של AI.
 */

import {
  collection, addDoc, getDoc, getDocs, updateDoc, deleteDoc,
  doc, query, where, orderBy, limit, onSnapshot, serverTimestamp,
  setDoc, increment, startAfter,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

// ── Category label map ──────────────────────────────────────────────────────
const CAT_NAMES = {
  real_estate: 'נדל"ן',
  vehicles:    'רכבים',
  electronics: 'אלקטרוניקה',
  furniture:   'ריהוט',
  clothing:    'ביגוד',
  sports:      'ספורט',
  pets:        'חיות מחמד',
  services:    'שירותים',
};

// ── Image upload ──────────────────────────────────────────────────────────────

/**
 * מקבל base64 dataURL או קובץ Blob ומעלה ל-Firebase Storage.
 * מחזיר את ה-download URL הציבורי.
 */
export const uploadImage = async (dataUrlOrBlob, path) => {
  let blob = dataUrlOrBlob;
  if (typeof dataUrlOrBlob === 'string' && dataUrlOrBlob.startsWith('data:')) {
    const res = await fetch(dataUrlOrBlob);
    blob = await res.blob();
  }
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
};

// ── User profile ──────────────────────────────────────────────────────────────

export const saveUserProfile = async (uid, data) => {
  await setDoc(doc(db, 'users', uid), data, { merge: true });
};

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
};

export const getAllUsers = async () => {
  const snapshot = await getDocs(collection(db, 'users'));
  return snapshot.docs.map(d => ({ uid: d.id, ...d.data() }));
};

export const setUserAdmin = async (uid, isAdmin) => {
  await setDoc(doc(db, 'users', uid), { isAdmin }, { merge: true });
};

// ── Listings ──────────────────────────────────────────────────────────────────

export const createListing = async (data, user) => {
  // Upload images from base64 → Storage → public URLs
  const imageUrls = await Promise.all(
    (data.images || []).map((img, i) =>
      uploadImage(img, `listings/${Date.now()}_${i}`)
    )
  );

  const listing = {
    title:       data.title,
    category:    CAT_NAMES[data.category] || data.category,
    categoryEn:  data.category,
    description: data.description || '',
    price:       parseFloat(data.price),
    location:    data.location || 'לא צוין',
    condition:   data.condition || 'טוב',
    sellerNotes: data.sellerNotes || null,
    images:      imageUrls.length > 0
                   ? imageUrls
                   : ['https://images.unsplash.com/photo-1540932954986-b06535f787f6?w=600'],
    userId: user?.id || null,
    seller: {
      id:    user?.id || null,
      name:  user?.name  || 'אנונימי',
      phone: user?.phone || null,
      email: user?.email || null,
      image: user?.avatar || `https://i.pravatar.cc/150?u=${user?.id || 'anon'}`,
    },
    date:   serverTimestamp(),
    views:  0,
    rating: 4.5,
  };

  const docRef = await addDoc(collection(db, 'listings'), listing);
  return { id: docRef.id, ...listing };
};

export const getListing = async (id) => {
  const snap = await getDoc(doc(db, 'listings', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
};

/**
 * מחזיר listings מ-Firestore עם פילטור client-side.
 * (Firestore text-search אינו מובנה — פילטרים פשוטים מטופלים ב-query, חיפוש חופשי client-side)
 */
const PAGE_SIZE = 12;

/**
 * מחזיר listings מ-Firestore עם פילטור client-side ו-pagination.
 * מחזיר { results, lastDoc } — lastDoc משמש ל-startAfter בדף הבא.
 */
export const getListings = async (filters = {}, afterDoc = null) => {
  const hasTextFilter = filters.search || filters.minPrice || filters.maxPrice || filters.location || filters.condition;
  const constraints = [];

  if (filters.category) constraints.push(where('categoryEn', '==', filters.category));
  if (afterDoc && !hasTextFilter) constraints.push(startAfter(afterDoc));
  if (!hasTextFilter) constraints.push(limit(PAGE_SIZE));

  const q = constraints.length > 0 ? query(collection(db, 'listings'), ...constraints) : collection(db, 'listings');
  const snapshot = await getDocs(q);
  let results = snapshot.docs.map(d => ({ id: d.id, ...d.data(), _snap: d }));

  // Client-side filters
  if (filters.search) {
    const s = filters.search.toLowerCase();
    results = results.filter(l => l.title?.toLowerCase().includes(s) || l.description?.toLowerCase().includes(s));
  }
  if (filters.minPrice) results = results.filter(l => l.price >= parseFloat(filters.minPrice));
  if (filters.maxPrice) results = results.filter(l => l.price <= parseFloat(filters.maxPrice));
  if (filters.location) {
    const loc = filters.location.toLowerCase();
    results = results.filter(l => l.location?.toLowerCase().includes(loc));
  }
  if (filters.condition) results = results.filter(l => l.condition === filters.condition);

  // Hide sold / deactivated listings
  results = results.filter(l => l.isActive !== false);

  results.sort((a, b) => (b.date?.toMillis?.() ?? 0) - (a.date?.toMillis?.() ?? 0));

  const lastDoc = !hasTextFilter && snapshot.docs.length === PAGE_SIZE
    ? snapshot.docs[snapshot.docs.length - 1]
    : null;

  // Strip internal _snap before returning
  return { results: results.map(({ _snap, ...r }) => r), lastDoc, hasMore: !!lastDoc };
};

export const getMyListings = async (userId) => {
  const q = query(collection(db, 'listings'), where('userId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.date?.toMillis?.() ?? 0) - (a.date?.toMillis?.() ?? 0));
};

export const deleteListing = async (id) => {
  await deleteDoc(doc(db, 'listings', id));
};

export const updateListing = async (id, data) => {
  await updateDoc(doc(db, 'listings', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

/** מגדיל את ספירת הצפיות ב-1 (atomic increment) */
export const incrementViews = async (id) => {
  await updateDoc(doc(db, 'listings', id), { views: increment(1) });
};

export const getSimilarListings = async (categoryEn, excludeId, maxCount = 3) => {
  const q = query(collection(db, 'listings'), where('categoryEn', '==', categoryEn));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(l => l.id !== excludeId && l.isActive !== false)
    .slice(0, maxCount);
};

// ── Deals (AI Mediator) ───────────────────────────────────────────────────────

export const createDeal = async (data) => {
  const deal = {
    listingId:     String(data.listingId),
    listingTitle:  data.listingTitle || 'מוצר',
    listingPrice:  Number(data.listingPrice),
    agreedPrice:   Number(data.agreedPrice),
    buyerName:     data.buyerName || 'קונה אנונימי',
    buyerId:       data.buyerId   || null,
    sellerId:      data.sellerId  || null,
    sellerContact: data.sellerContact || null,
    status:        'pending',
    createdAt:     serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, 'deals'), deal);
  return { id: docRef.id, ...deal };
};

export const updateDeal = async (id, status) => {
  await updateDoc(doc(db, 'deals', id), {
    status,
    updatedAt: serverTimestamp(),
  });
};

/**
 * Real-time listener for a single deal (buyer waiting for decision).
 * sellerContact is returned only if status === 'approved'.
 */
export const subscribeToDeal = (dealId, callback) => {
  return onSnapshot(doc(db, 'deals', dealId), (snap) => {
    if (!snap.exists()) return;
    const data = snap.data();
    // Hide sellerContact until approved
    const { sellerContact, ...publicData } = data;
    if (data.status === 'approved') publicData.sellerContact = sellerContact;
    callback({ id: snap.id, ...publicData });
  });
};

/**
 * Real-time listener for all pending deals for a seller (navbar notification badge).
 */
export const subscribeUserPendingDeals = (userId, callback) => {
  const q = query(
    collection(db, 'deals'),
    where('sellerId', '==', userId),
    where('status', '==', 'pending')
  );
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.length);
  });
};

/**
 * Real-time listener for all deals on a listing (seller panel).
 */
export const subscribeToListingDeals = (listingId, callback) => {
  const q = query(
    collection(db, 'deals'),
    where('listingId', '==', String(listingId))
  );
  return onSnapshot(q, (snapshot) => {
    const deals = snapshot.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return tb - ta;
      });
    callback(deals);
  });
};

export const getBuyerDeals = async (userId) => {
  const q = query(collection(db, 'deals'), where('buyerId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
};

export const getSellerDeals = async (userId) => {
  const q = query(collection(db, 'deals'), where('sellerId', '==', userId));
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
};

// ── Ratings ───────────────────────────────────────────────────────────────────

/** Submit or update a star rating (1-5) for a listing. Returns { avg, count }. */
export const rateListing = async (listingId, userId, value) => {
  const ratingId  = `${listingId}_${userId}`;
  await setDoc(doc(db, 'ratings', ratingId), {
    listingId, userId, value, updatedAt: serverTimestamp(),
  }, { merge: true });

  // Recalculate average across all ratings for this listing
  const q = query(collection(db, 'ratings'), where('listingId', '==', listingId));
  const snap = await getDocs(q);
  const values = snap.docs.map(d => d.data().value);
  const avg    = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
  const count  = values.length;

  // Update listing's rating fields in Firestore
  await updateDoc(doc(db, 'listings', listingId), { rating: avg, ratingCount: count });

  return { avg, count };
};

/** Get the current user's rating for a listing (null if not rated). */
export const getUserRating = async (listingId, userId) => {
  const snap = await getDoc(doc(db, 'ratings', `${listingId}_${userId}`));
  return snap.exists() ? snap.data().value : null;
};

// ── Demo seed ─────────────────────────────────────────────────────────────────
// מוסיף מספר מודעות לדוגמה ל-Firestore אם הקולקציה ריקה.

export const seedDemoListings = async () => {
  const snapshot = await getDocs(collection(db, 'listings'));
  if (!snapshot.empty) return; // already seeded

  const demo = [
    {
      title: 'iPhone 15 Pro Max 256GB כחול טיטניום',
      category: 'אלקטרוניקה', categoryEn: 'electronics',
      price: 3800, location: 'תל אביב', condition: 'מעולה',
      description: 'אייפון 15 פרו מקס במצב מעולה, עם כל האביזרים המקוריים.',
      images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600'],
      seller: { name: 'דוד כהן', phone: '052-1234567', email: 'david@example.com', image: 'https://i.pravatar.cc/150?img=11' },
    },
    {
      title: 'מאזדה CX-5 2021 אוטומטית',
      category: 'רכבים', categoryEn: 'vehicles',
      price: 115000, location: 'ירושלים', condition: 'טוב',
      description: 'מאזדה CX-5 שנת 2021, אוטומטית, פנורמה, מצב מצוין.',
      images: ['https://images.unsplash.com/photo-1617531653332-bd46c16f7d61?w=600'],
      seller: { name: 'שרה לוי', phone: '054-9876543', email: 'sara@example.com', image: 'https://i.pravatar.cc/150?img=5' },
    },
    {
      title: 'ספת פינה L צורה אפורה',
      category: 'ריהוט', categoryEn: 'furniture',
      price: 2800, location: 'חיפה', condition: 'טוב',
      description: 'ספת פינה מעוצבת, אפורה, מתאימה לסלון גדול. 6 שנים שימוש קל.',
      images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600'],
      seller: { name: 'רחל אברהם', phone: '050-5551234', email: 'rachel@example.com', image: 'https://i.pravatar.cc/150?img=9' },
    },
    {
      title: 'MacBook Pro M3 14 אינץ 512GB',
      category: 'אלקטרוניקה', categoryEn: 'electronics',
      price: 7200, location: 'רמת גן', condition: 'חדש',
      description: 'מקבוק פרו M3 חדש לגמרי, בקופסה המקורית. עדיין לא נפתח.',
      images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600'],
      seller: { name: 'יוסי מזרחי', phone: '053-7778888', email: 'yossi@example.com', image: 'https://i.pravatar.cc/150?img=7' },
    },
    {
      title: 'אופניים חשמליים Scooti 48V',
      category: 'ספורט', categoryEn: 'sports',
      price: 3500, location: 'פתח תקווה', condition: 'טוב',
      description: 'אופניים חשמליים עם סוללה חזקה 48V, טווח 60 ק"מ. שימוש של שנה.',
      images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600'],
      seller: { name: 'אבי גל', phone: '058-2223333', email: 'avi@example.com', image: 'https://i.pravatar.cc/150?img=12' },
    },
    {
      title: 'דירת 3 חדרים בתל אביב — מגדלי הים',
      category: 'נדל"ן', categoryEn: 'real_estate',
      price: 2850000, location: 'תל אביב', condition: 'מעולה',
      description: 'דירת 3 חדרים בקומה 18, נוף לים, מרפסת גדולה, חניה כלולה.',
      images: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600'],
      seller: { name: 'נדל"ן פרמיום', phone: '03-1234567', email: 'realty@example.com', image: 'https://i.pravatar.cc/150?img=3' },
    },
  ];

  const batch = demo.map(item => addDoc(collection(db, 'listings'), {
    ...item,
    userId: null,
    sellerNotes: null,
    date: serverTimestamp(),
    views: Math.floor(Math.random() * 500),
    rating: 4.5,
  }));

  await Promise.all(batch);
};
