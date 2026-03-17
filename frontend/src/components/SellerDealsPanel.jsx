import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { subscribeToListingDeals, updateDeal, counterDeal } from '../services/firestoreService';
import { listingsAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

export default function SellerDealsPanel({ listingId }) {
  const [deals, setDeals]     = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const [toasts, setToasts]   = useState([]);

  const addToast = (type, text) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, type, text }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  };

  useEffect(() => {
    const unsubscribe = subscribeToListingDeals(listingId, (newDeals) => {
      setDeals(newDeals);
      setLoading(false);
    });
    return unsubscribe;
  }, [listingId]);

  const handleDecision = async (dealId, status) => {
    try {
      await updateDeal(dealId, status);
      if (status === 'approved') {
        const deal = deals.find(d => d.id === dealId);
        if (deal?.listingId) {
          listingsAPI.update(deal.listingId, { isActive: false }).catch(() => {});
        }
        addToast('success', `✅ אישרת את העסקה — ₪${deals.find(d => d.id === dealId)?.agreedPrice?.toLocaleString()}`);
      } else if (status === 'rejected') {
        addToast('info', '❌ הצעה נדחתה');
      }
      setDeals(prev => prev.map(d => d.id === dealId ? { ...d, status } : d));
    } catch {
      addToast('error', 'שגיאה — נסה שוב');
    }
  };

  const [counterModal, setCounterModal] = useState(null); // { dealId, listingPrice, agreedPrice }
  const [counterPrice, setCounterPrice] = useState('');
  const [counterMsg,   setCounterMsg]   = useState('');
  const [counterSaving, setCounterSaving] = useState(false);

  const openCounterModal = (deal) => {
    setCounterModal({ dealId: deal.id, listingPrice: deal.listingPrice, agreedPrice: deal.agreedPrice });
    setCounterPrice(Math.round((deal.agreedPrice + deal.listingPrice) / 2).toString());
    setCounterMsg('');
  };

  const submitCounter = async () => {
    if (!counterModal || !counterPrice) return;
    setCounterSaving(true);
    try {
      await counterDeal(counterModal.dealId, counterPrice, counterMsg);
      addToast('info', `🔄 הצעה נגדית נשלחה — ₪${Number(counterPrice).toLocaleString()}`);
      setCounterModal(null);
      setDeals(prev => prev.map(d => d.id === counterModal.dealId ? { ...d, status: 'countered' } : d));
    } catch {
      addToast('error', 'שגיאה בשליחת הצעה נגדית');
    } finally {
      setCounterSaving(false);
    }
  };

  const pending  = deals.filter(d => d.status === 'pending');
  const resolved = deals.filter(d => d.status !== 'pending');

  return (
    <div className="relative bg-slate-800 border border-amber-500/40 rounded-2xl overflow-hidden shadow-lg shadow-black/20">

      {/* Toast stack */}
      <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="animate-slideUp pointer-events-auto" style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: toast.type === 'success' ? 'linear-gradient(135deg,rgba(5,150,105,.95),rgba(16,185,129,.95))'
              : toast.type === 'error' ? 'linear-gradient(135deg,rgba(185,28,28,.95),rgba(239,68,68,.95))'
              : 'linear-gradient(135deg,rgba(99,102,241,.95),rgba(139,92,246,.95))',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '10px 14px', borderRadius: '14px',
            boxShadow: '0 8px 32px rgba(0,0,0,.3)',
            maxWidth: '280px', fontSize: '13px', fontWeight: '600', color: 'white',
          }}>
            {toast.text}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          <span className="font-bold text-white text-sm">{t('deals.header')}</span>
          {pending.length > 0 && (
            <span className="bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
              {pending.length}
            </span>
          )}
        </div>
        <div className="w-2 h-2 bg-emerald-400 rounded-full" />
      </div>

      <div className="p-3 space-y-2">
        {loading ? (
          <div className="text-center py-4">
            <div className="w-5 h-5 border-2 border-amber-500/40 border-t-amber-400 rounded-full animate-spin mx-auto" />
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-5">
            <div className="text-2xl mb-2">📭</div>
            <p className="text-gray-500 text-xs">{t('deals.noDeals')}</p>
            <p className="text-gray-600 text-xs mt-0.5">{t('deals.noDealsDesc')}</p>
          </div>
        ) : (
          <>
            {pending.map(deal => (
              <DealCard key={deal.id} deal={deal} onDecision={handleDecision} onCounter={openCounterModal} />
            ))}
            {resolved.length > 0 && (
              <>
                {pending.length > 0 && <div className="border-t border-slate-700 my-2" />}
                <p className="text-xs text-gray-500 font-medium px-1">{t('deals.history')}</p>
                {resolved.map(deal => (
                  <DealCard key={deal.id} deal={deal} onDecision={handleDecision} onCounter={openCounterModal} />
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* Counter Offer Modal */}
      {counterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn" onClick={() => setCounterModal(null)}>
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 w-80 shadow-2xl shadow-black/50 animate-bounceIn" onClick={e => e.stopPropagation()}>
            <h3 className="text-white font-bold text-base mb-1 flex items-center gap-2">
              <RefreshCw size={16} className="text-emerald-400" />
              הצעה נגדית
            </h3>
            <p className="text-gray-400 text-xs mb-4">
              הקונה הציע ₪{counterModal.agreedPrice.toLocaleString()} — הכנס את הצעתך
            </p>

            <label className="text-xs text-gray-400 block mb-1">מחיר מוצע (₪)</label>
            <input
              type="number"
              value={counterPrice}
              onChange={e => setCounterPrice(e.target.value)}
              min={counterModal.agreedPrice}
              max={counterModal.listingPrice}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-emerald-500 mb-3"
              autoFocus
            />

            <label className="text-xs text-gray-400 block mb-1">הודעה לקונה (אופציונלי)</label>
            <textarea
              value={counterMsg}
              onChange={e => setCounterMsg(e.target.value)}
              placeholder="למשל: זה המינימום שלי, המוצר במצב מושלם..."
              rows={2}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-emerald-500 resize-none mb-4 placeholder-gray-500"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setCounterModal(null)}
                className="flex-1 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-gray-300 text-sm font-medium transition-all"
              >
                ביטול
              </button>
              <button
                onClick={submitCounter}
                disabled={counterSaving || !counterPrice}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-bold transition-all flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={13} />
                {counterSaving ? 'שולח...' : 'שלח'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DealCard({ deal, onDecision, onCounter }) {
  const { t, lang } = useLanguage();
  const isPending   = deal.status === 'pending';
  const isApproved  = deal.status === 'approved';
  const isCountered = deal.status === 'countered';
  const savings    = deal.listingPrice - deal.agreedPrice;
  const savingsPct = Math.round(Math.abs(savings) / deal.listingPrice * 100);

  return (
    <div className={`border rounded-xl p-3 transition-all ${
      isPending   ? 'border-amber-500/40 bg-amber-500/5' :
      isApproved  ? 'border-emerald-500/30 bg-emerald-500/5 opacity-80' :
      isCountered ? 'border-emerald-500/40 bg-emerald-500/5' :
                    'border-red-500/30 bg-red-500/5 opacity-70'
    }`}>
      {/* Buyer + time */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            {deal.buyerName?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-white text-xs font-semibold">{deal.buyerName}</p>
            <p className="text-gray-500 text-[10px]">
              {(deal.createdAt?.toDate?.() || new Date()).toLocaleTimeString(lang === 'he' ? 'he-IL' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Status badge */}
        {isPending ? (
          <span className="flex items-center gap-1 text-amber-400 text-xs font-medium">
            <Clock size={11} />
            {t('deals.pending')}
          </span>
        ) : isApproved ? (
          <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
            <CheckCircle size={11} />
            {t('deals.approved')}
          </span>
        ) : isCountered ? (
          <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
            <RefreshCw size={11} />
            הצעה נגדית נשלחה
          </span>
        ) : (
          <span className="flex items-center gap-1 text-red-400 text-xs font-medium">
            <XCircle size={11} />
            {t('deals.rejected')}
          </span>
        )}
      </div>

      {/* Price offer */}
      <div className="flex items-center justify-between bg-slate-700/60 rounded-lg px-3 py-2 mb-2">
        <div>
          <div className="text-[10px] text-gray-400">{t('deals.offer')}</div>
          <div className="text-base font-extrabold text-emerald-400">₪{deal.agreedPrice.toLocaleString()}</div>
        </div>
        <div className="text-left">
          <div className="text-[10px] text-gray-400">{t('deals.origPrice')}</div>
          <div className="text-xs text-gray-400 line-through">₪{deal.listingPrice.toLocaleString()}</div>
          <div className="text-[10px] text-red-400 font-medium">-{savingsPct}%</div>
        </div>
      </div>

      {/* Action buttons (only for pending) */}
      {isPending && (
        <div className="flex gap-1.5">
          <button
            onClick={() => onDecision(deal.id, 'approved')}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1 transition-all"
          >
            <CheckCircle size={12} />
            {t('deals.approve')}
          </button>
          <button
            onClick={() => onCounter(deal)}
            className="flex-1 bg-violet-600 hover:bg-violet-500 active:scale-95 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1 transition-all"
          >
            <RefreshCw size={12} />
            נגדי
          </button>
          <button
            onClick={() => onDecision(deal.id, 'rejected')}
            className="flex-1 bg-red-600/80 hover:bg-red-600 active:scale-95 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1 transition-all"
          >
            <XCircle size={12} />
            {t('deals.reject')}
          </button>
        </div>
      )}

      {/* Show counter details if countered */}
      {isCountered && deal.counterPrice && (
        <div className="mt-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-3 py-2 text-xs">
          <span className="text-emerald-400 font-bold">הצעתך: ₪{deal.counterPrice.toLocaleString()}</span>
          {deal.counterMessage && (
            <p className="text-gray-400 mt-0.5">{deal.counterMessage}</p>
          )}
        </div>
      )}
    </div>
  );
}
