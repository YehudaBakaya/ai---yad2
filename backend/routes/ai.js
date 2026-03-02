import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Check if real OpenAI API key is provided
const hasRealAPI = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-api-key-here';

// ── helpers ──────────────────────────────────────────────────────────────────

const ACCEPT_WORDS = ['מסכים', 'מקובל', 'בסדר גמור', 'לקחתי', 'קנוי', 'deal', 'סגור', 'מוכן לסגור', 'נסגר', 'אני לוקח', 'אני קונה', 'עסקה'];
const REJECT_WORDS = ['לא מסכים', 'לא מקובל', 'יקר מדי', 'לא שווה', 'לא', 'נו באמת', 'בוא נדבר'];

const detectAcceptance = (msg) => ACCEPT_WORDS.some(w => msg.includes(w));
const detectRejection  = (msg) => REJECT_WORDS.some(w => msg.includes(w));

// extract number from message (e.g. "אני מציע 5000")
const extractAmount = (msg) => {
  const m = msg.replace(/,/g, '').match(/\d{2,7}/);
  return m ? parseInt(m[0], 10) : null;
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ── buyer scripts ─────────────────────────────────────────────────────────────

const buyerOpeners = (lp) => [
  `שלום! אני מעוניין ברכישה. המחיר המבוקש ₪${lp.toLocaleString()} קצת גבוה — אני מציע ₪${Math.round(lp*0.85).toLocaleString()}. מה דעתך?`,
  `היי! ראיתי את המודעה וזה מעניין אותי. יש לי תקציב של ₪${Math.round(lp*0.85).toLocaleString()} — האם אפשר לדבר?`,
  `שלום, אני קונה רציני. ₪${Math.round(lp*0.87).toLocaleString()} ומגיע להיום — עסקה?`,
];
const buyerMid = (lp, round) => {
  const offer = Math.round(lp * (0.82 - round * 0.02));
  return {
    msgs: [
      `ראיתי מודעות דומות ב-₪${Math.round(lp*0.75).toLocaleString()}–₪${Math.round(lp*0.82).toLocaleString()}. אני מציע ₪${offer.toLocaleString()} — הוגן לשני הצדדים.`,
      `אני מעריך, אבל ₪${offer.toLocaleString()} זה המקסימום שלי כרגע. אפשר?`,
      `בשוק כיום זה שווה ₪${offer.toLocaleString()} לכל היותר. מה אתה אומר?`,
    ],
    offer,
  };
};
const buyerFinal = (lp) => {
  const offer = Math.round(lp * 0.78);
  return {
    msgs: [
      `בסדר, הצעה סופית: ₪${offer.toLocaleString()} ומגיע עם מזומן היום. זה הטוב ביותר שלי.`,
      `אני עושה לך הצעה שלא תוכל לסרב לה: ₪${offer.toLocaleString()} — סוגרים?`,
    ],
    offer,
  };
};

// ── seller scripts ────────────────────────────────────────────────────────────

const sellerOpeners = (lp) => [
  `תודה על ההתעניינות! המוצר במצב מעולה עם ביקוש גבוה. ₪${lp.toLocaleString()} זה המחיר, אך אם אתה קונה היום — אוכל לרדת ₪${Math.round(lp*0.03).toLocaleString()}.`,
  `שלום! שמח שהתעניינת. המחיר שלי ₪${lp.toLocaleString()} ומוצדק לחלוטין. תגיד לי מה בראשך.`,
];
const sellerMid = (lp, round) => {
  const deduct = 500 + round * 300;
  const offer  = lp - deduct;
  return {
    msgs: [
      `אני מעריך את ההצעה, אבל השקעתי בבדיקה וטיפול. ₪${offer.toLocaleString()} — ולא פחות.`,
      `הפריט שווה כל שקל. ₪${offer.toLocaleString()} זה ההנחה המקסימלית שלי בשלב זה.`,
      `בסדר, אני גמיש קצת: ₪${offer.toLocaleString()}. אבל זה קרוב לתחתית.`,
    ],
    offer,
  };
};
const sellerFinal = (lp) => {
  const offer = lp - 1500;
  return {
    msgs: [
      `הצעה אחרונה: ₪${offer.toLocaleString()}. אם לא — אני ממשיך למציעים אחרים שכבר שאלו.`,
      `₪${offer.toLocaleString()} — זה הסוף. לא ירד עוד.`,
    ],
    offer,
  };
};

// ── main mock ─────────────────────────────────────────────────────────────────

const getAIMockResponse = (message, role, listingPrice, history) => {
  const msg   = message.trim();
  const round = Math.floor((history?.length || 0) / 2);

  // ── deal accepted?
  if (detectAcceptance(msg)) {
    const lastOffer = (() => {
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].offer) return history[i].offer;
      }
      return listingPrice;
    })();
    return {
      message: role === 'buyer'
        ? `🎉 מצוין! הגענו להסכמה על ₪${lastOffer.toLocaleString()}. נשמח לסגור — תיצור קשר עם המוכר לתיאום.`
        : `🎉 נפלא! עסקה ב-₪${lastOffer.toLocaleString()}. תיאום מועד מסירה — דברו ישירות עם הקונה.`,
      currentOffer: lastOffer,
      confidence: 1,
      dealReached: true,
      suggestedReplies: [],
    };
  }

  // ── user gave a counter number?
  const userAmount = extractAmount(msg);

  if (role === 'buyer') {
    if (round === 0) {
      const offer = Math.round(listingPrice * 0.85);
      return {
        message: pick(buyerOpeners(listingPrice)),
        currentOffer: offer,
        confidence: 0.70,
        suggestedReplies: ['מה הכי נמוך שתוכל?', 'אני מציע מחיר נמוך יותר', 'מסכים למחיר הזה'],
      };
    }
    if (round < 3) {
      const { msgs, offer } = buyerMid(listingPrice, round);
      return {
        message: pick(msgs),
        currentOffer: userAmount && userAmount < listingPrice ? Math.round((userAmount + offer) / 2) : offer,
        confidence: 0.75,
        suggestedReplies: ['בסדר, מסכים', 'עוד קצת הנחה?', 'נפגש באמצע'],
      };
    }
    const { msgs, offer } = buyerFinal(listingPrice);
    return {
      message: pick(msgs),
      currentOffer: offer,
      confidence: 0.85,
      suggestedReplies: ['מסכים! סוגרים', 'לא יכול ללכת נמוך יותר?', 'אצטרך לחשוב'],
    };
  }

  // seller
  if (round === 0) {
    const offer = Math.round(listingPrice * 0.97);
    return {
      message: pick(sellerOpeners(listingPrice)),
      currentOffer: offer,
      confidence: 0.85,
      suggestedReplies: ['מה ההצעה שלך?', 'המחיר סופי', 'יש גמישות?'],
    };
  }
  if (round < 3) {
    const { msgs, offer } = sellerMid(listingPrice, round);
    return {
      message: pick(msgs),
      currentOffer: userAmount && userAmount > listingPrice * 0.6 ? Math.round((userAmount + offer) / 2) : offer,
      confidence: 0.80,
      suggestedReplies: ['מקובל עלי', 'עוד קצת?', 'בוא נפגש באמצע'],
    };
  }
  const { msgs, offer } = sellerFinal(listingPrice);
  return {
    message: pick(msgs),
    currentOffer: offer,
    confidence: 0.90,
    suggestedReplies: ['מקובל! סוגרים', 'צריך לחשוב', 'לא מתאים לי'],
  };
};

// AI Negotiation endpoint
router.post('/negotiate', async (req, res) => {
  try {
    const { message, listingId, listingPrice, history = [], role = 'buyer' } = req.body;

    if (!message || !listingPrice) {
      return res.status(400).json({ error: 'נתונים חסרים' });
    }

    const response = getAIMockResponse(message, role, listingPrice, history);
    
    res.json({
      message: response.message,
      currentOffer: response.currentOffer,
      confidence: response.confidence,
      dealReached: response.dealReached || false,
      suggestedReplies: response.suggestedReplies || [],
      timestamp: new Date(),
      role
    });
  } catch (error) {
    console.error('Negotiation error:', error);
    res.status(500).json({ error: 'שגיאה בעיבוד ההצעה' });
  }
});

// AI Description Generator
router.post('/generate-description', async (req, res) => {
  try {
    const { title, category, condition, price, details = '' } = req.body;

    if (!title || !category) {
      return res.status(400).json({ error: 'כותרת וקטגוריה נדרשים' });
    }

    // Mock smart descriptions based on category
    let description = '';

    if (category === 'real_estate') {
      description = `דירה מודרנית וממוקמת בצורה מושלמת! ${title}. 
      
המיקום: נמצא בשכונה שקטה עם גישה קלה לתחנות תחבורה, בתי קפה ודוכנים. קרוב למתחם קנייה מודרני.

המאפיינים:
• תנאי מעולה - קומה גבוהה עם הרבה אור
• עם מעלית וחניה
• מטבח מודרני וחדרי שרות רחבים
• מרפסת גדולה להנאה בחוץ
• בניין בטוח עם שומר

האם זו הדירה שחיפשת? לא תמצא טוב יותר בתחום המחירים!`;
    } else if (category === 'vehicles') {
      description = `${title} - כלי רכב משוכלל וטופל בעדינות!

מצב המכונית:
• קילומטראז' נמוך ביותר
• מעלית חשמלית, חימום מושבים
• סיסטם ניווט מתקדם וקירור אוטומטי
• צמיגים חדשים, בדיקות כל בטוח
• אין תאונות או שינויים בתוך

מדוע בחרתי בה?
• חוסכת דלק / אנרגיה
• אמינות מוכחת מהיצרן
• עם כל התיעוד המקורי

כל הנכסים בדקו בגורם בלתי תלוי. מומלץ לקנות בביטחון!`;
    } else if (category === 'electronics') {
      description = `${title} - טכנולוגיה עדכנית בתוך הקופה שלך!

מפרטים טכניים:
• מצב חדש/משמור מאוד - בתוך תיבה מקורית
• כל האביזרים המקוריים כלולים
• חוברות ודוקומנטציה מלאה
• אחריות אם יש

למה זו קנייה חכמה:
• ייצור של מקום טוב, איכות מובטחת
• ניתן לשדרג או להחליף חלקים בקלות
• מחיר טוב יותר מחנות רשמית
• משוחח עם מכשירים קיימים שלך

זה משהו שתשתמש בו כל יום - כדאי לקנות איכות!`;
    } else if (category === 'furniture') {
      description = `${title} - רהיטים יפים שישדרגו את בית שלך!

אודות הרהיט:
• עיצוב מודרני וקלאסי - מתאים לכל בית
• חומרים איכותיים - עמיד לאורך זמן
• במצב מעולה עם ניקוי עדין בלבד
• ממדים אופטימליים - משתלב בכל חלל

למה כדאי לך:
• לא צריך לעבור רהיטים כבדים מחנות
• מחיר הוגן - חוסך לך אלפים
• אתה מחזיר שימוש ותוקף רהיט איכותי
• אפשר להביא היום אם צריך

אם אתה מתחדש בבית, זו הזדמנות מעולה!`;
    } else {
      description = `${title} - מחיר מדהים לעבור טוב!

מה אתה מקבל:
• מוצר בתנאי מעולה
• מתברר שהכל תקין ופועל
• מכירה מהירה וישרה

למה אתה צריך זה:
• הנמכה משמעותית מהחנות
• איכות מוכחת
• סוג טוב של ממליץ - סך הכל מוגדל

כמו שאומרים, לא תמצא טוב יותר במחיר הזה. בואו נרכוש!`;
    }

    res.json({
      description,
      tokens_used: Math.floor(Math.random() * 150) + 100,
      model: 'gpt-4o-mini'
    });
  } catch (error) {
    console.error('Description generation error:', error);
    res.status(500).json({ error: 'שגיאה בייצור התיאור' });
  }
});

// AI Price Analysis
router.post('/analyze-price', async (req, res) => {
  try {
    const { title, category, price, condition } = req.body;

    if (!title || !price || !category) {
      return res.status(400).json({ error: 'נתונים חסרים' });
    }

    // Mock market analysis
    const marketData = {
      real_estate: { min: 0.75, avg: 1.0, max: 1.4 },
      vehicles: { min: 0.7, avg: 1.0, max: 1.3 },
      electronics: { min: 0.6, avg: 1.0, max: 1.2 },
      furniture: { min: 0.5, avg: 1.0, max: 1.3 },
      default: { min: 0.65, avg: 1.0, max: 1.2 }
    };

    const market = marketData[category] || marketData.default;
    const conditionMultiplier = condition === 'חדש' ? 1.1 : condition === 'מעולה' ? 1.0 : 0.85;
    
    const minPrice = Math.round(price * market.min * conditionMultiplier);
    const avgPrice = Math.round(price * market.avg * conditionMultiplier);
    const maxPrice = Math.round(price * market.max * conditionMultiplier);

    // Determine verdict
    let verdict = 'מחיר הוגן';
    let verdict_en = 'fair';
    let explanation = `המחיר שלך בטווח הנורמלי לפריט זה בשוק.`;
    let color = 'emerald';

    if (price > maxPrice * 0.95) {
      verdict = 'יקר מדי';
      verdict_en = 'expensive';
      explanation = `המחיר גבוה מהממוצע בשוק. שקול הנמכה ל-₪${avgPrice.toLocaleString()} להמכרה מהירה.`;
      color = 'red';
    } else if (price > avgPrice * 1.15) {
      verdict = 'קצת יקר';
      verdict_en = 'slightly_expensive';
      explanation = `המחיר קצת מעל הממוצע. אתה יכול לבחור או להמכיר מהר יותר בהנמכה קטנה.`;
      color = 'amber';
    } else if (price < minPrice * 1.1) {
      verdict = 'עסקה טובה';
      verdict_en = 'good_deal';
      explanation = `המחיר נמוך מהממוצע! זה יימכר מהר מאוד. שקול הגדלה קטנה.`;
      color = 'blue';
    }

    res.json({
      verdict,
      verdict_en,
      explanation,
      color,
      market: {
        min: minPrice,
        avg: avgPrice,
        max: maxPrice
      },
      recommendation: verdict === 'עסקה טובה' ? 'raise' : verdict === 'יקר מדי' ? 'lower' : 'keep',
      confidence: 0.85
    });
  } catch (error) {
    console.error('Price analysis error:', error);
    res.status(500).json({ error: 'שגיאה בניתוח המחיר' });
  }
});

// AI Recommendations
router.post('/recommendations', async (req, res) => {
  try {
    const { listingId, userPreferences = {}, listingCategory } = req.body;

    // Mock recommendations - return relevant listings
    const recommendations = [
      {
        reason: 'דומה לפריט שהצגת',
        score: 0.92,
        aspect: 'category'
      },
      {
        reason: 'מחיר דומה',
        score: 0.88,
        aspect: 'price'
      },
      {
        reason: 'באותו מיקום',
        score: 0.85,
        aspect: 'location'
      }
    ];

    res.json({
      recommendations,
      relevance_score: 0.88,
      message: `מצאנו ${recommendations.length} מודעות דומות שאולי תעניין אותך`
    });
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ error: 'שגיאה בקבלת ההמלצות' });
  }
});

export default router;
