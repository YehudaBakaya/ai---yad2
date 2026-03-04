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

      if (req.query.minPrice || req.query.maxPrice) {
        query.price = {};
        if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
        if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
      }

      let dbQuery = Listing.find(query).sort({ createdAt: -1 });

      if (req.query.search) {
        // Use text index when available, fallback to regex
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
    const { title, category, price, location, condition, description, images, sellerNotes } = req.body;

    if (!title || !category || price === undefined)
      return res.status(400).json({ error: 'נתונים חסרים' });

    const categoryEn = Object.entries(categories).find(([, val]) => val === category)?.[1]
      || Object.entries(categories).find(([key]) => key === category)?.[1]
      || category;

    const seller = req.user
      ? { id: req.user.id, name: req.user.name, phone: req.user.phone || null, email: req.user.email || null, image: `https://i.pravatar.cc/150?u=${req.user.id}` }
      : { name: 'משתמש אנונימי', phone: null, email: null, image: 'https://i.pravatar.cc/150?img=50' };

    if (isConnected()) {
      const doc = await Listing.create({
        title, category, categoryEn,
        description: description || '',
        price: parseFloat(price),
        location: location || 'לא צוין',
        condition: condition || 'טוב',
        images: images || ['https://images.unsplash.com/photo-1540932954986-b06535f787f6?w=600'],
        seller,
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
      userId: req.user?.id || null,
      seller,
      images: images || ['https://images.unsplash.com/photo-1540932954986-b06535f787f6?w=600'],
      date: new Date(), views: 0, rating: 4.5,
    };
    inMemory.push(newListing);
    res.status(201).json(newListing);
  } catch (err) {
    console.error('POST /listings error:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

export default router;
