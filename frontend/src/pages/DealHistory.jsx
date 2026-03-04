import React, { useState, useEffect } from 'react';
import { ShoppingBag, Store, CheckCircle, XCircle, Clock, Phone, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getBuyerDeals, getSellerDeals } from '../services/firestoreService';

const STATUS_LABEL = { pending: 'ממתין', approved: 'אושר', rejected: 'נדחה' };
const STATUS_COLOR = {
  pending:  'text-amber-400 border-amber-500/40 bg-amber-500/10',
  approved: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
  rejected: 'text-red-400 border-red-500/40 bg-red-500/10',
};
const StatusIcon = ({ s }) =>
  s === 'approved' ? <CheckCircle size={13} /> :
  s === 'rejected' ? <XCircle size={13} /> :
  <Clock size={13} />;

export default function DealHistory() {
  const { user } = useAuth();
  const [tab, setTab]           = useState('buyer');
  const [buyerDeals, setBuyer]  = useState([]);
  const [sellerDeals, setSeller]= useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    Promise.all([getBuyerDeals(user.id), getSellerDeals(user.id)])
      .then(([b, s]) => { setBuyer(b); setSeller(s); })
      .finally(() => setLoading(false));
  }, [user?.id]);

  const deals = tab === 'buyer' ? buyerDeals : sellerDeals;

  return (
    <div className="min-h-screen bg-slate-900 pt-8 pb-16 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-white mb-1">היסטוריית עסקאות</h1>
          <p className="text-gray-400 text-sm">כל הקניות והמכירות שלך במקום אחד</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <TabBtn
            active={tab === 'buyer'}
            onClick={() => setTab('buyer')}
            icon={<ShoppingBag size={15} />}
            label="קניות שלי"
            count={buyerDeals.length}
          />
          <TabBtn
            active={tab === 'seller'}
            onClick={() => setTab('seller')}
            icon={<Store size={15} />}
            label="מכירות שלי"
            count={sellerDeals.length}
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-violet-500/40 border-t-violet-400 rounded-full animate-spin" />
          </div>
        ) : deals.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">{tab === 'buyer' ? '🛒' : '🏪'}</div>
            <p className="text-gray-400">{tab === 'buyer' ? 'עוד לא ביצעת קניות' : 'עוד לא ביצעת מכירות'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deals.map(deal => (
              <DealCard key={deal.id} deal={deal} isBuyer={tab === 'buyer'} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
        active
          ? 'bg-violet-600 border-violet-500 text-white shadow-md shadow-violet-500/30'
          : 'bg-slate-800 border-slate-700 text-gray-400 hover:text-white hover:border-slate-600'
      }`}
    >
      {icon}
      {label}
      {count > 0 && (
        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-slate-700'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function DealCard({ deal, isBuyer }) {
  const savingsPct = Math.round(Math.abs(deal.listingPrice - deal.agreedPrice) / deal.listingPrice * 100);
  const dateStr = deal.createdAt?.toDate
    ? deal.createdAt.toDate().toLocaleDateString('he-IL')
    : '';

  return (
    <div className={`bg-slate-800 border rounded-2xl p-4 ${
      deal.status === 'approved' ? 'border-emerald-500/30' :
      deal.status === 'rejected' ? 'border-red-500/20' : 'border-slate-700'
    }`}>
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-white font-bold text-sm leading-tight mb-0.5">{deal.listingTitle}</h3>
          {dateStr && <p className="text-gray-500 text-xs">{dateStr}</p>}
        </div>
        <span className={`flex items-center gap-1 text-xs font-semibold border px-2 py-1 rounded-full ${STATUS_COLOR[deal.status]}`}>
          <StatusIcon s={deal.status} />
          {STATUS_LABEL[deal.status]}
        </span>
      </div>

      {/* Prices */}
      <div className="flex items-center gap-3 bg-slate-700/50 rounded-xl px-3 py-2 mb-3">
        <div>
          <div className="text-[10px] text-gray-400">מחיר שסוכם</div>
          <div className="text-lg font-extrabold text-emerald-400">₪{deal.agreedPrice?.toLocaleString()}</div>
        </div>
        <div className="w-px h-8 bg-slate-600 mx-1" />
        <div>
          <div className="text-[10px] text-gray-400">מחיר מקורי</div>
          <div className="text-sm text-gray-400 line-through">₪{deal.listingPrice?.toLocaleString()}</div>
          <div className="text-[10px] text-emerald-500 font-medium">חסכת {savingsPct}%</div>
        </div>
      </div>

      {/* Seller contact — only for approved buyer deals */}
      {isBuyer && deal.status === 'approved' && deal.sellerContact && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-3 py-2.5">
          <p className="text-emerald-400 text-xs font-bold mb-1.5">פרטי המוכר</p>
          <div className="space-y-1">
            {deal.sellerContact.name && (
              <p className="text-white text-sm font-medium">{deal.sellerContact.name}</p>
            )}
            {deal.sellerContact.phone && (
              <a href={`tel:${deal.sellerContact.phone}`} className="flex items-center gap-1.5 text-cyan-400 text-sm hover:underline">
                <Phone size={13} />
                {deal.sellerContact.phone}
              </a>
            )}
            {deal.sellerContact.email && (
              <a href={`mailto:${deal.sellerContact.email}`} className="flex items-center gap-1.5 text-cyan-400 text-sm hover:underline">
                <Mail size={13} />
                {deal.sellerContact.email}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Buyer name — for seller view */}
      {!isBuyer && (
        <div className="text-xs text-gray-400">
          קונה: <span className="text-white font-medium">{deal.buyerName}</span>
        </div>
      )}
    </div>
  );
}
