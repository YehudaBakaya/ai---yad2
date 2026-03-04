/**
 * MongoDB Seed Script — מודעות לדוגמה
 * הרץ פעם אחת: node backend/seed.js
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Listing from './models/Listing.js';

dotenv.config();

const DEMO_LISTINGS = [
  {
    title: 'iPhone 15 Pro Max 256GB כחול טיטניום',
    category: 'אלקטרוניקה', categoryEn: 'electronics',
    price: 3800, location: 'תל אביב', condition: 'מעולה',
    description: 'אייפון 15 פרו מקס במצב מעולה, עם כל האביזרים המקוריים.',
    images: ['https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600'],
    seller: { name: 'דוד כהן', phone: '052-1234567', email: 'david@example.com' },
    views: 312, rating: 4.8,
  },
  {
    title: 'מאזדה CX-5 2021 אוטומטית',
    category: 'רכבים', categoryEn: 'vehicles',
    price: 115000, location: 'ירושלים', condition: 'טוב',
    description: 'מאזדה CX-5 שנת 2021, אוטומטית, פנורמה, מצב מצוין.',
    images: ['https://images.unsplash.com/photo-1617531653332-bd46c16f7d61?w=600'],
    seller: { name: 'שרה לוי', phone: '054-9876543', email: 'sara@example.com' },
    views: 487, rating: 4.6,
  },
  {
    title: 'ספת פינה L צורה אפורה',
    category: 'ריהוט', categoryEn: 'furniture',
    price: 2800, location: 'חיפה', condition: 'טוב',
    description: 'ספת פינה מעוצבת, אפורה, מתאימה לסלון גדול.',
    images: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600'],
    seller: { name: 'רחל אברהם', phone: '050-5551234', email: 'rachel@example.com' },
    views: 203, rating: 4.4,
  },
  {
    title: 'MacBook Pro M3 14 אינץ 512GB',
    category: 'אלקטרוניקה', categoryEn: 'electronics',
    price: 7200, location: 'רמת גן', condition: 'חדש',
    description: 'מקבוק פרו M3 חדש לגמרי, בקופסה המקורית.',
    images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600'],
    seller: { name: 'יוסי מזרחי', phone: '053-7778888', email: 'yossi@example.com' },
    views: 541, rating: 4.9,
  },
  {
    title: 'אופניים חשמליים Scooti 48V',
    category: 'ספורט', categoryEn: 'sports',
    price: 3500, location: 'פתח תקווה', condition: 'טוב',
    description: 'אופניים חשמליים עם סוללה חזקה 48V, טווח 60 ק"מ.',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600'],
    seller: { name: 'אבי גל', phone: '058-2223333', email: 'avi@example.com' },
    views: 178, rating: 4.5,
  },
  {
    title: 'דירת 3 חדרים בתל אביב — מגדלי הים',
    category: 'נדל"ן', categoryEn: 'real_estate',
    price: 2850000, location: 'תל אביב', condition: 'מעולה',
    description: 'דירת 3 חדרים בקומה 18, נוף לים, מרפסת גדולה.',
    images: ['https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=600'],
    seller: { name: 'נדל"ן פרמיום', phone: '03-1234567', email: 'realty@example.com' },
    views: 892, rating: 4.7,
  },
  {
    title: 'סמסונג גלקסי S24 Ultra 256GB שחור',
    category: 'אלקטרוניקה', categoryEn: 'electronics',
    price: 3200, location: 'באר שבע', condition: 'מעולה',
    description: 'גלקסי S24 אולטרה עם עט S-Pen, מצב מושלם.',
    images: ['https://images.unsplash.com/photo-1610945264803-c22b62d2a7b3?w=600'],
    seller: { name: 'מיכל ברק', phone: '055-4445566', email: 'michal@example.com' },
    views: 265, rating: 4.6,
  },
  {
    title: 'שולחן עבודה עץ אגוז מלא 180 ס"מ',
    category: 'ריהוט', categoryEn: 'furniture',
    price: 1800, location: 'רחובות', condition: 'טוב',
    description: 'שולחן עבודה מעץ מלא איכותי, עם מגירות.',
    images: ['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600'],
    seller: { name: 'גיל אמיר', phone: '052-8889900', email: 'gil@example.com' },
    views: 134, rating: 4.3,
  },
  {
    title: 'כלב גולדן רטריבר בן 2 — מחפש בית',
    category: 'חיות מחמד', categoryEn: 'pets',
    price: 0, location: 'נתניה', condition: 'בריא',
    description: 'גולדן ידידותי, מחוסן ומסורס. מחפש בית אוהב.',
    images: ['https://images.unsplash.com/photo-1552053831-71594a27632d?w=600'],
    seller: { name: 'נועה שפירא', phone: '054-1112233', email: 'noa@example.com' },
    views: 623, rating: 5.0,
  },
  {
    title: 'תיקון מחשבים ו-IT — שירות ביתי',
    category: 'שירותים', categoryEn: 'services',
    price: 150, location: 'תל אביב', condition: 'זמין',
    description: 'תיקון מחשבים, ניקוי וירוסים, התקנת מערכות. שירות מהיר.',
    images: ['https://images.unsplash.com/photo-1518770660439-4636190af475?w=600'],
    seller: { name: 'טק גיא', phone: '050-9998877', email: 'tech@example.com' },
    views: 412, rating: 4.8,
  },
  {
    title: 'חולצות Tommy Hilfiger מידה L — 5 יח\'',
    category: 'ביגוד', categoryEn: 'clothing',
    price: 350, location: 'הרצליה', condition: 'מעולה',
    description: '5 חולצות מעולות, נקיות וממורקות.',
    images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600'],
    seller: { name: 'ליאור כץ', phone: '053-6667788', email: 'lior@example.com' },
    views: 89, rating: 4.2,
  },
  {
    title: 'Honda Civic 2019 — 60,000 ק"מ',
    category: 'רכבים', categoryEn: 'vehicles',
    price: 78000, location: 'חולון', condition: 'מעולה',
    description: 'הונדה סיוויק שנת 2019, יד ראשונה, מלא אביזרים.',
    images: ['https://images.unsplash.com/photo-1590362891991-f776e747a588?w=600'],
    seller: { name: 'עמית גולן', phone: '058-5556677', email: 'amit@example.com' },
    views: 734, rating: 4.7,
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI לא מוגדר ב-.env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅ מחובר ל-MongoDB');

  const existing = await Listing.countDocuments();
  if (existing > 0) {
    console.log(`⚠️  כבר יש ${existing} מודעות — לא מוסיף שוב`);
    console.log('   כדי לאפס: db.listings.drop() ב-MongoDB Shell');
    await mongoose.disconnect();
    return;
  }

  await Listing.insertMany(DEMO_LISTINGS);
  console.log(`✅ נוספו ${DEMO_LISTINGS.length} מודעות לדוגמה`);
  await mongoose.disconnect();
}

seed().catch(console.error);
