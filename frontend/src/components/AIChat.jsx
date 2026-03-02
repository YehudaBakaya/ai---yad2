import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, CheckCircle, TrendingDown, TrendingUp } from 'lucide-react';
import { aiAPI } from '../services/api';

export default function AIChat({ listingId, listingPrice, role = 'buyer' }) {
  const isBuyer = role === 'buyer';

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: isBuyer
        ? '👋 שלום! אני הנגוד AI שלך. אספר לצד השני מה תקציבך ואנהל עבורך משא ומתן מקצועי. בואו נתחיל!'
        : '👋 שלום! אני הנגוד AI שלך. אשמור על המחיר שלך ואנהל משא ומתן מקצועי מולם. בואו נתחיל!',
      sender: 'ai',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [currentOffer, setCurrentOffer] = useState(listingPrice);
  const [dealReached, setDealReached]   = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState([
    isBuyer ? 'מה הכי נמוך שתוכל?' : 'מה ההצעה שלך?',
    isBuyer ? 'אני מציע מחיר נמוך יותר' : 'המחיר סופי',
    isBuyer ? 'מסכים למחיר הזה' : 'יש גמישות?',
  ]);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    if (!text.trim() || loading || dealReached) return;

    const userMessage = {
      id: Date.now(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSuggestedReplies([]);
    setLoading(true);

    try {
      const response = await aiAPI.negotiate({
        message: text,
        listingId,
        listingPrice,
        history: messages,
        role,
      });

      const { message, currentOffer: newOffer, dealReached: deal, suggestedReplies: replies } = response.data;

      const aiMessage = {
        id: Date.now() + 1,
        text: message,
        sender: 'ai',
        timestamp: new Date(),
        offer: newOffer,
        dealReached: deal,
      };

      setMessages((prev) => [...prev, aiMessage]);
      if (newOffer) setCurrentOffer(newOffer);
      if (deal) setDealReached(true);
      if (replies?.length) setSuggestedReplies(replies);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, text: 'סליחה, הייתה שגיאה. נסה שוב.', sender: 'ai', timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e) => { e.preventDefault(); sendMessage(input); };

  // Negotiation progress: how far from original → current (buyer wants low, seller wants high)
  const savings     = listingPrice - currentOffer;          // positive = buyer saved
  const savingsPct  = Math.round(Math.abs(savings) / listingPrice * 100);
  const meterPct    = Math.min(100, Math.max(0, savingsPct * 3)); // exaggerate for visibility

  const accentCls  = isBuyer ? 'text-blue-400'    : 'text-emerald-400';
  const borderCls  = isBuyer ? 'border-blue-500/40' : 'border-emerald-500/40';
  const bgCls      = isBuyer ? 'bg-blue-500/10'   : 'bg-emerald-500/10';
  const badgeCls   = isBuyer ? 'bg-blue-600'       : 'bg-emerald-600';
  const meterColor = isBuyer ? 'bg-blue-500'       : 'bg-emerald-500';

  /* ── Deal reached screen ── */
  if (dealReached) {
    const diff    = listingPrice - currentOffer;
    const diffAbs = Math.abs(diff);
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl shadow-black/30 flex flex-col items-center justify-center py-10 px-6 text-center animate-bounceIn">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mb-4">
          <CheckCircle size={32} className="text-emerald-400" />
        </div>
        <h3 className="text-xl font-extrabold text-white mb-1">🎉 עסקה הושגה!</h3>
        <p className="text-gray-400 text-sm mb-5">הגעתם להסכמה על מחיר</p>

        <div className="bg-slate-700/60 border border-slate-600 rounded-xl px-6 py-4 w-full mb-5">
          <div className="text-xs text-gray-400 mb-1">מחיר סגירה</div>
          <div className="text-3xl font-extrabold text-emerald-400">₪{currentOffer.toLocaleString()}</div>
          {diffAbs > 0 && (
            <div className={`text-xs mt-1 font-medium ${isBuyer ? 'text-blue-400' : 'text-amber-400'}`}>
              {isBuyer
                ? `חסכת ₪${diffAbs.toLocaleString()} (${savingsPct}%)`
                : `שמרת על ₪${diffAbs.toLocaleString()} מעל המבוקש`}
            </div>
          )}
        </div>

        <p className="text-gray-400 text-xs">צרו קשר ישיר לתיאום מסירה</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col shadow-xl shadow-black/30">

      {/* ── Header ── */}
      <div className={`px-4 py-3 flex items-center justify-between border-b border-slate-700
        ${isBuyer ? 'bg-gradient-to-r from-blue-600/15 to-transparent' : 'bg-gradient-to-r from-emerald-600/15 to-transparent'}`}>
        <div className="flex items-center gap-2">
          <Sparkles size={16} className={accentCls} />
          <span className="font-bold text-white text-sm">משא ומתן AI</span>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${badgeCls} text-white`}>
          {isBuyer ? '🛍️ קונה' : '🏪 מוכר'}
        </span>
      </div>

      {/* ── Offer panel ── */}
      <div className={`mx-3 mt-3 rounded-xl border ${borderCls} ${bgCls} px-4 py-3`}>
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-xs text-gray-400">הצעה נוכחית</div>
            <div className={`text-xl font-extrabold ${accentCls}`}>₪{currentOffer.toLocaleString()}</div>
          </div>
          <div className="text-left">
            <div className="text-xs text-gray-400">מחיר מקורי</div>
            <div className="text-sm font-semibold text-gray-300 line-through">₪{listingPrice.toLocaleString()}</div>
          </div>
        </div>

        {/* Negotiation meter */}
        <div className="flex items-center gap-2">
          {isBuyer ? <TrendingDown size={13} className="text-blue-400 shrink-0" /> : <TrendingUp size={13} className="text-emerald-400 shrink-0" />}
          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${meterColor} rounded-full transition-all duration-700`}
              style={{ width: `${meterPct}%` }}
            />
          </div>
          {savingsPct > 0 && (
            <span className={`text-xs font-bold ${accentCls}`}>
              {isBuyer ? `-${savingsPct}%` : `+${savingsPct}%`}
            </span>
          )}
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-64 max-h-80">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 animate-fadeIn ${msg.sender === 'user' ? 'flex-row' : 'flex-row-reverse'}`}
          >
            {/* Avatar */}
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-white
              ${msg.sender === 'user' ? badgeCls : 'bg-gradient-to-br from-purple-600 to-indigo-600'}`}>
              {msg.sender === 'user' ? <User size={12} /> : <Bot size={12} />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 shadow-md ${
              msg.sender === 'user'
                ? `${isBuyer ? 'bg-gradient-to-br from-blue-600 to-blue-700' : 'bg-gradient-to-br from-emerald-600 to-emerald-700'} text-white rounded-bl-none`
                : 'bg-slate-700 text-gray-100 rounded-br-none'
            }`}>
              <p className="text-xs leading-relaxed">{msg.text}</p>

              {/* Offer badge */}
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

        {/* Typing indicator */}
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

      {/* ── Suggested replies ── */}
      {suggestedReplies.length > 0 && !loading && (
        <div className="px-3 pb-2 flex gap-2 flex-wrap">
          {suggestedReplies.map((reply, i) => (
            <button
              key={i}
              onClick={() => sendMessage(reply)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all hover:scale-105 active:scale-95
                ${isBuyer
                  ? 'border-blue-500/40 text-blue-300 bg-blue-500/10 hover:bg-blue-500/20'
                  : 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20'}`}
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* ── Input ── */}
      <form onSubmit={handleSubmit} className="px-3 pb-3 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={loading ? 'AI מכין תגובה...' : 'כתוב הודעה או בחר תשובה למעלה...'}
          disabled={loading || dealReached}
          className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 text-xs transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim() || dealReached}
          className={`${isBuyer ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-600 hover:bg-emerald-500'} disabled:bg-slate-700 disabled:text-gray-500 text-white px-3.5 py-2.5 rounded-xl transition-all hover:scale-105 active:scale-95`}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
