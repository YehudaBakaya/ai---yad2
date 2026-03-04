import mongoose from 'mongoose';

/**
 * Listing Model
 * כשמחברים MongoDB — המודעות יישמרו כאן במקום ב-data/listings.js
 */
const listingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
  },
  categoryEn: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  location: {
    type: String,
    default: '',
  },
  condition: {
    type: String,
    enum: ['חדש', 'מעולה', 'טוב', 'סביר', 'דורש תיקון', 'זמין', 'בריא'],
    default: 'טוב',
  },
  images: {
    type: [String],
    default: [],
  },

  // בעלות — ref ל-User כשמונגו מחובר
  seller: {
    // כשעובדים עם MongoDB:
    // userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name:   { type: String, default: 'אנונימי' },
    phone:  { type: String, default: '' },
    image:  { type: String, default: '' },
    email:  { type: String, default: '' },
  },

  sellerNotes: { type: mongoose.Schema.Types.Mixed, default: null },
  views:  { type: Number, default: 0 },
  rating: { type: Number, default: null, min: 0, max: 5 },
  userId:   { type: String, default: null },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

// Full-text search index
listingSchema.index({ title: 'text', description: 'text' });
listingSchema.index({ category: 1 });
listingSchema.index({ price: 1 });
listingSchema.index({ createdAt: -1 });

export default mongoose.model('Listing', listingSchema);
