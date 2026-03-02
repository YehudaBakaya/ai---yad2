import { v4 as uuidv4 } from 'uuid';

const categories = {
  'נדל"ן': 'real_estate',
  'רכבים': 'vehicles',
  'אלקטרוניקה': 'electronics',
  'ריהוט': 'furniture',
  'ביגוד': 'clothing',
  'ספורט': 'sports',
  'חיות מחמד': 'pets',
  'שירותים': 'services'
};

const listings = [
  {
    id: uuidv4(),
    title: 'דירת 3 חדרים בתל אביב, אזור מצוקה',
    category: 'נדל"ן',
    categoryEn: 'real_estate',
    description: 'דירה מהודרת ברחוב מרכזי בתל אביב. 3 חדרים, 2 חדרי שרות, מטבח מודרני, מרפסת רחבה. בנייה חדשה עם מעלית. קרוב לתחנת רכבת ובתחנת אוטובוס.',
    price: 3500000,
    location: 'תל אביב',
    condition: 'חדש',
    seller: {
      name: 'דוד כהן',
      phone: '050-1234567',
      image: 'https://i.pravatar.cc/150?img=1'
    },
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600',
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600'
    ],
    date: new Date('2026-02-28'),
    views: 1250,
    rating: 4.8
  },
  {
    id: uuidv4(),
    title: 'BMW 330i, 2020, שחור, במצב מעולה',
    category: 'רכבים',
    categoryEn: 'vehicles',
    description: 'BMW 330i שנת 2020, צבע שחור מטאלי, ריצה 45,000 ק"מ בלבד. מכונית פרטית מטופלת מאוד. מעלית חשמלית, גג פנורמי, סיסטם наві עדכני, קלימטרונית עם בקרה דו-אזורית.',
    price: 280000,
    location: 'חיפה',
    condition: 'מעולה',
    seller: {
      name: 'משה ליברמן',
      phone: '050-2345678',
      image: 'https://i.pravatar.cc/150?img=2'
    },
    images: [
      'https://images.unsplash.com/photo-1617469767537-b85cc00f20a5?w=600',
      'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=600'
    ],
    date: new Date('2026-02-27'),
    views: 3421,
    rating: 4.9
  },
  {
    id: uuidv4(),
    title: 'iPhone 15 Pro Max, טיטניום, 256GB',
    category: 'אלקטרוניקה',
    categoryEn: 'electronics',
    description: 'iPhone 15 Pro Max טיטניום, קיבולת 256GB. טלפון משומש בעדינות בלבד, ללא שריטות. עם תיבה מקורית וכל האביזרים. מוגן בביטוח AppleCare.',
    price: 5200,
    location: 'ירושלים',
    condition: 'מעולה',
    seller: {
      name: 'יניב שמעוני',
      phone: '050-3456789',
      image: 'https://i.pravatar.cc/150?img=3'
    },
    images: [
      'https://images.unsplash.com/photo-1592286927505-1fed0f168a02?w=600'
    ],
    date: new Date('2026-02-26'),
    views: 892,
    rating: 4.7
  },
  {
    id: uuidv4(),
    title: 'סט ספה ופוטול עור, קנדי',
    category: 'ריהוט',
    categoryEn: 'furniture',
    description: 'סט ספה ופוטול עור אמיתי בצבע חום עמוק. רהיטים מעולים, מעט שימוש בלבד. ממדים: ספה 2.5 מטר, פוטול רחב. משלוח זמין לאזור תל אביב.',
    price: 3500,
    location: 'תל אביב',
    condition: 'טוב',
    seller: {
      name: 'שרה לוי',
      phone: '050-4567890',
      image: 'https://i.pravatar.cc/150?img=4'
    },
    images: [
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600'
    ],
    date: new Date('2026-02-25'),
    views: 456,
    rating: 4.6
  },
  {
    id: uuidv4(),
    title: 'אופניים הרים Trek X-Caliber, 29 אינץ\'',
    category: 'ספורט',
    categoryEn: 'sports',
    description: 'אופניים הרים Trek X-Caliber 29 אינץ\', גידול Shimano 21 הילוכים, מהלך 100mm. רכיב עם סוסמן, מידה M. משומש בקפידה, בתנאי מעולה.',
    price: 2200,
    location: 'רחובות',
    condition: 'מעולה',
    seller: {
      name: 'אלי גרוס',
      phone: '050-5678901',
      image: 'https://i.pravatar.cc/150?img=5'
    },
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600'
    ],
    date: new Date('2026-02-24'),
    views: 678,
    rating: 4.8
  },
  {
    id: uuidv4(),
    title: 'מכונית כביסה LG, 9 ק"ג, אנרגיה חיסכון',
    category: 'אלקטרוניקה',
    categoryEn: 'electronics',
    description: 'מכונית כביסה LG דגם חדש, קיבולת 9 ק"ג, פונקציות חיסכון אנרגיה, עם תצוגה דיגיטלית. שימוש מינימלי, כמו חדשה.',
    price: 2800,
    location: 'פתח תקווה',
    condition: 'מעולה',
    seller: {
      name: 'רנה שטרן',
      phone: '050-6789012',
      image: 'https://i.pravatar.cc/150?img=6'
    },
    images: [
      'https://images.unsplash.com/photo-1517668808822-9ebb02ae2a0e?w=600'
    ],
    date: new Date('2026-02-23'),
    views: 234,
    rating: 4.5
  },
  {
    id: uuidv4(),
    title: 'עיצוב גרפי וקידום אתרים - בעלות 20 שנה ניסיון',
    category: 'שירותים',
    categoryEn: 'services',
    description: 'מעצב גרפי וקידום אתרים עם ניסיון של 20 שנה בתחום. מתמחה בעיצוב לוגו, חוברות, וקידום בגוגל. מחירים תחרותיים ועבודה איכותית.',
    price: 500,
    location: 'רמת גן',
    condition: 'זמין',
    seller: {
      name: 'אורן יצחקי',
      phone: '050-7890123',
      image: 'https://i.pravatar.cc/150?img=7'
    },
    images: [
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600'
    ],
    date: new Date('2026-02-22'),
    views: 125,
    rating: 4.9
  },
  {
    id: uuidv4(),
    title: 'חתול בן 1 שנה, בריא ותוקף',
    category: 'חיות מחמד',
    categoryEn: 'pets',
    description: 'חתול זכר בן 1 שנה, בריא מאוד, מחוסן וסטרילי. חיית בית חמודה ופעילה. מאד משחקנית אבל טיפה בעלת אופי חזק. דורשת בעל עם סבלנות.',
    price: 0,
    location: 'בנימינה',
    condition: 'בריא',
    seller: {
      name: 'תמי סגל',
      phone: '050-8901234',
      image: 'https://i.pravatar.cc/150?img=8'
    },
    images: [
      'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600'
    ],
    date: new Date('2026-02-21'),
    views: 542,
    rating: 4.7
  },
  {
    id: uuidv4(),
    title: 'דירה 2 חדרים בהרצליה, קרוב לים',
    category: 'נדל"ן',
    categoryEn: 'real_estate',
    description: 'דירה 2 חדרים בהרצליה פיתוח, קרוב מאוד לים וחנויות. דירה כזו רחוקה, עם מעלית. בשכונה יחסית שקטה אבל עם גישה קלה לרחוב הראשי.',
    price: 2500000,
    location: 'הרצליה',
    condition: 'טוב',
    seller: {
      name: 'מיכל רוקח',
      phone: '050-9012345',
      image: 'https://i.pravatar.cc/150?img=9'
    },
    images: [
      'https://images.unsplash.com/photo-1512917774080-9264f475a101?w=600'
    ],
    date: new Date('2026-02-20'),
    views: 1890,
    rating: 4.8
  },
  {
    id: uuidv4(),
    title: 'טיול צילום למצפה רמון - 5 ימים',
    category: 'שירותים',
    categoryEn: 'services',
    description: 'טיול צילום מוברח למצפה רמון ותל אביב בדרום. 5 ימים עם מדריך צילום מקצועי. כולל לינה, הובלה וארוחות. מקום מוגבל - רק 8 מקומות.',
    price: 2500,
    location: 'תל אביב',
    condition: 'זמין',
    seller: {
      name: 'דני ברק',
      phone: '050-0123456',
      image: 'https://i.pravatar.cc/150?img=10'
    },
    images: [
      'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=600'
    ],
    date: new Date('2026-02-19'),
    views: 789,
    rating: 4.9
  },
  {
    id: uuidv4(),
    title: 'מכונית קנבה Volkswagen Golf, 2018',
    category: 'רכבים',
    categoryEn: 'vehicles',
    description: 'VW Golf אדום משנת 2018, ריצה 98,000 ק"מ. מכונית קנבה מטוסטית וכוללת הפעלה. מצב טוב, דיסקים נחמדים, צמיגים כמעט חדשים.',
    price: 135000,
    location: 'אור יהודה',
    condition: 'טוב',
    seller: {
      name: 'יוסי כהן',
      phone: '050-1122334',
      image: 'https://i.pravatar.cc/150?img=11'
    },
    images: [
      'https://images.unsplash.com/photo-1550355291-bbee04a92027?w=600'
    ],
    date: new Date('2026-02-18'),
    views: 2145,
    rating: 4.6
  },
  {
    id: uuidv4(),
    title: 'MacBook Pro 16", M3 Pro, 512GB, Space Gray',
    category: 'אלקטרוניקה',
    categoryEn: 'electronics',
    description: 'MacBook Pro 16 אינץ\' עם M3 Pro, 512GB SSD, 18GB RAM. מכונה חדשה כמעט, שימוש קל בלבד. עם תיבה וכל האביזרים המקוריים.',
    price: 9800,
    location: 'תל אביב',
    condition: 'חדש',
    seller: {
      name: 'ניר גלבוע',
      phone: '050-2233445',
      image: 'https://i.pravatar.cc/150?img=12'
    },
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600'
    ],
    date: new Date('2026-02-17'),
    views: 1567,
    rating: 4.9
  },
  {
    id: uuidv4(),
    title: 'שולחן עבודה מעץ דוב, קצה מקוצץ, 140 ס"מ',
    category: 'ריהוט',
    categoryEn: 'furniture',
    description: 'שולחן עבודה עץ דוב טבעי, קצוות מקוצצים. ממדים: 140 ס"מ × 70 ס"מ. גובה 75 ס"מ. עם מהדק מעץ למחשב וציוד.',
    price: 1200,
    location: 'גבעתיים',
    condition: 'מעולה',
    seller: {
      name: 'אביב שלום',
      phone: '050-3344556',
      image: 'https://i.pravatar.cc/150?img=13'
    },
    images: [
      'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600'
    ],
    date: new Date('2026-02-16'),
    views: 345,
    rating: 4.7
  },
  {
    id: uuidv4(),
    title: 'ג\'קט עור שחור איטלקי, מידה L',
    category: 'ביגוד',
    categoryEn: 'clothing',
    description: 'ג\'קט עור שחור איטלקי, קרם, עם רירית פנימית. מידה L, משומש מעט בלבד. עור רך וחומרי עבודה איכותיים.',
    price: 450,
    location: 'בת ים',
    condition: 'מעולה',
    seller: {
      name: 'עידו לבנוני',
      phone: '050-4455667',
      image: 'https://i.pravatar.cc/150?img=14'
    },
    images: [
      'https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=600'
    ],
    date: new Date('2026-02-15'),
    views: 267,
    rating: 4.8
  },
  {
    id: uuidv4(),
    title: 'סט משקולות ודמבלים, 50 ק"ג',
    category: 'ספורט',
    categoryEน: 'sports',
    description: 'סט משקולות דמבלים וברים. כוללים משקולות מ 1 ק"ג עד 25 ק"ג. ברים מקוריים, מטבח פלדה. בתנאי מעולה.',
    price: 1800,
    location: 'נתניה',
    condition: 'מעולה',
    seller: {
      name: 'מימון דוד',
      phone: '050-5566778',
      image: 'https://i.pravatar.cc/150?img=15'
    },
    images: [
      'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600'
    ],
    date: new Date('2026-02-14'),
    views: 623,
    rating: 4.7
  },
  {
    id: uuidv4(),
    title: 'עד"ס "פנדה צנוע", גור בן 2 חודשים',
    category: 'חיות מחמד',
    categoryEn: 'pets',
    description: 'גור פנדה בן 2 חודשים בלבד, הזרקות מקדימות בוצעו. משומן ושמח. הורים זמינים לצפייה. יהיה כלב בגודל בינוני.',
    price: 3500,
    location: 'עכו',
    condition: 'בריא',
    seller: {
      name: 'אמנון לוביה',
      phone: '050-6677889',
      image: 'https://i.pravatar.cc/150?img=16'
    },
    images: [
      'https://images.unsplash.com/photo-1552053831-71594a27c62d?w=600'
    ],
    date: new Date('2026-02-13'),
    views: 1234,
    rating: 4.9
  },
  {
    id: uuidv4(),
    title: 'דירת פנטהאוס בתל אביב, 200 מ"ר',
    category: 'נדל"ן',
    categoryEn: 'real_estate',
    description: 'דירת פנטהאוס יוקרתית בתל אביב, 200 מ"ר, 4 חדרים. סוללון בשתי מרפסות, צמודה למעלית. אזור בוטיק בעלי מתחם הקנייה מודרני.',
    price: 6800000,
    location: 'תל אביב',
    condition: 'חדש',
    seller: {
      name: 'אבנר לנדמן',
      phone: '050-7788990',
      image: 'https://i.pravatar.cc/150?img=17'
    },
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600'
    ],
    date: new Date('2026-02-12'),
    views: 3456,
    rating: 5.0
  },
  {
    id: uuidv4(),
    title: 'טסלה Model 3, אדום, סופר מיניין ים',
    category: 'רכבים',
    categoryEn: 'vehicles',
    description: 'טסלה Model 3 אדום מטאלי, שנת 2021, ריצה 35,000 ק"מ בלבד. סופר מינייםים, עם הנסק אוטומטי וסיסטם ניווט מתקדם.',
    price: 185000,
    location: 'ראמת השרון',
    condition: 'מעולה',
    seller: {
      name: 'יורם סגל',
      phone: '050-8899001',
      image: 'https://i.pravatar.cc/150?img=18'
    },
    images: [
      'https://images.unsplash.com/photo-1560958089-b8a46dd52915?w=600'
    ],
    date: new Date('2026-02-11'),
    views: 2789,
    rating: 4.8
  },
  {
    id: uuidv4(),
    title: 'מקרן בתיים Epson EB-2250U, עם מסך',
    category: 'אלקטרוניקה',
    categoryEn: 'electronics',
    description: 'מקרן בתיים Epson 3LCD, 5000 לומנים, רזולוציה XGA. עם מסך הקרנה אלקטרוני. משומש בקפידה, בתנאי מעולה.',
    price: 3200,
    location: 'אפולוניה',
    condition: 'טוב',
    seller: {
      name: 'משה בן זקן',
      phone: '050-9900112',
      image: 'https://i.pravatar.cc/150?img=19'
    },
    images: [
      'https://images.unsplash.com/photo-1572365992253-3cb3e56dd362?w=600'
    ],
    date: new Date('2026-02-10'),
    views: 456,
    rating: 4.6
  },
  {
    id: uuidv4(),
    title: 'ארון ביגוד ממלט לבן, דלתות הזזה',
    category: 'ריהוט',
    categoryEn: 'furniture',
    description: 'ארון ביגוד לבן עם דלתות הזזה, גדול ומרווח. ממדים: 200 × 240 × 60 ס"מ. משומש במצב מעולה, אין שריטות.',
    price: 1400,
    location: 'פתח תקווה',
    condition: 'מעולה',
    seller: {
      name: 'סוזי סימן טוב',
      phone: '050-0011223',
      image: 'https://i.pravatar.cc/150?img=20'
    },
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600'
    ],
    date: new Date('2026-02-09'),
    views: 389,
    rating: 4.7
  }
];

export { listings, categories };
