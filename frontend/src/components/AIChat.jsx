import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, CheckCircle, XCircle, TrendingDown, Clock, Loader2, Phone } from 'lucide-react';
import { aiAPI, api } from '../services/api';
import { createDeal, subscribeToDeal } from '../services/firestoreService';
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
    'מה הכי נמוך שתוכל?',
    'אני מציע מחיר נמוך יותר',
    'יש אפשרות להנחה?',
  ]);

  // Deal submission state
  const [submitting, setSubmitting] = useState(false);
  const [dealId, setDealId]         = useState(null);
  const [dealStatus, setDealStatus] = useState(null); // null | 'pending' | 'approved' | 'rejected'

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Revealed contact after approval
  const [revealedContact, setRevealedContact] = useState(null);

  // Real-time listener for seller decision (Firestore onSnapshot)
  useEffect(() => {
    if (!dealId) return;
    const unsubscribe = subscribeToDeal(dealId, (deal) => {
      if (deal.status !== 'pending') {
        setDealStatus(deal.status);
        if (deal.status === 'approved' && deal.sellerContact) {
          setRevealedContact(deal.sellerContact);
        }
      }
    });
    return unsubscribe;
  }, [dealId]);

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
        role: 'seller', // AI תמיד מייצג את המוכר
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

      // Send email notification to seller (fire-and-forget)
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
      alert('שגיאה בשליחת ההצעה. נסה שוב.');
    } finally {
      setSubmitting(false);
    }
  };

  const savings    = listingPrice - currentOffer;
  const savingsPct = Math.round(Math.abs(savings) / listingPrice * 100);
  const meterPct   = Math.min(100, Math.max(0, savingsPct * 3));

  /* ── APPROVED ── */
  if (dealStatus === 'approved') {
    const contact = revealedContact || sellerContact;
    return (
      <div className="bg-slate-800 border border-emerald-500/50 rounded-xl p-6 animate-bounceIn shadow-xl shadow-black/30 space-y-4">
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto mb-3">
            <CheckCircle size={28} className="text-emerald-400" />
          </div>
          <h3 className="text-xl font-extrabold text-white mb-1">🎉 המוכר אישר!</h3>
          <p className="text-gray-400 text-sm">העסקה אושרה — כל הכבוד!</p>
        </div>

        <div className="bg-slate-700/60 border border-emerald-500/30 rounded-xl px-5 py-3 text-center">
          <div className="text-xs text-gray-400 mb-1">מחיר סגירה מאושר</div>
          <div className="text-3xl font-extrabold text-emerald-400">₪{currentOffer.toLocaleString()}</div>
          <div className="text-xs text-blue-400 mt-1 font-medium">
            חסכת ₪{Math.abs(savings).toLocaleString()} ({savingsPct}% מהמחיר המקורי)
          </div>
        </div>

        {/* Seller contact — revealed now */}
        {contact ? (
          <div className="bg-slate-700/60 border border-slate-600 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">פרטי המוכר</p>
            <div className="flex items-center gap-3 mb-3">
              {contact.image && (
                <img src={contact.image} alt={contact.name} className="w-10 h-10 rounded-full ring-2 ring-emerald-500/40" />
              )}
              <div>
                <p className="font-bold text-white">{contact.name}</p>
                <p className="text-xs text-gray-400">✅ מוכר מאומת</p>
              </div>
            </div>
            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl transition-all hover:scale-[1.02] active:scale-95 text-sm"
              >
                <Phone size={15} />
                {contact.phone}
              </a>
            )}
          </div>
        ) : (
          <p className="text-gray-400 text-xs text-center">צרו קשר ישיר עם המוכר לתיאום מסירה</p>
        )}
      </div>
    );
  }

  /* ── REJECTED ── */
  if (dealStatus === 'rejected') {
    return (
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
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-2.5 rounded-xl hover:scale-[1.02] transition-all"
        >
          נסה שוב עם הצעה טובה יותר
        </button>
      </div>
    );
  }

  /* ── WAITING FOR SELLER ── */
  if (dealStatus === 'pending') {
    return (
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
    );
  }

  /* ── DEAL REACHED — submit to seller ── */
  if (dealReached) {
    return (
      <div className="bg-slate-800 border border-blue-500/40 rounded-xl p-6 text-center animate-bounceIn shadow-xl shadow-black/30">
        <div className="w-16 h-16 rounded-full bg-blue-500/20 border-2 border-blue-500/60 flex items-center justify-center mx-auto mb-4">
          <Sparkles size={28} className="text-blue-400" />
        </div>
        <h3 className="text-xl font-extrabold text-white mb-1">🤝 הגענו להסכמה!</h3>
        <p className="text-gray-400 text-sm mb-5">שלח את ההצעה למוכר לאישור סופי</p>

        <div className="bg-slate-700/60 border border-slate-600 rounded-xl px-6 py-4 mb-5">
          <div className="text-xs text-gray-400 mb-1">מחיר מוסכם</div>
          <div className="text-3xl font-extrabold text-blue-400">₪{currentOffer.toLocaleString()}</div>
          <div className="text-xs text-gray-500 mt-1 line-through">₪{listingPrice.toLocaleString()}</div>
          <div className="text-xs text-emerald-400 mt-1 font-medium">
            חיסכון: ₪{Math.abs(savings).toLocaleString()} ({savingsPct}%)
          </div>
        </div>

        <button
          onClick={submitDealToSeller}
          disabled={submitting}
          className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60"
        >
          {submitting
            ? <><Loader2 size={16} className="animate-spin" /> שולח...</>
            : <><Send size={16} /> שלח למוכר לאישור</>}
        </button>
      </div>
    );
  }

  /* ── MAIN CHAT ── */
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col shadow-xl shadow-black/30">

      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-slate-700 bg-gradient-to-r from-purple-600/15 to-blue-600/10">
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
          <TrendingDown size={13} className="text-blue-400 shrink-0" />
          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-700"
              style={{ width: `${meterPct}%` }}
            />
          </div>
          {savingsPct > 0 && (
            <span className="text-xs font-bold text-blue-300">-{savingsPct}%</span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-64 max-h-80">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 animate-fadeIn ${msg.sender === 'user' ? 'flex-row' : 'flex-row-reverse'}`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white
              ${msg.sender === 'user' ? 'bg-blue-600' : 'bg-gradient-to-br from-purple-600 to-indigo-600'}`}>
              {msg.sender === 'user' ? <User size={12} /> : <Bot size={12} />}
            </div>

            <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 shadow-md ${
              msg.sender === 'user'
                ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-bl-none'
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
