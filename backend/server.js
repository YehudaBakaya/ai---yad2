import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import dotenv from 'dotenv';

import { connectDB } from './db.js';
import listingsRouter from './routes/listings.js';
import aiRouter from './routes/ai.js';
import authRouter from './routes/auth.js';
import { verifyToken } from './middleware/auth.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 3001;

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));

// ── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ── Session (נדרש ל-Passport / Google OAuth) ─────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || 'yad2-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 1 day
}));

// ── Passport ──────────────────────────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRouter);
app.use('/api/listings', listingsRouter);   // GET routes — ללא auth
app.use('/api/ai',       aiRouter);

// POST /api/listings מוגן — צריך להיות מחובר
// (אפשר להוסיף verifyToken ישירות בrouter אם מעדיפים)

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'לא נמצא' }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'שגיאה בשרת' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();           // מנסה לחבר MongoDB (לא קורס אם אין)

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 API: http://localhost:${PORT}/api/listings`);
    console.log(`🤖 AI:  http://localhost:${PORT}/api/ai`);
    console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
  });
};

start();
