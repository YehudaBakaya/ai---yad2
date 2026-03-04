import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'yad2-ai-secret-change-in-production';

/**
 * יוצר JWT token עבור משתמש
 */
export const signToken = (user) =>
  jwt.sign(
    { id: user.id || user._id, email: user.email, name: user.name, phone: user.phone || null },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

/**
 * Middleware — מאמת JWT ומוסיף req.user
 * שימוש: router.post('/route', verifyToken, handler)
 */
export const verifyToken = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'לא מורשה — יש להתחבר תחילה' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'תוקף ההתחברות פג — יש להתחבר שוב' });
    }
    return res.status(401).json({ error: 'טוקן לא תקין' });
  }
};

/**
 * Middleware אופציונלי — מוסיף req.user אם יש token, לא חוסם אם אין
 */
export const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();

  try {
    req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
  } catch {
    // token לא תקין — ממשיך בלי user
  }
  next();
};
