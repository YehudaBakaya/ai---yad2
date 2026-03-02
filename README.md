# יד2 AI - פלטפורמת מודעות חכמה עם בינה מלאכותית

פלטפורמה חדישה לקנייה ומכירה בישראל עם AI מודרני המעזר במשא ומתן, יצירת תיאורים וניתוח מחירים.

## 🌟 תכונות עיקריות

### AI Features
1. **💬 משא ומתן עם AI** - AI משא ומתן בזמן אמת שמעזר לקונים ומוכרים
2. **✨ יצרן תיאור חכם** - יצירה אוטומטית של תיאורים משכנעים
3. **📊 ניתוח מחיר בשוק** - בדיקה אם המחיר הוגן בהשוואה לשוק
4. **🎯 המלצות קנייה** - AI מציע מודעות רלוונטיות

### Platform Features
- **8 קטגוריות** - נדל"ן, רכבים, אלקטרוניקה, ריהוט, ביגוד, ספורט, חיות מחמד, שירותים
- **סינון מתקדם** - לפי קטגוריה, מחיר, מיקום, מצב
- **עיצוב Dark Modern** - ממשק מודרני וידידותי עם Tailwind CSS
- **RTL Layout** - תמיכה מלאה בעברית
- **20+ מודעות דמו** - מודעות דמו מגוונות לבדיקה

## 🛠️ Stack טכנולוגי

### Frontend
- **React 18** + **Vite** - בנייה מהירה ופיתוח מהיר
- **Tailwind CSS** - עיצוב מודרני
- **React Router** - ניווט בין עמודים
- **Axios** - בקשות HTTP
- **Lucide React** - אייקונים יפים

### Backend
- **Node.js** + **Express** - שרת מהיר וקל
- **CORS** - תמיכה בבקשות חוצות דומיינים
- **UUID** - יצירת מזהים ייחודיים
- **Dotenv** - ניהול משתנים סביבה

### AI (Mock + Real OpenAI)
- **GPT-4o-mini** - תמיכה אופציונלית (ברירת מחדל: mock responses)

## 📋 דרישות

- Node.js 16+
- npm או yarn

## 🚀 התקנה והפעלה

### 1. Clone והתקנה
```bash
cd /sessions/eloquent-keen-dijkstra/yad2-ai

# Backend
cd backend
npm install

# Frontend (בטאב נפרד)
cd ../frontend
npm install
```

### 2. הפעלת Backend
```bash
cd backend
npm run dev
# או
npm start
```

השרת יפעל על http://localhost:3001

### 3. הפעלת Frontend
```bash
cd frontend
npm run dev
```

הצפייה תהיה ב http://localhost:5173

## 📝 דוקומנטציה ה-API

### Listings API
```
GET /api/listings - קבל את כל המודעות (עם סינון)
  ?search=...      - חיפוש בכותרה ותיאור
  ?category=...    - סינון לפי קטגוריה
  ?minPrice=...    - מחיר מינימלי
  ?maxPrice=...    - מחיר מקסימלי
  ?location=...    - מיקום
  ?condition=...   - מצב הפריט

GET /api/listings/:id - קבל מודעה בודדת

POST /api/listings - יצירת מודעה חדשה
  {
    title: string,
    category: string,
    price: number,
    location: string,
    condition: string,
    description: string,
    images: string[]
  }

GET /api/listings/categories/all - קבל כל קטגוריות עם מספר מודעות
```

### AI API
```
POST /api/ai/negotiate - משא ומתן עם AI
  {
    message: string,
    listingPrice: number,
    history: array,
    role: 'buyer' | 'seller'
  }

POST /api/ai/generate-description - יצור תיאור
  {
    title: string,
    category: string,
    condition: string,
    price: number,
    details?: string
  }

POST /api/ai/analyze-price - ניתוח מחיר
  {
    title: string,
    category: string,
    price: number,
    condition: string
  }

POST /api/ai/recommendations - המלצות
  {
    listingId: string,
    userPreferences?: object,
    listingCategory: string
  }
```

## 🤖 שימוש ב-OpenAI אמיתי

כדי להשתמש ב-OpenAI אמיתי במקום Mock responses:

1. קבל API Key מ- https://platform.openai.com/api-keys
2. עדכן את `/backend/.env`:
```env
OPENAI_API_KEY=sk-your-actual-key-here
```
3. הקוד יגלה שיש מפתח תקף וישתמש ב-GPT-4o-mini בפועל

## 📁 מבנה הפרוייקט

```
yad2-ai/
├── backend/
│   ├── data/
│   │   └── listings.js         # Mock listings (20+)
│   ├── routes/
│   │   ├── listings.js         # Listings endpoints
│   │   └── ai.js               # AI endpoints
│   ├── server.js               # Express server
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ListingCard.jsx
│   │   │   ├── AIChat.jsx
│   │   │   ├── PriceAnalysis.jsx
│   │   │   └── SmartDescription.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Listings.jsx
│   │   │   ├── ListingDetail.jsx
│   │   │   └── CreateListing.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
├── .gitignore
└── README.md
```

## 🎨 עיצוב

- **Color Scheme**: צבעים כהים עם Slate וBlue כצבעים ראשיים
- **Typography**: Segoe UI, ערבית תומכת
- **Responsive**: מעוצב למכשיר נייד, טאבלט ודסקטופ
- **RTL**: תמיכה מלאה בעברית וערבית

## 🔐 הערות אבטחה

- זה פרוייקט דמו - אל תשתמש עם נתונים אמיתיים בייצור
- סיסמאות והתקנות לא מיושמות
- יש להוסיף אימות ושיפור אבטחה לשימוש בייצור

## 📄 רישיון

MIT License

## 👨‍💻 פיתוח נוסף

רעיונות לשיפור:
- [ ] התחברות וחשבון משתמש
- [ ] התמונות בשרת בפועל
- [ ] מערכת דירוגים ומשוב
- [ ] קובץ מוקד ואנימציות
- [ ] בדיקות אוטומטיות
- [ ] וריסיה מיידית של מודעות
- [ ] אנליטיקה ודשבורד למוכר

## 📧 תמיכה

לשאלות או בעיות, אנא צור ברקע.

---

עשוי עם ❤️ ו-AI
