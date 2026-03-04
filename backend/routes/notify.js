import express from 'express';
import nodemailer from 'nodemailer';

const router = express.Router();

// Build transporter lazily (only when email vars are set)
const getTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: { user, pass },
  });
};

/**
 * POST /api/notify/new-deal
 * Called from frontend when a buyer submits a deal to seller.
 * Sends email to the seller.
 */
router.post('/new-deal', async (req, res) => {
  const { sellerEmail, sellerName, buyerName, listingTitle, agreedPrice, listingPrice } = req.body;

  if (!sellerEmail || !listingTitle) {
    return res.status(400).json({ error: 'sellerEmail ו-listingTitle נדרשים' });
  }

  const transporter = getTransporter();
  if (!transporter) {
    // No email configured — silently ok
    return res.json({ sent: false, reason: 'email not configured' });
  }

  const savings    = listingPrice - agreedPrice;
  const savingsPct = Math.round(Math.abs(savings) / listingPrice * 100);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const html = `
    <div dir="rtl" style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:16px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#a78bfa;margin:0;font-size:24px;">יד2 AI — הצעה חדשה!</h1>
      </div>

      <p style="font-size:16px;">שלום <strong>${sellerName || 'מוכר'}</strong>,</p>
      <p style="font-size:15px;color:#94a3b8;">קיבלת הצעה למודעה שלך:</p>

      <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px;margin:20px 0;">
        <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;">מודעה</p>
        <p style="margin:0;font-size:17px;font-weight:bold;color:#fff;">${listingTitle}</p>
      </div>

      <div style="display:flex;gap:16px;margin:16px 0;">
        <div style="flex:1;background:#1e293b;border:1px solid #334155;border-radius:12px;padding:16px;text-align:center;">
          <p style="margin:0 0 4px;color:#94a3b8;font-size:12px;">מחיר מקורי</p>
          <p style="margin:0;font-size:20px;font-weight:bold;color:#e2e8f0;text-decoration:line-through;">₪${Number(listingPrice).toLocaleString()}</p>
        </div>
        <div style="flex:1;background:#1e293b;border:1px solid #10b981;border-radius:12px;padding:16px;text-align:center;">
          <p style="margin:0 0 4px;color:#94a3b8;font-size:12px;">הצעת הקונה</p>
          <p style="margin:0;font-size:24px;font-weight:bold;color:#34d399;">₪${Number(agreedPrice).toLocaleString()}</p>
          <p style="margin:4px 0 0;font-size:11px;color:#f59e0b;">הנחה ${savingsPct}%</p>
        </div>
      </div>

      <p style="font-size:14px;color:#94a3b8;">קונה: <strong style="color:#fff;">${buyerName || 'קונה אנונימי'}</strong></p>

      <div style="text-align:center;margin-top:28px;">
        <a href="${frontendUrl}/my-listings"
           style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;font-weight:bold;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none;">
          אשר או דחה את ההצעה ←
        </a>
      </div>

      <p style="margin-top:24px;font-size:12px;color:#475569;text-align:center;">
        הודעה זו נשלחה ממערכת יד2 AI — אל תשיב למייל זה.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `"יד2 AI" <${process.env.EMAIL_USER}>`,
      to: sellerEmail,
      subject: `💰 הצעה חדשה על "${listingTitle}" — ₪${Number(agreedPrice).toLocaleString()}`,
      html,
    });
    res.json({ sent: true });
  } catch (err) {
    console.error('Email send error:', err.message);
    res.json({ sent: false, reason: err.message });
  }
});

export default router;
