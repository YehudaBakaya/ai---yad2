import express from 'express';
import { listings, categories } from '../data/listings.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
let allListings = [...listings];

// Get all listings with filters
router.get('/', (req, res) => {
  let filtered = [...allListings];

  // Filter by category
  if (req.query.category) {
    filtered = filtered.filter(l => l.categoryEn === req.query.category);
  }

  // Filter by search text
  if (req.query.search) {
    const search = req.query.search.toLowerCase();
    filtered = filtered.filter(l => 
      l.title.toLowerCase().includes(search) || 
      l.description.toLowerCase().includes(search)
    );
  }

  // Filter by price range
  if (req.query.minPrice) {
    const minPrice = parseFloat(req.query.minPrice);
    filtered = filtered.filter(l => l.price >= minPrice);
  }

  if (req.query.maxPrice) {
    const maxPrice = parseFloat(req.query.maxPrice);
    filtered = filtered.filter(l => l.price <= maxPrice);
  }

  // Filter by location
  if (req.query.location) {
    const location = req.query.location.toLowerCase();
    filtered = filtered.filter(l => l.location.toLowerCase().includes(location));
  }

  // Filter by condition
  if (req.query.condition) {
    filtered = filtered.filter(l => l.condition === req.query.condition);
  }

  // Sort by date (newest first)
  filtered.sort((a, b) => b.date - a.date);

  res.json(filtered);
});

// Get single listing
router.get('/:id', (req, res) => {
  const listing = allListings.find(l => l.id === req.params.id);
  if (!listing) {
    return res.status(404).json({ error: 'רישום לא נמצא' });
  }
  res.json(listing);
});

// Create new listing
router.post('/', (req, res) => {
  const { title, category, price, location, condition, description, images } = req.body;

  if (!title || !category || price === undefined) {
    return res.status(400).json({ error: 'נתונים חסרים' });
  }

  const newListing = {
    id: uuidv4(),
    title,
    category,
    categoryEn: Object.entries(categories).find(([key, val]) => val === category)?.[1] || category,
    description: description || '',
    price: parseFloat(price),
    location: location || 'לא צוין',
    condition: condition || 'טוב',
    seller: {
      name: 'משתמש חדש',
      phone: '050-0000000',
      image: 'https://i.pravatar.cc/150?img=50'
    },
    images: images || ['https://images.unsplash.com/photo-1540932954986-b06535f787f6?w=600'],
    date: new Date(),
    views: 0,
    rating: 4.5
  };

  allListings.push(newListing);
  res.status(201).json(newListing);
});

// Get categories with counts
router.get('/categories/all', (req, res) => {
  const categoryStats = {};
  
  Object.entries(categories).forEach(([name, code]) => {
    const count = allListings.filter(l => l.categoryEn === code).length;
    categoryStats[code] = { name, count };
  });

  res.json(categoryStats);
});

export default router;
