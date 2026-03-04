import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Lock, Star, Share2, Heart, ChevronLeft, ChevronRight, MapPin, Eye, Briefcase } from 'lucide-react';
import AIChat from '../components/AIChat';
import SellerDealsPanel from '../components/SellerDealsPanel';
import PriceAnalysis from '../components/PriceAnalysis';
import ListingCard from '../components/ListingCard';
import { listingsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../hooks/useFavorites';

export default function ListingDetail() {
  const { id } = useParams();
  const { isLoggedIn, user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [listing, setListing]           = useState(null);
  const [loading, setLoading]           = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [similarListings, setSimilarListings] = useState([]);
  const [heartAnim, setHeartAnim]       = useState(false);
  const [copied, setCopied]             = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const { data } = await listingsAPI.getOne(id);
        setListing(data);
        if (data?.categoryEn) {
          const { data: allSimilar } = await listingsAPI.getAll({ category: data.categoryEn });
          setSimilarListings(allSimilar.filter(l => l.id !== id).slice(0, 3));
        }
      } catch (error) {
        console.error('Error fetching listing:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 py-8 px-4">
        <div className="max-w-6xl mx-auto animate-pulse space-y-4">
          <div className="bg-slate-800 h-96 rounded-2xl" />
          <div className="bg-slate-800 h-40 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">😕</div>
          <p className="text-gray-400 text-lg">המודעה לא נמצאה</p>
        </div>
      </div>
    );
  }

  const nextImage = () => setCurrentImageIndex((p) => (p + 1) % listing.images.length);
  const prevImage = () => setCurrentImageIndex((p) => (p - 1 + listing.images.length) % listing.images.length);

  const toggleSave = () => {
    if (listing) toggleFavorite(listing);
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 300);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = listing?.title || 'מודעה ביד2 AI';
    if (navigator.share) {
      try { await navigator.share({ title, url }); return; } catch {}
    }
    // fallback — copy to clipboard
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  // האם המשתמש המחובר הוא הבעלים של המוצר?
  const isOwner = isLoggedIn && user?.id && listing.userId === user.id;

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4">
      <div className="max-w-6xl mx-auto animate-fadeIn">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ===== MAIN CONTENT ===== */}
          <div className="lg:col-span-2 space-y-5">

            {/* Image Carousel */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl shadow-black/30 group">
              <div className="relative">
                <img
                  src={listing.images[currentImageIndex]}
                  alt={listing.title}
                  className="w-full h-96 object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                {listing.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur hover:bg-black/80 text-white p-2.5 rounded-full transition-all hover:scale-110"
                    >
                      <ChevronRight size={22} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur hover:bg-black/80 text-white p-2.5 rounded-full transition-all hover:scale-110"
                    >
                      <ChevronLeft size={22} />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {listing.images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`rounded-full transition-all duration-300 ${
                            idx === currentImageIndex
                              ? 'w-6 h-2.5 bg-white'
                              : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/60'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg shadow-black/20">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 ml-4">
                  <h1 className="text-2xl font-bold text-white mb-3 leading-snug">{listing.title}</h1>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-blue-500/20 text-blue-300 border border-blue-500/40 px-3 py-1 rounded-full text-sm font-medium">
                      {listing.category}
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full text-sm font-medium">
                      {listing.condition}
                    </span>
                    {listing.rating && (
                      <span className="flex items-center gap-1 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 px-3 py-1 rounded-full text-sm font-medium">
                        <Star size={13} className="fill-yellow-400" />
                        {listing.rating}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={toggleSave}
                    title={isFavorite(listing.id) ? 'הסר ממועדפים' : 'שמור למועדפים'}
                    className="bg-slate-700 hover:bg-slate-600 text-white p-2.5 rounded-xl transition-all hover:scale-110"
                  >
                    <Heart
                      size={20}
                      className={`transition-colors ${heartAnim ? 'animate-heartbeat' : ''} ${isFavorite(listing.id) ? 'fill-red-500 text-red-500' : ''}`}
                    />
                  </button>
                  <button
                    onClick={handleShare}
                    title="שתף מודעה"
                    className="relative bg-slate-700 hover:bg-slate-600 text-white p-2.5 rounded-xl transition-all hover:scale-110"
                  >
                    <Share2 size={20} />
                    {copied && (
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-700 text-emerald-400 text-xs font-medium px-2 py-1 rounded-lg whitespace-nowrap border border-emerald-500/30 shadow-lg">
                        הועתק!
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Price */}
              <div className="mb-5">
                <div className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {listing.price === 0 ? 'חינם!' : `₪${listing.price.toLocaleString()}`}
                </div>
              </div>

              {/* Description */}
              <div className="mb-5 border-t border-slate-700 pt-5">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">תיאור</h3>
                <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">
                  {listing.description}
                </p>
              </div>

              {/* Meta */}
              <div className="flex gap-6 border-t border-slate-700 pt-4 text-sm text-gray-400">
                <div className="flex items-center gap-1.5">
                  <MapPin size={15} className="text-blue-400" />
                  <span>{listing.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye size={15} className="text-purple-400" />
                  <span>{listing.views?.toLocaleString()} צפיות</span>
                </div>
              </div>
            </div>

            {/* Price Analysis */}
            <PriceAnalysis
              title={listing.title}
              category={listing.categoryEn}
              price={listing.price}
              condition={listing.condition}
            />

            {/* Similar Listings */}
            {similarListings.length > 0 && (
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-1 h-5 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full" />
                  <h3 className="font-bold text-white">מודעות דומות</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {similarListings.map((l) => (
                    <ListingCard key={l.id} listing={l} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ===== SIDEBAR ===== */}
          <div className="space-y-4">

            {isOwner ? (
              /* ── OWNER VIEW — no AI chat, show deals panel ── */
              <>
                <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-4 flex items-center gap-3">
                  <span className="text-2xl">🏠</span>
                  <div>
                    <p className="font-bold text-white text-sm">זה המוצר שלך</p>
                    <p className="text-xs text-gray-400">ניהול ההצעות שקיבלת מהסוכן</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">הצעות ממתינות לאישורך</p>
                  </div>
                  <SellerDealsPanel listingId={listing.id} />
                </div>
              </>
            ) : (
              /* ── BUYER VIEW — seller locked, AI chat ── */
              <>
                {/* Seller Info — contact locked */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-lg shadow-black/20">
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">המוכר</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={listing.seller.image}
                      alt={listing.seller.name}
                      className="w-12 h-12 rounded-full ring-2 ring-blue-500/40"
                    />
                    <div>
                      <p className="font-bold text-white">{listing.seller.name}</p>
                      <p className="text-xs text-gray-400">✅ מוכר מאומת</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-700/60 border border-slate-600 rounded-xl px-4 py-3 text-sm text-gray-400">
                    <Lock size={15} className="text-amber-400 shrink-0" />
                    <span>פרטי ההתקשרות יוצגו לאחר אישור עסקה עם הסוכן</span>
                  </div>
                </div>

                {/* AI Chat — mediator */}
                <div>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <Briefcase size={14} className="text-purple-400" />
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">משא ומתן עם סוכן AI</p>
                  </div>
                  <AIChat
                    listingId={listing.id}
                    listingTitle={listing.title}
                    listingPrice={listing.price}
                    sellerContact={listing.seller}
                    sellerNotes={listing.sellerNotes || null}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
