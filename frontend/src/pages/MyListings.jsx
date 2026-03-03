import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Tag, TrendingUp, Plus, Clock, CheckCircle, XCircle, ChevronLeft, Pencil, Trash2, X, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getMyListings, subscribeToListingDeals, deleteListing, updateListing } from '../services/firestoreService';

// ── Hook: real-time deal counts per listing ──────────────────────────────────
function useListingDeals(listingId) {
  const [deals, setDeals] = useState([]);
  useEffect(() => {
    const unsubscribe = subscribeToListingDeals(listingId, setDeals);
    return unsubscribe;
  }, [listingId]);
  return deals;
}

// ── Edit Modal ────────────────────────────────────────────────────────────────
function EditModal({ listing, onClose, onSaved }) {
  const [form, setForm] = useState({
    title:    listing.title    || '',
    price:    listing.price    ?? '',
    location: listing.location || '',
    condition:listing.condition|| 'טוב',
    description: listing.description || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const conditions = ['חדש', 'מעולה', 'טוב', 'סביר', 'דורש תיקון'];

  const handleSave = async () => {
    if (!form.title.trim()) { setError('כותרת חובה'); return; }
    setSaving(true);
    try {
      await updateListing(listing.id, {
        title:       form.title.trim(),
        price:       parseFloat(form.price) || 0,
        location:    form.location.trim(),
        condition:   form.condition,
        description: form.description.trim(),
      });
      onSaved({ ...listing, ...form, price: parseFloat(form.price) || 0 });
    } catch {
      setError('שגיאה בשמירה. נסה שוב.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl shadow-black/50 animate-slideUp">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="font-bold text-white text-lg">עריכת מודעה</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">כותרת *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">מחיר (₪)</label>
              <input
                type="number"
                value={form.price}
                onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">מיקום</label>
              <input
                type="text"
                value={form.location}
                onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">מצב</label>
            <div className="flex flex-wrap gap-2">
              {conditions.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, condition: c }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                    ${form.condition === c
                      ? 'bg-violet-500/20 border-violet-500 text-violet-300'
                      : 'bg-slate-700 border-slate-600 text-gray-400 hover:border-slate-500'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1.5">תיאור</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              rows={3}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition-all resize-none"
            />
          </div>

          {error && <p className="text-red-400 text-xs">⚠ {error}</p>}
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl transition-all text-sm"
          >
            ביטול
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
          >
            {saving
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> שומר...</>
              : <><Check size={16} /> שמור שינויים</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Confirmation ───────────────────────────────────────────────────────
function DeleteConfirm({ listing, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteListing(listing.id);
      onDeleted(listing.id);
    } catch {
      alert('שגיאה במחיקה. נסה שוב.');
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-800 border border-red-500/30 rounded-2xl w-full max-w-sm shadow-2xl shadow-black/50 animate-bounceIn p-6 text-center">
        <div className="w-14 h-14 bg-red-500/20 border-2 border-red-500/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 size={24} className="text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-1">מחיקת מודעה</h2>
        <p className="text-gray-400 text-sm mb-1">האם למחוק את המודעה?</p>
        <p className="text-white font-semibold text-sm mb-5 line-clamp-1">"{listing.title}"</p>
        <p className="text-red-400 text-xs mb-5">פעולה זו אינה ניתנת לביטול</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl transition-all text-sm"
          >
            ביטול
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-all text-sm"
          >
            {deleting ? 'מוחק...' : 'מחק'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Single listing row ────────────────────────────────────────────────────────
function ListingRow({ listing, onEdit, onDelete }) {
  const deals    = useListingDeals(listing.id);
  const pending  = deals.filter(d => d.status === 'pending').length;
  const approved = deals.filter(d => d.status === 'approved').length;
  const rejected = deals.filter(d => d.status === 'rejected').length;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden hover:border-slate-600 transition-all duration-200 animate-fadeIn">
      <div className="flex gap-0">

        {/* Thumbnail */}
        <div className="w-28 sm:w-36 shrink-0">
          <img
            src={listing.images?.[0]}
            alt={listing.title}
            className="w-full h-full object-cover"
            style={{ minHeight: '100px' }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="font-bold text-white text-sm leading-snug line-clamp-2">{listing.title}</h3>
              <span className="shrink-0 text-sm font-extrabold text-violet-400">
                {listing.price === 0 ? 'חינם' : `₪${listing.price?.toLocaleString()}`}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mb-3">
              <span className="bg-violet-500/15 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full">
                {listing.category}
              </span>
              <span className="flex items-center gap-1">
                <Eye size={11} className="text-cyan-400" />
                {listing.views?.toLocaleString() || 0} צפיות
              </span>
              <span className="text-gray-600">•</span>
              <span>{listing.location}</span>
            </div>
          </div>

          {/* Deals + Actions */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-2 flex-wrap">
              {pending > 0 && (
                <span className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-bold px-2.5 py-1 rounded-full">
                  <Clock size={11} />
                  {pending} ממתין
                </span>
              )}
              {approved > 0 && (
                <span className="flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium px-2.5 py-1 rounded-full">
                  <CheckCircle size={11} />
                  {approved} אושר
                </span>
              )}
              {rejected > 0 && (
                <span className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium px-2.5 py-1 rounded-full">
                  <XCircle size={11} />
                  {rejected} נדחה
                </span>
              )}
              {deals.length === 0 && (
                <span className="text-xs text-gray-600">אין הצעות עדיין</span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Edit */}
              <button
                onClick={() => onEdit(listing)}
                title="עריכה"
                className="p-1.5 rounded-lg text-gray-400 hover:text-violet-300 hover:bg-violet-500/10 transition-all"
              >
                <Pencil size={14} />
              </button>

              {/* Delete */}
              <button
                onClick={() => onDelete(listing)}
                title="מחיקה"
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <Trash2 size={14} />
              </button>

              {/* Manage deals */}
              <Link
                to={`/listings/${listing.id}`}
                className="flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors mr-1"
              >
                ניהול
                <ChevronLeft size={13} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MyListings() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editTarget, setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (!user?.id) return;
    getMyListings(user.id)
      .then(setListings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user?.id]);

  const handleSaved = (updated) =>
    setListings(prev => prev.map(l => l.id === updated.id ? updated : l));

  const handleDeleted = (id) =>
    setListings(prev => prev.filter(l => l.id !== id));

  const totalViews = listings.reduce((sum, l) => sum + (l.views || 0), 0);

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8 animate-fadeIn">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1 h-7 bg-gradient-to-b from-violet-500 to-cyan-500 rounded-full" />
              <h1 className="text-2xl font-extrabold text-white">המודעות שלי</h1>
            </div>
            <p className="text-gray-400 text-sm mr-4">נהל את המודעות שפרסמת וראה הצעות ממתינות</p>
          </div>
          <Link
            to="/create"
            className="btn-shimmer text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-2 text-sm shadow-lg shadow-violet-500/20"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">פרסם חדשה</span>
          </Link>
        </div>

        {/* Stats bar */}
        {!loading && listings.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6 animate-fadeIn">
            <StatCard label="מודעות"    value={listings.length}                             icon={<Tag size={16} className="text-violet-400" />}  color="violet" />
            <StatCard label="סה״כ צפיות" value={totalViews.toLocaleString()}               icon={<Eye size={16} className="text-cyan-400" />}    color="cyan" />
            <StatCard label="קטגוריות"  value={new Set(listings.map(l => l.categoryEn)).size} icon={<TrendingUp size={16} className="text-emerald-400" />} color="emerald" />
          </div>
        )}

        {/* Listings */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-slate-800 rounded-2xl h-28 animate-pulse" />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 animate-fadeIn">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-xl font-bold text-white mb-2">עדיין לא פרסמת מודעות</h2>
            <p className="text-gray-400 text-sm mb-7">פרסם את המוצר הראשון שלך — AI יעזור לך לכתוב תיאור ולנהל משא ומתן</p>
            <Link
              to="/create"
              className="inline-block bg-gradient-to-r from-emerald-500 to-violet-600 hover:from-emerald-400 hover:to-violet-500 text-white font-bold py-3 px-8 rounded-xl transition-all hover:scale-105 shadow-lg shadow-emerald-500/30"
            >
              פרסם מודעה ראשונה ✨
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map(listing => (
              <ListingRow
                key={listing.id}
                listing={listing}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {editTarget && (
        <EditModal
          listing={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) => { handleSaved(updated); setEditTarget(null); }}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm
          listing={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={(id) => { handleDeleted(id); setDeleteTarget(null); }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  const colors = {
    violet:  'from-violet-500/10 to-violet-500/5 border-violet-500/20',
    cyan:    'from-cyan-500/10 to-cyan-500/5 border-cyan-500/20',
    emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/20',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-4 text-center`}>
      <div className="flex justify-center mb-1.5">{icon}</div>
      <div className="text-xl font-extrabold text-white">{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}
