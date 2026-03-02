import express from 'express';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { signToken, verifyToken } from '../middleware/auth.js';

const router = express.Router();

// ─────────────────────────────────────────────
// In-memory users store (עובד ללא MongoDB)
// כשמחברים MongoDB — מחליפים את inMemoryUsers ב-User model
// ─────────────────────────────────────────────
const inMemoryUsers = [];

const findUserByEmail  = (email) => inMemoryUsers.find(u => u.email === email.toLowerCase());
const findUserById     = (id)    => inMemoryUsers.find(u => u.id === id);
const findUserByGoogle = (gid)   => inMemoryUsers.find(u => u.googleId === gid);

const createUser = (data) => {
  const user = { id: crypto.randomUUID(), createdAt: new Date(), ...data };
  inMemoryUsers.push(user);
  return user;
};

const safeUser = (u) => ({ id: u.id, name: u.name, email: u.email, avatar: u.avatar || null, provider: u.provider });

// ─────────────────────────────────────────────
// Google OAuth — Passport setup
// ─────────────────────────────────────────────
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
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        // כשמשתמשים ב-MongoDB:
        // let user = await User.findOne({ googleId: profile.id });
        // if (!user) user = await User.create({ ... });

        let user = findUserByGoogle(profile.id);
        if (!user) {
          const email = profile.emails?.[0]?.value || `${profile.id}@google.com`;
          user = createUser({
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

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser((id, done) => done(null, findUserById(id)));
}

// ─────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────

/**
 * POST /api/auth/register
 * גוף: { name, email, password }
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ error: 'שם, אימייל וסיסמה נדרשים' });

    if (password.length < 6)
      return res.status(400).json({ error: 'הסיסמה חייבת להכיל לפחות 6 תווים' });

    if (findUserByEmail(email))
      return res.status(409).json({ error: 'האימייל כבר רשום במערכת' });

    const hashed = await bcrypt.hash(password, 12);
    // כשמשתמשים ב-MongoDB: const user = await User.create({ ... });
    const user = createUser({ name: name.trim(), email: email.toLowerCase(), password: hashed, provider: 'local' });

    const token = signToken(user);
    res.status(201).json({ token, user: safeUser(user) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

/**
 * POST /api/auth/login
 * גוף: { email, password }
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'אימייל וסיסמה נדרשים' });

    // כשמשתמשים ב-MongoDB: const user = await User.findOne({ email });
    const user = findUserByEmail(email);
    if (!user || user.provider === 'google')
      return res.status(401).json({ error: 'אימייל או סיסמה שגויים' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ error: 'אימייל או סיסמה שגויים' });

    const token = signToken(user);
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'שגיאת שרת' });
  }
});

/**
 * GET /api/auth/me
 * מחזיר את המשתמש הנוכחי (מה-JWT)
 */
router.get('/me', verifyToken, (req, res) => {
  // כשמשתמשים ב-MongoDB: const user = await User.findById(req.user.id);
  const user = findUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'משתמש לא נמצא' });
  res.json({ user: safeUser(user) });
});

/**
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
  req.logout?.();
  res.json({ message: 'התנתקת בהצלחה' });
});

// ─────────────────────────────────────────────
// Google OAuth routes
// ─────────────────────────────────────────────

if (GOOGLE_CONFIGURED) {
  /**
   * GET /api/auth/google
   * מתחיל את תהליך Google OAuth
   */
  router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  /**
   * GET /api/auth/google/callback
   * Google מחזיר לכאן אחרי הסכמת המשתמש
   */
  router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: '/login?error=google' }),
    (req, res) => {
      const token = signToken(req.user);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      // מעביר את ה-JWT ל-frontend דרך URL param
      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    }
  );
} else {
  // Google לא מוגדר — מחזיר הסבר ברור
  router.get('/google', (req, res) => {
    res.status(501).json({
      error: 'Google OAuth לא מוגדר',
      instructions: 'הוסף GOOGLE_CLIENT_ID ו-GOOGLE_CLIENT_SECRET ל-.env',
      docs: 'https://console.cloud.google.com/apis/credentials',
    });
  });
}

export default router;
