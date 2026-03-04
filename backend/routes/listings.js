import express from 'express';
import { listings, categories } from '../data/listings.js';
import { v4 as uuidv4 } from 'uuid';
import { optionalAuth } from '../middleware/auth.js';
import Listing from '../models/Listing.js';
import { isConnected } from '../db.js';

const router = express.Router();
let inMemory = [...listings];

// ── helpers ───────────────────────────────────────────────────────────────────
const toPlain = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  return { ...obj, id: obj._id?.toString() || obj.id };
};

// ── GET /api/listings ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    if (isConnected()) {
      const query = { isActive: true };

      if (req.query.category)  query.categoryEn = req.query.category;
      if (req.query.condition) query.condition   = req.query.condition;
      if (req.query.location)  query.location    = new RegExp(req.query.location, 'i');
      if (req.query.userId)    query.userId      = req.query.userId;

      if (req.query.minPrice || req.query.maxPrice) {
        query.price = {};
        if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
        if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
      }

      let dbQuery = Listing.find(query).sort({ createdAt: -1 });

      if (req.query.search) {
        try {
          dbQuery = Listing.find({ ...query, $text: { $search: req.query.search } })
            .sort({ score: { $meta: 'textScore' }, createdAt: -1 });
        } catch {
          const re = new RegExp(req.query.search, 'i');
          query.$or = [{ title: re }, { description: re }];
          dbQuery = Listing.find(query).sort({ createdAt: -1 });
        }
      }

      const docs = await dbQuery.exec();
      return res.json(docs.map(toPlain));
    }

    // in-memory fallback
    let filtered = [...inMemory];
    if (req.query.category)  filtered = filtered.filter(l => l.categoryEn === req.query.category);
    if (req.query.condition) filtered = filtered.filter(l => l.condition === req.query.condition);
    if (req.query.location)  filtered = filtered.filter(l => l.location.toLowerCase().includes(req.query.location.toLowerCase()));
    if (req.query.minPrice)  filtered = filtered.filter(l => l.price >= parseFloat(req.query.minPrice));
    if (req.query.maxPrice)  filtered = filtered.filter(l => l.price <= parseFloat(req.query.maxPrice));
    if (req.query.userId)    filtered = filtered.filter(l => l.userId === req.query.userId);
    if (req.query.search) {
      const s = req.query.search.toLowerCase();
      filtered = filtered.filter(l => l.title.toLowerCase().includes(s) || l.description.toLowerCase().includes(s));
    }
    filtered.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
    res.json(filtered);
  } catch (err) {
    console.error('GET /listings error:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

// ── GET /api/listings/categories/all ─────────────────────────────────────────
router.get('/categories/all', async (req, res) => {
  try {
    const stats = {};
    if (isConnected()) {
      const counts = await Listing.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$categoryEn', count: { $sum: 1 } } },
      ]);
      const countMap = Object.fromEntries(counts.map(c => [c._id, c.count]));
      Object.entries(categories).forEach(([name, code]) => {
        stats[code] = { name, count: countMap[code] || 0 };
      });
    } else {
      Object.entries(categories).forEach(([name, code]) => {
        stats[code] = { name, count: inMemory.filter(l => l.categoryEn === code).length };
      });
    }
    res.json(stats);
  } catch (err) {
    console.error('GET /listings/categories/all error:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

// ── GET /api/listings/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    if (isConnected()) {
      const doc = await Listing.findById(req.params.id);
      if (!doc) return res.status(404).json({ error: 'רישום לא נמצא' });
      return res.json(toPlain(doc));
    }
    const listing = inMemory.find(l => l.id === req.params.id);
    if (!listing) return res.status(404).json({ error: 'רישום לא נמצא' });
    res.json(listing);
  } catch (err) {
    console.error('GET /listings/:id error:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

// ── POST /api/listings ────────────────────────────────────────────────────────
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { title, category, price, location, condition, description, images, sellerNotes, userId: bodyUserId, seller: bodySeller } = req.body;

    if (!title || !category || price === undefined)
      return res.status(400).json({ error: 'נתונים חסרים' });

    const categoryEn = Object.entries(categories).find(([, val]) => val === category)?.[1]
      || Object.entries(categories).find(([key]) => key === category)?.[1]
      || category;

    // Auth priority: JWT user > body seller info > anonymous
    const seller = req.user
      ? { id: req.user.id, name: req.user.name, phone: req.user.phone || null, email: req.user.email || null, image: `https://i.pravatar.cc/150?u=${req.user.id}` }
      : bodySeller
        ? { id: bodySeller.id || null, name: bodySeller.name || 'משתמש', phone: bodySeller.phone || null, email: bodySeller.email || null, image: bodySeller.image || `https://i.pravatar.cc/150?u=${bodySeller.id || 'anon'}` }
        : { name: 'משתמש אנונימי', phone: null, email: null, image: 'https://i.pravatar.cc/150?img=50' };

    const userId = req.user?.id || bodyUserId || null;

    if (isConnected()) {
      const doc = await Listing.create({
        title, category, categoryEn,
        description: description || '',
        price: parseFloat(price),
        location: location || 'לא צוין',
        condition: condition || 'טוב',
        images: images?.length > 0 ? images : ['https://images.unsplash.com/photo-1540932954986-b06535f787f6?w=600'],
        sellerNotes: sellerNotes || null,
        seller, userId,
        views: 0, rating: 4.5,
      });
      return res.status(201).json(toPlain(doc));
    }

    const newListing = {
      id: uuidv4(), title, category, categoryEn,
      description: description || '',
      price: parseFloat(price),
      location: location || 'לא צוין',
      condition: condition || 'טוב',
      sellerNotes: sellerNotes || null,
      userId, seller,
      images: images?.length > 0 ? images : ['https://images.unsplash.com/photo-1540932954986-b06535f787f6?w=600'],
      date: new Date(), views: 0, rating: 4.5,
    };
    inMemory.push(newListing);
    res.status(201).json(newListing);
  } catch (err) {
    console.error('POST /listings error:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

// ── PATCH /api/listings/seller — bulk-update seller info for a user ───────────
router.patch('/seller', async (req, res) => {
  try {
    const { userId, seller } = req.body;
    if (!userId || !seller) return res.status(400).json({ error: 'נתונים חסרים' });
    if (isConnected()) {
      await Listing.updateMany({ userId }, { $set: { seller } });
      return res.json({ ok: true });
    }
    inMemory.forEach(l => { if (l.userId === userId) Object.assign(l.seller, seller); });
    res.json({ ok: true });
  } catch (err) {
    console.error('PATCH /listings/seller error:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

// ── PATCH /api/listings/:id/views ─────────────────────────────────────────────
router.patch('/:id/views', async (req, res) => {
  try {
    if (isConnected()) {
      const doc = await Listing.findByIdAndUpdate(
        req.params.id,
        { $inc: { views: 1 } },
        { new: true }
      );
      if (!doc) return res.status(404).json({ error: 'רישום לא נמצא' });
      return res.json({ views: doc.views });
    }
    const listing = inMemory.find(l => l.id === req.params.id);
    if (!listing) return res.status(404).json({ error: 'רישום לא נמצא' });
    listing.views = (listing.views || 0) + 1;
    res.json({ views: listing.views });
  } catch (err) {
    console.error('PATCH /listings/:id/views error:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

// ── PUT /api/listings/:id ─────────────────────────────────────────────────────
router.put('/:id', optionalAuth, async (req, res) => {
  try {
    const allowed = ['title', 'price', 'location', 'condition', 'description', 'images', 'isActive', 'seller'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    if (isConnected()) {
      const doc = await Listing.findByIdAndUpdate(req.params.id, updates, { new: true });
      if (!doc) return res.status(404).json({ error: 'רישום לא נמצא' });
      return res.json(toPlain(doc));
    }

    const idx = inMemory.findIndex(l => l.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'רישום לא נמצא' });
    inMemory[idx] = { ...inMemory[idx], ...updates };
    res.json(inMemory[idx]);
  } catch (err) {
    console.error('PUT /listings/:id error:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

// ── DELETE /api/listings/:id ──────────────────────────────────────────────────
router.delete('/:id', optionalAuth, async (req, res) => {
  try {
    if (isConnected()) {
      const doc = await Listing.findByIdAndDelete(req.params.id);
      if (!doc) return res.status(404).json({ error: 'רישום לא נמצא' });
      return res.json({ success: true });
    }

    const idx = inMemory.findIndex(l => l.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'רישום לא נמצא' });
    inMemory.splice(idx, 1);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /listings/:id error:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

export default router;
