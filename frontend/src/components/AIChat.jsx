import React, { useState, useRef, useEffect } from 'react';
import {
  Send, Bot, User, Sparkles, CheckCircle, XCircle, TrendingDown,
  Clock, Loader2, Phone, X, RefreshCw, Mail, Star, MessageCircle,
} from 'lucide-react';
import { aiAPI } from '../services/api';
import api from '../services/api';
import { createDeal, subscribeToDeal, rateListing } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';

/**
 * AIChat — מתווך AI
 * AI תמיד מייצג את המוכר. הקונה מנהל משא ומתן מולו.
 * כשמגיעים לעסקה, ה-AI שולח את ההצעה למוכר לאישור.
 * sellerContact מוצג לקונה רק לאחר אישור המוכר.
 */
export default function AIChat({ listingId, listingTitle, listingPrice, sellerContact, sellerNotes }) {
  const { user } = useAuth();

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: `👋 שלום! אני הסוכן AI המייצג את המוכר. המחיר המבוקש הוא ₪${listingPrice?.toLocaleString()}. אשמח לענות על שאלותיך ולנהל משא ומתן מקצועי.`,
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [currentOffer, setCurrentOffer] = useState(listingPrice);
  const [dealReached, setDealReached]   = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState([
    'מה מצב המוצר?',
    'כמה זמן בשימוש?',
    'האם יש אחריות?',
    'מה כלול במחיר?',
  ]);

  // Deal submission state
  const [submitting, setSubmitting] = useState(false);
  const [dealId, setDealId]         = useState(null);
  const [dealStatus, setDealStatus] = useState(null);

  // Revealed contact after approval
  const [revealedContact, setRevealedContact] = useState(null);
  const [approvalPopup, setApprovalPopup]     = useState(false);
  const [counterAlert, setCounterAlert]       = useState(false);

  // Rating state (from approval popup)
  const [dealRating, setDealRating]           = useState(0);
  const [dealRatingHover, setDealRatingHover] = useState(0);
  const [dealRatingSaved, setDealRatingSaved] = useState(false);
  const [dealRatingLoading, setDealRatingLoading] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const addToast = (type, text) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  // Real-time listener for seller decision (Firestore onSnapshot)
  useEffect(() => {
    if (!dealId) return;
    const unsubscribe = subscribeToDeal(dealId, (deal) => {
      if (deal.status === 'approved') {
        setDealStatus('approved');
        if (deal.sellerContact) setRevealedContact(deal.sellerContact);
        setApprovalPopup(true);
        addToast('success', '🎉 המוכר אישר את העסקה!');
      } else if (deal.status === 'rejected') {
        setDealStatus('rejected');
        addToast('error', '❌ המוכר דחה את ההצעה');
      } else if (deal.status === 'countered' && deal.counterPrice) {
        const counterMsg = {
          id: Date.now(),
          text: `🔄 המוכר שלח הצעה נגדית!\n\nהמוכר מציע לך את המוצר ב־₪${deal.counterPrice.toLocaleString()}${deal.counterMessage ? `\n\n"${deal.counterMessage}"` : ''}\n\nהאם תקבל את ההצעה?`,
          sender: 'ai',
          timestamp: new Date(),
          counterOffer: deal.counterPrice,
        };
        setMessages(prev => [...prev, counterMsg]);
        setCurrentOffer(deal.counterPrice);
        setDealReached(false);
        setDealStatus(null);
        setDealId(null);
        setCounterAlert(true);
        setSuggestedReplies(['מסכים!', `אני מציע ₪${Math.round(deal.counterPrice * 0.95).toLocaleString()}`, 'לא מסכים, נשאר בהצעה שלי']);
        addToast('info', `🔄 המוכר הציע הצעה נגדית: ₪${deal.counterPrice.toLocaleString()}`);
      }
    });
    return unsubscribe;
  }, [dealId]);

  const handleDealRate = async (value) => {
    if (dealRatingSaved || dealRatingLoading || !user?.id) return;
    setDealRating(value);
    setDealRatingLoading(true);
    try {
      await rateListing(listingId, user.id, value);
      setDealRatingSaved(true);
      addToast('success', `⭐ הדירוג נשמר — ${value} כוכבים`);
    } catch {
      addToast('error', 'שגיאה בשמירת הדירוג');
    } finally {
      setDealRatingLoading(false);
    }
  };

  const sendMessage = async (text) => {
    if (!text.trim() || loading || dealReached) return;

    const userMsg = { id: Date.now(), text, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setSuggestedReplies([]);
    setLoading(true);

    try {
      const res = await aiAPI.negotiate({
        message: text,
        listingId,
        listingPrice,
        history: messages,
        role: 'seller',
        sellerNotes: sellerNotes || null,
      });

      const { message, currentOffer: newOffer, dealReached: deal, suggestedReplies: replies } = res.data;

      const aiMsg = {
        id: Date.now() + 1,
        text: message,
        sender: 'ai',
        timestamp: new Date(),
        offer: newOffer,
        dealReached: deal,
      };

      setMessages(prev => [...prev, aiMsg]);
      if (newOffer) setCurrentOffer(newOffer);
      if (deal) setDealReached(true);
      if (replies?.length) setSuggestedReplies(replies);
    } catch {
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, text: 'סליחה, הייתה שגיאה. נסה שוב.', sender: 'ai', timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e) => { e.preventDefault(); sendMessage(input); };

  const submitDealToSeller = async () => {
    setSubmitting(true);
    try {
      const deal = await createDeal({
        listingId,
        listingTitle,
        listingPrice,
        agreedPrice: currentOffer,
        buyerName:  user?.name || 'קונה אנונימי',
        buyerId:    user?.id   || null,
        sellerId:   sellerContact?.id || null,
        sellerContact: sellerContact || null,
      });
      setDealId(deal.id);
      setDealStatus('pending');
      addToast('info', '📤 ההצעה נשלחה למוכר — ממתינים לאישור');

      if (sellerContact?.email) {
        api.post('/notify/new-deal', {
          sellerEmail:  sellerContact.email,
          sellerName:   sellerContact.name,
          buyerName:    user?.name || 'קונה אנונימי',
          listingTitle,
          agreedPrice:  currentOffer,
          listingPrice,
        }).catch(() => {});
      }
    } catch {
      addToast('error', 'שגיאה בשליחת ההצעה — נסה שוב');
    } finally {
      setSubmitting(false);
    }
  };

  const savings    = listingPrice - currentOffer;
  const savingsPct = Math.round(Math.abs(savings) / listingPrice * 100);
  const meterPct   = Math.min(100, Math.max(0, savingsPct * 3));

  const contact = revealedContact || (dealStatus === 'approved' ? sellerContact : null);

  /* ── TOAST NOTIFICATIONS ─────────────────────────────────────── */
  const ToastStack = (
    <div className="fixed top-4 left-4 z-[10000] flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="animate-slideUp pointer-events-auto"
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: toast.type === 'success' ? 'linear-gradient(135deg, rgba(5,150,105,0.95), rgba(16,185,129,0.95))'
              : toast.type === 'error' ? 'linear-gradient(135deg, rgba(185,28,28,0.95), rgba(239,68,68,0.95))'
              : 'linear-gradient(135deg, rgba(99,102,241,0.95), rgba(139,92,246,0.95))',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '10px 14px', borderRadius: '14px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            maxWidth: '280px', fontSize: '13px', fontWeight: '600', color: 'white',
          }}
        >
          <span>{toast.text}</span>
        </div>
      ))}
    </div>
  );

  /* ── APPROVAL POPUP ────────────────────────────────────────────── */
  const ApprovalPopup = approvalPopup && (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center animate-fadeIn"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={() => setApprovalPopup(false)}
    >
      <div
        className="relative animate-bounceIn"
        style={{
          width: '360px', maxWidth: '94vw',
          background: 'linear-gradient(145deg, var(--bg-card) 0%, var(--bg-card-end) 100%)',
          border: '1px solid rgba(16,185,129,0.4)',
          borderRadius: '24px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(16,185,129,0.15), 0 0 60px rgba(16,185,129,0.1)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Top glow */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.8), transparent)' }} />

        {/* Close */}
        <button
          onClick={() => setApprovalPopup(false)}
          style={{
            position: 'absolute', top: '14px', left: '14px',
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'var(--bg-glass)', border: '1px solid var(--border-dim)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-dim)', cursor: 'pointer',
          }}
        >
          <X size={14} />
        </button>

        {/* Header — celebration */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(99,102,241,0.1))',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '28px 24px 20px', textAlign: 'center',
        }}>
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '12px' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.1))',
              border: '2px solid rgba(16,185,129,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto',
              boxShadow: '0 0 40px rgba(16,185,129,0.3)',
            }}>
              <CheckCircle size={36} style={{ color: '#34D399' }} />
            </div>
            {/* Sparkle dots */}
            {['🎉','✨','🌟'].map((e, i) => (
              <span key={i} style={{
                position: 'absolute', fontSize: '16px',
                top: i === 0 ? '-8px' : i === 1 ? '50%' : 'auto',
                bottom: i === 2 ? '-4px' : 'auto',
                right: i === 0 ? '-8px' : i === 2 ? '-12px' : 'auto',
                left: i === 1 ? '-14px' : 'auto',
                animation: `bounceY ${1.2 + i * 0.3}s ease-in-out infinite`,
              }}>{e}</span>
            ))}
          </div>
          <h3 style={{ color: 'var(--text-primary)', fontSize: '20px', fontWeight: '900', marginBottom: '4px' }}>
            המוכר אישר! 🎉
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>העסקה אושרה — הפרטים חשופים</p>
        </div>

        <div style={{ padding: '20px 20px 24px' }}>

          {/* Deal summary */}
          <div style={{
            background: 'var(--bg-glass)',
            border: '1px solid rgba(16,185,129,0.25)',
            borderRadius: '14px', padding: '14px 16px',
            marginBottom: '14px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>מחיר סגירה מאושר</div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: '#34D399', lineHeight: 1 }}>
              ₪{currentOffer.toLocaleString()}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', textDecoration: 'line-through' }}>₪{listingPrice.toLocaleString()}</span>
              <span style={{
                fontSize: '11px', fontWeight: '700', color: '#34D399',
                background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
                padding: '2px 8px', borderRadius: '99px',
              }}>
                חסכת ₪{Math.abs(savings).toLocaleString()} ({savingsPct}%)
              </span>
            </div>
          </div>

          {/* Seller contact */}
          {contact ? (
            <div style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-mid)',
              borderRadius: '14px', padding: '14px 16px',
              marginBottom: '14px',
            }}>
              <p style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                פרטי המוכר
              </p>

              {/* Seller profile */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                {contact.image
                  ? <img src={contact.image} alt={contact.name} style={{ width: '44px', height: '44px', borderRadius: '50%', border: '2px solid rgba(16,185,129,0.4)' }} />
                  : <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #10B981, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '18px' }}>
                      {contact.name?.[0] || '?'}
                    </div>
                }
                <div>
                  <p style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)', marginBottom: '2px' }}>{contact.name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={11} style={{ color: '#34D399' }} />
                    <span style={{ fontSize: '11px', color: '#34D399', fontWeight: '500' }}>מוכר מאומת</span>
                  </div>
                </div>
              </div>

              {/* Contact buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      background: 'linear-gradient(135deg, #059669, #10B981)',
                      color: 'white', fontWeight: '700', fontSize: '14px',
                      padding: '11px 16px', borderRadius: '12px', textDecoration: 'none',
                      boxShadow: '0 4px 20px rgba(16,185,129,0.35)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Phone size={15} />
                    {contact.phone}
                  </a>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  {contact.phone && (
                    <a
                      href={`https://wa.me/972${contact.phone.replace(/[-\s]/g, '').replace(/^0/, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        background: 'rgba(37,211,102,0.15)', color: '#25D366',
                        border: '1px solid rgba(37,211,102,0.35)',
                        fontWeight: '600', fontSize: '12px',
                        padding: '9px 12px', borderRadius: '12px', textDecoration: 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      <MessageCircle size={13} />
                      WhatsApp
                    </a>
                  )}
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        background: 'var(--bg-glass)', color: 'var(--text-secondary)',
                        border: '1px solid var(--border-mid)',
                        fontWeight: '600', fontSize: '12px',
                        padding: '9px 12px', borderRadius: '12px', textDecoration: 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      <Mail size={13} />
                      מייל
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-dim)', borderRadius: '14px', padding: '12px', textAlign: 'center', marginBottom: '14px' }}>
              <p style={{ color: 'var(--text-dim)', fontSize: '12px' }}>צרו קשר ישיר עם המוכר לתיאום מסירה</p>
            </div>
          )}

          {/* Rating section */}
          {user?.id && (
            <div style={{
              background: 'var(--bg-glass)',
              border: '1px solid var(--border-dim)',
              borderRadius: '14px', padding: '14px 16px',
              marginBottom: '14px', textAlign: 'center',
            }}>
              <p style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                {dealRatingSaved ? '✅ תודה על הדירוג!' : 'דרג את העסקה'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
                {[1,2,3,4,5].map(s => (
                  <button
                    key={s}
                    onClick={() => handleDealRate(s)}
                    onMouseEnter={() => !dealRatingSaved && setDealRatingHover(s)}
                    onMouseLeave={() => setDealRatingHover(0)}
                    disabled={dealRatingSaved || dealRatingLoading}
                    style={{
                      background: 'none', border: 'none', cursor: dealRatingSaved ? 'default' : 'pointer',
                      padding: '2px', transition: 'transform 0.15s',
                      transform: !dealRatingSaved && (dealRatingHover || dealRating) >= s ? 'scale(1.2)' : 'scale(1)',
                    }}
                  >
                    <Star
                      size={28}
                      style={{
                        color: (dealRatingHover || dealRating) >= s ? '#FBBF24' : 'var(--text-muted)',
                        fill:  (dealRatingHover || dealRating) >= s ? '#FBBF24' : 'none',
                        transition: 'all 0.15s',
                      }}
                    />
                  </button>
                ))}
              </div>
              {dealRatingLoading && (
                <p style={{ color: 'var(--text-dim)', fontSize: '11px', marginTop: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} />
                  שומר...
                </p>
              )}
            </div>
          )}

          {/* Close */}
          <button
            onClick={() => setApprovalPopup(false)}
            style={{
              width: '100%', padding: '11px',
              borderRadius: '12px',
              background: 'var(--bg-glass)', border: '1px solid var(--border-mid)',
              color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            סגור
          </button>
        </div>
      </div>
    </div>
  );

  /* ── COUNTER ALERT BANNER ── */
  const CounterBanner = counterAlert && (
    <div className="mx-3 mb-2 flex items-center gap-2 bg-violet-500/15 border border-violet-500/40 rounded-xl px-3 py-2 animate-fadeIn">
      <RefreshCw size={13} className="text-violet-400 shrink-0" />
      <p className="text-xs text-violet-300 flex-1">המוכר שלח הצעה נגדית — בדוק את הצ'אט</p>
      <button onClick={() => setCounterAlert(false)} className="text-gray-500 hover:text-white">
        <X size={12} />
      </button>
    </div>
  );

  /* ── REJECTED ── */
  if (dealStatus === 'rejected') {
    return (
      <>
        {ToastStack}
        <div className="bg-slate-800 border border-red-500/50 rounded-xl p-6 text-center animate-bounceIn shadow-xl shadow-black/30">
          <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto mb-4">
            <XCircle size={32} className="text-red-400" />
          </div>
          <h3 className="text-xl font-extrabold text-white mb-1">המוכר דחה את ההצעה</h3>
          <p className="text-gray-400 text-sm mb-5">
            ההצעה של ₪{currentOffer.toLocaleString()} לא התקבלה
          </p>
          <button
            onClick={() => {
              setDealReached(false);
              setDealStatus(null);
              setDealId(null);
              setSuggestedReplies(['מה המינימום שלך?', 'אני מציע יותר', 'בוא נפגש באמצע']);
            }}
            className="w-full bg-gradient-to-r from-emerald-600 to-purple-600 text-white font-bold py-2.5 rounded-xl hover:scale-[1.02] transition-all"
          >
            נסה שוב עם הצעה טובה יותר
          </button>
        </div>
      </>
    );
  }

  /* ── WAITING FOR SELLER ── */
  if (dealStatus === 'pending') {
    return (
      <>
        {ToastStack}
        {ApprovalPopup}
        <div className="bg-slate-800 border border-amber-500/40 rounded-xl p-6 text-center animate-fadeIn shadow-xl shadow-black/30">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500/60 flex items-center justify-center mx-auto mb-4">
            <Clock size={28} className="text-amber-400 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">ממתין לתשובת המוכר</h3>
          <p className="text-gray-400 text-sm mb-5">
            ההצעה שלך לסכום{' '}
            <span className="text-emerald-400 font-bold">₪{currentOffer.toLocaleString()}</span>{' '}
            נשלחה למוכר. הוא יחזיר תשובה בהקדם.
          </p>
          <div className="flex items-center justify-center gap-2 text-amber-400 text-xs">
            <Loader2 size={14} className="animate-spin" />
            <span>בודק תשובה...</span>
          </div>
        </div>
      </>
    );
  }

  /* ── DEAL REACHED — submit to seller ── */
  if (dealReached) {
    return (
      <>
        {ToastStack}
        <div className="bg-slate-800 border border-emerald-500/40 rounded-xl p-6 text-center animate-bounceIn shadow-xl shadow-black/30">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/60 flex items-center justify-center mx-auto mb-4">
            <Sparkles size={28} className="text-emerald-400" />
          </div>
          <h3 className="text-xl font-extrabold text-white mb-1">🤝 הגענו להסכמה!</h3>
          <p className="text-gray-400 text-sm mb-5">שלח את ההצעה למוכר לאישור סופי</p>

          <div className="bg-slate-700/60 border border-slate-600 rounded-xl px-6 py-4 mb-5">
            <div className="text-xs text-gray-400 mb-1">מחיר מוסכם</div>
            <div className="text-3xl font-extrabold text-emerald-400">₪{currentOffer.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1 line-through">₪{listingPrice.toLocaleString()}</div>
            <div className="text-xs text-emerald-400 mt-1 font-medium">
              חיסכון: ₪{Math.abs(savings).toLocaleString()} ({savingsPct}%)
            </div>
          </div>

          <button
            onClick={submitDealToSeller}
            disabled={submitting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60"
          >
            {submitting
              ? <><Loader2 size={16} className="animate-spin" /> שולח...</>
              : <><Send size={16} /> שלח למוכר לאישור</>}
          </button>
        </div>
      </>
    );
  }

  /* ── MAIN CHAT ── */
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col shadow-xl shadow-black/30">
      {ToastStack}
      {ApprovalPopup}

      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-700 bg-gradient-to-r from-purple-600/15 to-emerald-600/10">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-purple-400" />
          <span className="font-bold text-white text-sm">סוכן AI — מתווך</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-xs text-gray-400">מייצג את המוכר</span>
        </div>
      </div>

      {/* Offer panel */}
      <div className="mx-3 mt-3 rounded-xl border border-purple-500/30 bg-purple-500/5 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-xs text-gray-400">הצעה נוכחית</div>
            <div className="text-xl font-extrabold text-purple-300">₪{currentOffer.toLocaleString()}</div>
          </div>
          <div className="text-left">
            <div className="text-xs text-gray-400">מחיר מקורי</div>
            <div className="text-sm font-semibold text-gray-300 line-through">₪{listingPrice.toLocaleString()}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TrendingDown size={13} className="text-emerald-400 shrink-0" />
          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${meterPct}%` }}
            />
          </div>
          {savingsPct > 0 && (
            <span className="text-xs font-bold text-emerald-300">-{savingsPct}%</span>
          )}
        </div>
      </div>

      {CounterBanner}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-64 max-h-80">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 animate-fadeIn ${msg.sender === 'user' ? 'flex-row' : 'flex-row-reverse'}`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white
              ${msg.sender === 'user' ? 'bg-emerald-600' : 'bg-gradient-to-br from-purple-600 to-indigo-600'}`}>
              {msg.sender === 'user' ? <User size={12} /> : <Bot size={12} />}
            </div>

            <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 shadow-md ${
              msg.sender === 'user'
                ? 'bg-emerald-600 text-white rounded-bl-none'
                : 'bg-slate-700 text-gray-100 rounded-br-none'
            }`}>
              <p className="text-xs leading-relaxed">{msg.text}</p>

              {msg.offer && !msg.dealReached && (
                <div className="mt-2 flex items-center justify-between gap-2 bg-amber-400/15 border border-amber-400/40 rounded-lg px-2.5 py-1.5">
                  <span className="text-amber-300 text-xs font-bold">💰 ₪{msg.offer.toLocaleString()}</span>
                  <button
                    onClick={() => sendMessage('מסכים')}
                    className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 rounded-md font-bold transition-all hover:scale-105 active:scale-95"
                  >
                    קבל ✓
                  </button>
                </div>
              )}

              <div className="text-[10px] opacity-40 mt-1">
                {msg.timestamp.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-end gap-2 flex-row-reverse animate-fadeIn">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shrink-0">
              <Bot size={12} />
            </div>
            <div className="bg-slate-700 rounded-2xl rounded-br-none px-4 py-3">
              <div className="flex gap-1.5">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested replies */}
      {suggestedReplies.length > 0 && !loading && (
        <div className="px-3 pb-2 flex gap-2 flex-wrap">
          {suggestedReplies.map((reply, i) => (
            <button
              key={i}
              onClick={() => sendMessage(reply)}
              className="text-xs px-3 py-1.5 rounded-full border font-medium transition-all hover:scale-105 active:scale-95 border-purple-500/40 text-purple-300 bg-purple-500/10 hover:bg-purple-500/20"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-3 pb-3 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={loading ? 'הסוכן מכין תגובה...' : 'כתוב הצעה או שאלה...'}
          disabled={loading}
          className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 text-xs transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-gray-500 text-white px-3.5 py-2.5 rounded-xl transition-all hover:scale-105 active:scale-95"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
