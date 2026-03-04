import express from 'express';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { signToken, verifyToken } from '../middleware/auth.js';
import User from '../models/User.js';
import { isConnected } from '../db.js';

const router = express.Router();

// ── helpers ───────────────────────────────────────────────────────────────────
const safeUser = (u) => ({
  id:       u._id?.toString() || u.id,
  name:     u.name,
  email:    u.email,
  phone:    u.phone || null,
  avatar:   u.avatar || null,
  provider: u.provider,
});

// DB helpers — MongoDB or in-memory fallback
const inMemory = [];

const db = {
  findByEmail:  (email)   => isConnected()
    ? User.findOne({ email: email.toLowerCase() })
    : inMemory.find(u => u.email === email.toLowerCase()),

  findById:     (id)      => isConnected()
    ? User.findById(id)
    : inMemory.find(u => u.id === id || u._id === id),

  findByGoogle: (googleId) => isConnected()
    ? User.findOne({ googleId })
    : inMemory.find(u => u.googleId === googleId),

  create: async (data)   => {
    if (isConnected()) {
      return User.create(data);
    }
    const u = { id: crypto.randomUUID(), createdAt: new Date(), ...data };
    inMemory.push(u);
    return u;
  },
};

// ── Google OAuth ───────────────────────────────────────────────────────────────
const GOOGLE_CONFIGURED =
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id';

if (GOOGLE_CONFIGURED) {
  passport.use(new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
    },
    async (_at, _rt, profile, done) => {
      try {
        let user = await db.findByGoogle(profile.id);
        if (!user) {
          const email = profile.emails?.[0]?.value || `${profile.id}@google.com`;
          user = await db.create({
            googleId: profile.id,
            name:     profile.displayName,
            email,
            avatar:   profile.photos?.[0]?.value || null,
            provider: 'google',
          });
        }
        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  ));

  passport.serializeUser((user, done) => done(null, user._id || user.id));
  passport.deserializeUser(async (id, done) => done(null, await db.findById(id)));
}

// ── POST /api/auth/register ────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'שם, אימייל וסיסמה נדרשים' });
    if (password.length < 6)
      return res.status(400).json({ error: 'סיסמה חייבת להכיל לפחות 6 תווים' });

    const existing = await db.findByEmail(email);
    if (existing) return res.status(409).json({ error: 'האימייל כבר רשום' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await db.create({
      name: name.trim(), email: email.toLowerCase(),
      phone: phone?.trim() || null, password: hashed, provider: 'local',
    });

    res.status(201).json({ token: signToken(user), user: safeUser(user) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

// ── POST /api/auth/login ───────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'אימייל וסיסמה נדרשים' });

    const user = await db.findByEmail(email);
    if (!user || user.provider === 'google')
      return res.status(401).json({ error: 'אימייל או סיסמה שגויים' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'אימייל או סיסמה שגויים' });

    res.json({ token: signToken(user), user: safeUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

// ── GET /api/auth/me ───────────────────────────────────────────────────────────
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await db.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'משתמש לא נמצא' });
    res.json({ user: safeUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

// ── POST /api/auth/logout ──────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  req.logout?.();
  res.json({ message: 'התנתקת בהצלחה' });
});

// ── Google OAuth routes ────────────────────────────────────────────────────────
if (GOOGLE_CONFIGURED) {
  router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

  router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login?error=google' }),
    (req, res) => {
      const token = signToken(req.user);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    }
  );
} else {
  router.get('/google', (_req, res) => res.status(501).json({
    error: 'Google OAuth לא מוגדר',
    instructions: 'הוסף GOOGLE_CLIENT_ID ו-GOOGLE_CLIENT_SECRET ל-.env',
  }));
}

export default router;
