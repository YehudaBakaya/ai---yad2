# 🚀 מדריך הפעלה מהיר - יד2 AI

## דרישות מוקדמות
- Node.js 16+ ([הורד כאן](https://nodejs.org/))
- npm (משלוח עם Node.js)

## צעד 1: הפעלת Backend

```bash
# עבור לתיקיית backend
cd backend

# התקנת דיפנדנסיס
npm install

# הפעלת שרת
npm run dev
```

תראה הודעה כזו:
```
🚀 Server running on http://localhost:3001
📝 API: http://localhost:3001/api/listings
🤖 AI: http://localhost:3001/api/ai
```

## צעד 2: הפעלת Frontend (בטאב/חלון נפרד)

```bash
# עבור לתיקיית frontend
cd frontend

# התקנת דיפנדנסיס
npm install

# הפעלת dev server
npm run dev
```

תראה הודעה כזו:
```
➜  Local:   http://localhost:5173/
```

## צעד 3: פתיחה בדפדפן

פתח את http://localhost:5173 בדפדפנך

## ✅ בדיקה שהכל עובד

### בדיקת Backend
```bash
curl http://localhost:3001/api/health
```

צפוי: `{"status":"ok","timestamp":"2026-03-02T..."}`

### בדיקת Listings
```bash
curl http://localhost:3001/api/listings | head -c 200
```

צפוי: JSON עם מודעות

## 🎯 זרימות שימוש

### 1. צפיה בדף הבית
- לחץ על "יד2 AI" בתפריט
- תראה קטגוריות ומודעות מוצעות

### 2. חיפוש מודעות
- לחץ על "מודעות" בתפריט
- השתמש בסרגל החיפוש
- התאם את הסננים בצד שמאל

### 3. צפיה בפרטי מודעה
- לחץ על כרטיסיית מודעה
- תראה תמונות בגודל גדול
- **AI Negotiation Chat** - הפיצ'ר הכוכב!
  - בחר "קונה" או "מוכר"
  - דבר עם AI
  - AI משא ומתן על המחיר

### 4. ניתוח מחיר
- בדף המודעה, גלול למטה
- תראה widget "ניתוח מחיר בשוק"
- AI אומר אם המחיר הוגן

### 5. יצירת מודעה חדשה
- לחץ על "פרסם מודעה" בתפריט
- מלא כותרה, קטגוריה, מחיר
- **AI Description Generator** - יצור תיאור אוטומטי!
  - לחץ על כפתור "יצרן תיאור עם AI"
  - בחר תנאי וכתוב פרטים
  - AI כותב תיאור משכנע

## 🎮 דוגמאות ל-Test

### דוגמה 1: משא ומתן כקונה
1. עבור למודעה כל שהיא
2. בחר "קונה" בסרגל הצד
3. כתוב: "שלום, האם אתה פתוח להצעה?"
4. AI יציע הנמכה של כ-15% מהמחיר
5. המשך להתווכח - AI יוריד עוד

### דוגמה 2: משא ומתן כמוכר
1. בחר אותה מודעה
2. בחר "מוכר" בסרגל הצד
3. כתוב: "מה המחיר המקסימלי שלך?"
4. AI יגן על המחיר
5. AI יוריד רק קצת אם בכלל

### דוגמה 3: ניתוח מחיר
1. עבור למודעה
2. גלול למטה לסקשן "ניתוח מחיר בשוק"
3. תראה:
   - טווח מחירים בשוק (min/avg/max)
   - AI verdict: "עסקה טובה" / "מחיר הוגן" / "יקר מדי"
   - המלצה: הגדל / הנמך / שמור

### דוגמה 4: AI Description Generator
1. לחץ "פרסם מודעה"
2. מלא כותרה (לדוגמה: "MacBook Pro 2023")
3. בחר קטגוריה (אלקטרוניקה)
4. לחץ "יצרן תיאור עם AI"
5. בחר "מעולה" כמצב
6. לחץ "יצור תיאור"
7. AI כותב תיאור מקצועי!
8. לחץ "העתק וסגור"

## 🔌 API Endpoints (לבדיקה ידנית)

### Get All Listings
```bash
curl "http://localhost:3001/api/listings"
```

### Get Listings by Category
```bash
curl "http://localhost:3001/api/listings?category=real_estate"
```

### Search Listings
```bash
curl "http://localhost:3001/api/listings?search=דירה"
```

### Filter by Price
```bash
curl "http://localhost:3001/api/listings?minPrice=1000000&maxPrice=3000000"
```

### Get Single Listing
```bash
curl "http://localhost:3001/api/listings/{id}"
```

### AI Negotiation
```bash
curl -X POST http://localhost:3001/api/ai/negotiate \
  -H "Content-Type: application/json" \
  -d '{
    "message": "שלום, האם אתה פתוח להצעה?",
    "listingPrice": 5000,
    "history": [],
    "role": "buyer"
  }'
```

### AI Description
```bash
curl -X POST http://localhost:3001/api/ai/generate-description \
  -H "Content-Type: application/json" \
  -d '{
    "title": "iPhone 15",
    "category": "electronics",
    "condition": "מעולה",
    "price": 5000
  }'
```

### AI Price Analysis
```bash
curl -X POST http://localhost:3001/api/ai/analyze-price \
  -H "Content-Type: application/json" \
  -d '{
    "title": "iPhone 15",
    "category": "electronics",
    "price": 5000,
    "condition": "מעולה"
  }'
```

## 🧹 ניקוי

### הפסקת Services
- Backend: לחץ `Ctrl+C` בטרמינל
- Frontend: לחץ `Ctrl+C` בטרמינל

### מחיקת Node Modules (אם צריך להתקין מחדש)
```bash
cd backend && rm -rf node_modules && npm install
cd ../frontend && rm -rf node_modules && npm install
```

## 🆘 Troubleshooting

### Backend לא עולה
```
Error: EADDRINUSE: address already in use :::3001
```
**פתרון**: יש תהליך אחר על פורט 3001
```bash
# Linux/Mac
lsof -i :3001
kill -9 <PID>

# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Frontend לא עולה
```
Error: EADDRINUSE: address already in use :::5173
```
**פתרון**: דומה לעיל, אך עם פורט 5173

### API לא משיב
- בדוק ש-Backend עובד ב-http://localhost:3001/api/health
- בדוק ש-Frontend מחובר (בדוק Network tab בdev tools)

### תמונות לא נטענות
- כל המודעות משתמשות בתמונות placeholder מ-unsplash
- בשימוש בייצור, העלה תמונות לשרת בפועל

## 🚀 עצות למתחילים

1. **Inspect Elements**: לחץ F12 בדפדפן לראות את ה-Console ו-Network
2. **API Testing**: השתמש ב-curl או Postman לבדיקת endpoints
3. **Code Structure**: כל הקוד בעברית/קריא וקל להבנה
4. **Mock Data**: כל התגובות של AI הן mock - אתה יכול להחליף ל-GPT-4 אמיתי

## 📚 קריאה נוסף

- [React Documentation](https://react.dev)
- [Express Docs](https://expressjs.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite Guide](https://vitejs.dev/)

---

אם יש שאלות, בדוק את README.md או עיין בקוד - הוא מלא בקומנטים!
