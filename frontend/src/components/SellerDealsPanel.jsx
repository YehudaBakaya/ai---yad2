import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock } from 'lucide-react';
import { subscribeToListingDeals, updateDeal } from '../services/firestoreService';
import { listingsAPI } from '../services/api';

/**
 * SellerDealsPanel — פאנל ניהול עסקאות למוכר
 * מציג הצעות שהגיעו מקונים דרך הסוכן AI, ומאפשר אישור/דחייה.
 */
export default function SellerDealsPanel({ listingId }) {
  const [deals, setDeals]     = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time listener — Firestore onSnapshot
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
      // When approved — hide the listing from the site
      if (status === 'approved') {
        const deal = deals.find(d => d.id === dealId);
        if (deal?.listingId) {
          listingsAPI.update(deal.listingId, { isActive: false }).catch(() => {});
        }
      }
      // onSnapshot will update automatically; update locally for instant feedback
      setDeals(prev => prev.map(d => d.id === dealId ? { ...d, status } : d));
    } catch {}
  };

  const pending  = deals.filter(d => d.status === 'pending');
  const resolved = deals.filter(d => d.status !== 'pending');

  return (
    <div className="bg-slate-800 border border-amber-500/40 rounded-2xl overflow-hidden shadow-lg shadow-black/20">

      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          <span className="font-bold text-white text-sm">הצעות ממתינות לאישור</span>
          {pending.length > 0 && (
            <span className="bg-amber-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
              {pending.length}
            </span>
          )}
        </div>
        <div className="w-2 h-2 bg-emerald-400 rounded-full" title="עדכון בזמן אמת" />
      </div>

      <div className="p-3 space-y-2">
        {loading ? (
          <div className="text-center py-4">
            <div className="w-5 h-5 border-2 border-amber-500/40 border-t-amber-400 rounded-full animate-spin mx-auto" />
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-5">
            <div className="text-2xl mb-2">📭</div>
            <p className="text-gray-500 text-xs">אין הצעות עדיין</p>
            <p className="text-gray-600 text-xs mt-0.5">כשקונה יגיע להסכם עם הסוכן, תראה את ההצעה כאן</p>
          </div>
        ) : (
          <>
            {/* Pending deals first */}
            {pending.map(deal => (
              <DealCard key={deal.id} deal={deal} onDecision={handleDecision} />
            ))}
            {/* Resolved deals */}
            {resolved.length > 0 && (
              <>
                {pending.length > 0 && <div className="border-t border-slate-700 my-2" />}
                <p className="text-xs text-gray-500 font-medium px-1">היסטוריה</p>
                {resolved.map(deal => (
                  <DealCard key={deal.id} deal={deal} onDecision={handleDecision} />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DealCard({ deal, onDecision }) {
  const isPending  = deal.status === 'pending';
  const isApproved = deal.status === 'approved';
  const savings    = deal.listingPrice - deal.agreedPrice;
  const savingsPct = Math.round(Math.abs(savings) / deal.listingPrice * 100);

  return (
    <div className={`border rounded-xl p-3 transition-all ${
      isPending  ? 'border-amber-500/40 bg-amber-500/5' :
      isApproved ? 'border-emerald-500/30 bg-emerald-500/5 opacity-80' :
                   'border-red-500/30 bg-red-500/5 opacity-70'
    }`}>
      {/* Buyer + time */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            {deal.buyerName?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-white text-xs font-semibold">{deal.buyerName}</p>
            <p className="text-gray-500 text-[10px]">
              {(deal.createdAt?.toDate?.() || new Date()).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Status badge */}
        {isPending ? (
          <span className="flex items-center gap-1 text-amber-400 text-xs font-medium">
            <Clock size={11} />
            ממתין
          </span>
        ) : isApproved ? (
          <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
            <CheckCircle size={11} />
            אושר
          </span>
        ) : (
          <span className="flex items-center gap-1 text-red-400 text-xs font-medium">
            <XCircle size={11} />
            נדחה
          </span>
        )}
      </div>

      {/* Price offer */}
      <div className="flex items-center justify-between bg-slate-700/60 rounded-lg px-3 py-2 mb-2">
        <div>
          <div className="text-[10px] text-gray-400">הצעה</div>
          <div className="text-base font-extrabold text-emerald-400">₪{deal.agreedPrice.toLocaleString()}</div>
        </div>
        <div className="text-left">
          <div className="text-[10px] text-gray-400">מחיר מקורי</div>
          <div className="text-xs text-gray-400 line-through">₪{deal.listingPrice.toLocaleString()}</div>
          <div className="text-[10px] text-red-400 font-medium">-{savingsPct}%</div>
        </div>
      </div>

      {/* Action buttons (only for pending) */}
      {isPending && (
        <div className="flex gap-2">
          <button
            onClick={() => onDecision(deal.id, 'approved')}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all"
          >
            <CheckCircle size={13} />
            אשר עסקה
          </button>
          <button
            onClick={() => onDecision(deal.id, 'rejected')}
            className="flex-1 bg-red-600/80 hover:bg-red-600 active:scale-95 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all"
          >
            <XCircle size={13} />
            דחה
          </button>
        </div>
      )}
    </div>
  );
}
