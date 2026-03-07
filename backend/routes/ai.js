import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// ── In-memory deals store ─────────────────────────────────────────────────────
const deals = [];
let dealCounter = 1;

// Check if real OpenAI API key is provided
const hasRealAPI = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-api-key-here';

// ── helpers ──────────────────────────────────────────────────────────────────

const ACCEPT_WORDS   = ['מסכים', 'מקובל', 'בסדר גמור', 'לקחתי', 'קנוי', 'deal', 'סגור', 'מוכן לסגור', 'נסגר', 'אני לוקח', 'אני קונה', 'עסקה', 'יאללה סוגרים', 'בוא נסגור', 'מסכים למחיר'];
const LOWEST_WORDS   = ['הכי נמוך', 'מינימום', 'תחתית', 'אין פחות', 'bottom', 'lowest', 'מה הכי'];
const URGENT_WORDS   = ['היום', 'עכשיו', 'מזומן', 'cash', 'מיד', 'תוך שעה'];
const MIDPOINT_WORDS = ['נפגש באמצע', 'חצי חצי', 'ספליט', 'split', 'meet in the middle', 'פגישה באמצע'];
const PRODUCT_WORDS  = ['מצב', 'אחריות', 'כמה זמן', 'כמה שנים', 'בשימוש', 'כלול', 'מה כלול', 'תמונות', 'בדיקה', 'היסטוריה', 'פגמים', 'שריטות', 'ספר לי', 'ספרי', 'מידע', 'פרטים', 'למה מוכר', 'מדוע מוכר', 'קנית', 'מתי קנית', 'גיל', 'ישן', 'חדש'];

const detectAcceptance    = (msg) => ACCEPT_WORDS.some(w => msg.includes(w));
const detectLowest        = (msg) => LOWEST_WORDS.some(w => msg.includes(w));
const detectUrgent        = (msg) => URGENT_WORDS.some(w => msg.includes(w));
const detectMidpoint      = (msg) => MIDPOINT_WORDS.some(w => msg.includes(w));
const detectProductQuestion = (msg) => PRODUCT_WORDS.some(w => msg.includes(w));

// Extract number from message
const extractAmount = (msg) => {
  const m = msg.replace(/,/g, '').match(/\d{2,8}/);
  return m ? parseInt(m[0], 10) : null;
};

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Round to nearest "clean" number (looks more human)
const cleanPrice = (n) => {
  if (n >= 100000) return Math.round(n / 1000) * 1000;
  if (n >= 10000)  return Math.round(n / 500)  * 500;
  if (n >= 1000)   return Math.round(n / 100)  * 100;
  if (n >= 100)    return Math.round(n / 50)   * 50;
  return Math.round(n / 10) * 10;
};

// Get last AI offer from history
const getLastAIOffer = (history, fallback) => {
  for (let i = (history?.length || 0) - 1; i >= 0; i--) {
    if (history[i].offer && history[i].sender === 'ai') return history[i].offer;
    if (history[i].offer) return history[i].offer;
  }
  return fallback;
};

// ── Professional Sales Agent Negotiation Engine ─────────────────────────────
//
// Strategy (seller role):
//   1. Open with value anchoring — justify the asking price
//   2. React to buyer's offer:
//      - Lowball (< 65%): Push back hard, don't move much
//      - Low (65–78%):    Counter at ~88-92% with justification
//      - Fair (78–88%):   Counter splitting the gap, lean seller
//      - Good (88–94%):   Small final concession, pressure to close
//      - Near-match(>94%):Accept or tiny symbolic concession
//   3. Use urgency, social proof, and value arguments
//   4. Never go below minFloor
//   5. Max total concession: 15% (unless minFloor says otherwise)
//
const getAIMockResponse = (message, role, listingPrice, history, sellerNotes = null) => {
  const msg      = message.trim().toLowerCase();
  const lp       = listingPrice;
  const round    = Math.floor((history?.length || 0) / 2);
  const minFloor = sellerNotes?.minPrice
    ? Number(sellerNotes.minPrice)
    : cleanPrice(lp * 0.82); // default floor: 82% of asking price

  // ── Deal accepted ──────────────────────────────────────────────────────────
  if (detectAcceptance(msg)) {
    const lastOffer = getLastAIOffer(history, lp);
    return {
      message: pick([
        `🤝 מצוין! הגענו להסכמה על ₪${lastOffer.toLocaleString()}. אני מעביר את ההצעה למוכר לאישור סופי — הוא יחזיר תשובה בהקדם.`,
        `✅ סוגרים! ₪${lastOffer.toLocaleString()} — עסקה יפה לשני הצדדים. שולח למוכר לאישור.`,
        `🎉 מעולה! ₪${lastOffer.toLocaleString()} זה מחיר הוגן. שולח לאישור המוכר עכשיו.`,
      ]),
      currentOffer: lastOffer,
      confidence: 1,
      dealReached: true,
      suggestedReplies: [],
    };
  }

  // ── Extract buyer's offered amount ─────────────────────────────────────────
  const buyerOffer = extractAmount(msg);
  const isUrgent   = detectUrgent(msg);
  const isMidpoint = detectMidpoint(msg);
  const isLowest   = detectLowest(msg);

  // Current AI position
  const lastAIOffer = getLastAIOffer(history, lp);
  const gapTotal    = lp - minFloor; // total negotiation room
  const maxDrop     = Math.max(gapTotal, lp * 0.15); // at most 15% drop
  const hardFloor   = Math.max(minFloor, lp - maxDrop);

  // Helper: clamp offer to floor
  const clamp = (v) => Math.max(cleanPrice(v), hardFloor);

  // ── Seller role (AI represents seller) ────────────────────────────────────
  if (role === 'seller') {

    // ── Round 0: Opening statement ──────────────────────────────────────────
    if (round === 0) {
      const firstOffer = clamp(lp * 0.97);
      const urgencyBonus = isUrgent ? ` מכיוון שאתה מוכן לסגור היום, אני יכול להציע ₪${clamp(lp * 0.95).toLocaleString()}.` : '';
      return {
        message: pick([
          `שלום וברוך הבא! שמח שהתעניינת. 😊\n\nהמוצר במצב ${sellerNotes?.condition || 'מצוין'} ואני מקבל פניות עליו ברציפות. המחיר ₪${lp.toLocaleString()} משקף את האיכות האמיתית שלו.${urgencyBonus}\n\nמה בראשך?`,
          `תודה על ההתעניינות! 🙏\n\nאני מוכר ישר ומקצועי — המחיר ₪${lp.toLocaleString()} הוא מחיר שוק ריאלי. יש לי מספר מתעניינים, אבל אשמח לסגור עם מי שרציני.\n\nמה ההצעה שלך?`,
          `היי! מעניין לשמוע. 👋\n\nהמוצר שלי הושקע בו — ${sellerNotes?.reason ? `אני מוכר כי ${sellerNotes.reason}` : 'אני מוכר בגלל שינוי נסיבות'}. המחיר ₪${lp.toLocaleString()} סופי כמעט, אבל עם הצעה רצינית — נדבר.`,
        ]),
        currentOffer: firstOffer,
        confidence: 0.82,
        suggestedReplies: ['מה מצב המוצר?', 'כמה זמן בשימוש?', 'מה כלול במחיר?'],
      };
    }

    // ── Analyze buyer's position ────────────────────────────────────────────
    const buyerPct = buyerOffer ? buyerOffer / lp : null;

    // ── "What's your lowest?" — deflect, don't reveal floor ─────────────────
    if (isLowest) {
      return {
        message: pick([
          `אני לא מנהל משא ומתן ככה. 😊\n\nהמחיר שלי משקף את הערך האמיתי של המוצר. תציע לי מחיר שנראה לך הוגן — ואני אשקול ברצינות.`,
          `"הכי נמוך"? 😄 זה לא כך שזה עובד אצלי.\n\nאני מוכר ישר — תגיד לי כמה אתה מוכן לשלם ונראה איפה אנחנו פוגשים.`,
          `אני לא חושף מחיר מינימום. 🎯\n\nאבל אם תציע הצעה רצינית, אני מבטיח שנשמע אחד את השני. מה יש לך בראש?`,
        ]),
        currentOffer: lastAIOffer,
        confidence: 0.85,
        suggestedReplies: [`אני מציע ₪${cleanPrice(lp * 0.87).toLocaleString()}`, `₪${cleanPrice(lp * 0.9).toLocaleString()}`, 'יש גמישות?'],
      };
    }

    // ── "Meet in the middle" ────────────────────────────────────────────────
    if (isMidpoint && buyerOffer) {
      const midpoint = clamp((buyerOffer + lastAIOffer) / 2);
      // Lean slightly toward seller
      const ourMid   = clamp(midpoint + cleanPrice((lastAIOffer - midpoint) * 0.3));
      return {
        message: pick([
          `אני אוהב הגישה! 🤝\n\nבוא נפגש — אבל קרוב יותר אליי: ₪${ourMid.toLocaleString()}. זה הוגן לשני הצדדים, ומסיים את העסקה בצורה נקייה.`,
          `"מפגש באמצע" — שמעת. 😄\n\nאם אני מוריד ל-₪${ourMid.toLocaleString()}, זה כבר מפגש אמיתי. מה אתה אומר?`,
        ]),
        currentOffer: ourMid,
        confidence: 0.87,
        suggestedReplies: [`מסכים ₪${ourMid.toLocaleString()}`, 'יש עוד מקום?', 'צריך לחשוב'],
      };
    }

    // ── Buyer made a specific offer ─────────────────────────────────────────
    if (buyerOffer && buyerPct !== null) {

      // Lowball (< 65%)
      if (buyerPct < 0.65) {
        const counter = clamp(lp * 0.94);
        return {
          message: pick([
            `🙂 אני מבין שאתה מנסה — אבל ₪${buyerOffer.toLocaleString()} זה רחוק מהמציאות.\n\nהמוצר הזה שווה כל שקל של ₪${lp.toLocaleString()}. במחיר כזה אוכל להציע ₪${counter.toLocaleString()} לכל היותר, ורק כי אני רוצה לסגור מהר.\n\nמה אתה אומר?`,
            `בכל הכבוד — ₪${buyerOffer.toLocaleString()} זה לא הצעה שאני יכול לשקול ברצינות. 😅\n\nיש לי מתעניינים אחרים שמציעים הרבה יותר. הכי שאני יכול לרדת עכשיו — ₪${counter.toLocaleString()}.\n\nזה עובד?`,
            `הצעה אמיצה! 😄 אבל המוצר הזה לא "מחיר הורסים".\n\nאם אתה רציני, בוא נדבר על ₪${counter.toLocaleString()} — שזה כבר הנחה יפה מהמחיר המקורי.`,
          ]),
          currentOffer: counter,
          confidence: 0.75,
          suggestedReplies: [`בסדר, ₪${counter.toLocaleString()}`, 'יקר לי', `אני מציע ₪${cleanPrice(buyerOffer * 1.1).toLocaleString()}`],
        };
      }

      // Low (65–78%)
      if (buyerPct < 0.78) {
        // Counter: split gap, lean seller 70/30
        const split   = buyerOffer + (lastAIOffer - buyerOffer) * 0.7;
        const counter = clamp(split);
        const urgBonus = isUrgent ? ` ומכיוון שאתה מגיע היום — אני מוריד עוד קצת ל-₪${clamp(counter - cleanPrice(lp * 0.01)).toLocaleString()}.` : '';
        return {
          message: pick([
            `אני מעריך את הכנות. ₪${buyerOffer.toLocaleString()} זה עדיין נמוך מדי בשבילי. 🤔\n\nהשקעתי במוצר הזה ואני יודע מה הוא שווה בשוק. הצעה שאני יכול לשקול: ₪${counter.toLocaleString()}.${urgBonus}\n\nזה מתאים?`,
            `₪${buyerOffer.toLocaleString()} — לא שם עדיין, אבל אנחנו בכיוון. 👍\n\nיש לי עוד שניים-שלושה מתעניינים שמחכים לתשובה. אני יכול לתת ₪${counter.toLocaleString()} — ולא יותר בשלב זה.\n\nמה תחליט?`,
            `אנחנו עדיין רחוקים, אבל לא נואשים. 😊\n\n₪${counter.toLocaleString()} — זה מחיר שמשקף את האיכות ונותן לך הנחה אמיתית. אני לא יכול ללכת נמוך יותר בלי להרגיש שמכרתי בהפסד.`,
          ]),
          currentOffer: counter,
          confidence: 0.80,
          suggestedReplies: [`מסכים, ₪${counter.toLocaleString()}`, 'יכול עוד קצת?', 'נפגש באמצע'],
        };
      }

      // Reasonable (78–88%)
      if (buyerPct < 0.88) {
        const split   = buyerOffer + (lastAIOffer - buyerOffer) * 0.55;
        const counter = clamp(split);
        return {
          message: pick([
            `עכשיו אנחנו מדברים! 🎯\n\n₪${buyerOffer.toLocaleString()} — הצעה הגיונית. אני יכול לפגוש אותך ב-₪${counter.toLocaleString()}. זה מחיר שניהם יכולים להיות שבעי רצון ממנו.\n\nמה אתה אומר?`,
            `טוב, אני רואה שאתה רציני. 👏\n\nאני מוריד ל-₪${counter.toLocaleString()} — וזה כבר מחיר שאני לא מצפה לו מהרבה קונים. לא ייתכן שתמצא מוצר כזה במחיר הזה במקום אחר.\n\nנסגר?`,
            `הצעה סבירה. אני בכיוון. 😎\n\n₪${counter.toLocaleString()} — ומוסיף גם שמביא אותו אלייך / עוזר בהעמסה. זה deal שכדאי לסגור עכשיו.\n\nמה אתה אומר?`,
          ]),
          currentOffer: counter,
          confidence: 0.84,
          suggestedReplies: [`סוגרים ב-₪${counter.toLocaleString()}`, 'עוד קצת?', 'תן לי לחשוב'],
        };
      }

      // Good offer (88–94%)
      if (buyerPct < 0.94) {
        const counter = clamp(buyerOffer + cleanPrice((lastAIOffer - buyerOffer) * 0.4));
        return {
          message: pick([
            `אנחנו ממש קרובים! 🔥\n\n₪${buyerOffer.toLocaleString()} — הצעה טובה מאוד. אני יכול ל-₪${counter.toLocaleString()} ולא פחות. זה שווה לך — ואנחנו סוגרים עכשיו.\n\nמה אתה אומר?`,
            `כמעט שם! 🎯\n\n₪${counter.toLocaleString()} — זה ה"last call" שלי. אני מקבל פניה נוספת לגבי המוצר הזה, אז אם אתה רציני — עכשיו זה הזמן.\n\nנסגר?`,
            `הצעה מצוינת — ואני עונה לה בכבוד: ₪${counter.toLocaleString()}. 🤝\n\nאני לא אמוד לקחת פחות, כי גם כך ויתרתי הרבה. אבל אני רוצה שתהיה מרוצה מהעסקה.\n\nנסגר?`,
          ]),
          currentOffer: counter,
          confidence: 0.90,
          suggestedReplies: [`מסכים! ₪${counter.toLocaleString()}`, 'ממש קרוב, עוד קצת', 'אצטרך לחשוב'],
        };
      }

      // Near match (≥ 94%) — accept with tiny symbolic give
      const finalOffer = clamp(buyerOffer + cleanPrice((lastAIOffer - buyerOffer) * 0.2));
      return {
        message: pick([
          `בסדר, אתה שכנעת אותי. 💪\n\n₪${finalOffer.toLocaleString()} — ואנחנו סוגרים. זו הצעה שאני מרגיש בה בסדר, ואני מקווה שגם אתה.\n\nסוגרים?`,
          `הצעה קרובה מאוד — הנה ה"אחרון" שלי: ₪${finalOffer.toLocaleString()}. 🤝\n\nאנחנו פרקטית שם. בוא נגמור את זה.`,
        ]),
        currentOffer: finalOffer,
        confidence: 0.95,
        suggestedReplies: [`מסכים! סוגרים ב-₪${finalOffer.toLocaleString()}`, 'בסדר גמור', 'לקחתי'],
      };
    }

    // ── Product knowledge question ──────────────────────────────────────────
    if (detectProductQuestion(msg)) {
      const condition = sellerNotes?.condition || 'מצוין';
      const reason    = sellerNotes?.reason    || 'שינוי צרכים אישיים';
      const conditionAnswers = {
        'חדש':          'המוצר חדש לגמרי — מעולם לא היה בשימוש. יצא מהקופסה רק לבדיקה.',
        'כמו חדש':      'המוצר נמצא במצב כמו חדש — שימוש מינימלי בלבד, ללא שריטות או פגמים.',
        'טוב מאוד':     'המוצר במצב טוב מאוד — שימוש סביר ורגיל, ללא פגמים משמעותיים.',
        'טוב':          'המוצר במצב טוב — שימוש יומיומי, ייתכן שריטות קטנות שלא משפיעות על הפונקציה.',
        'בינוני':       'המוצר במצב בינוני — שימוש רב, ייתכנו סימני בלאי נראים לעין.',
        'לשיפוץ':       'המוצר זקוק לשיפוץ — המחיר כבר מחושב בהתאם.',
      };
      const conditionDesc = conditionAnswers[condition] || `המוצר במצב ${condition}.`;

      const answers = [
        `בשמחה! 😊\n\n**מצב:** ${conditionDesc}\n**סיבת מכירה:** ${reason}.\n**כלול בעסקה:** כל מה שמופיע במודעה, ללא תוספות נסתרות.\n\nיש לך שאלות נוספות?`,
        `שאלה מצוינת! 🎯\n\n**מצב המוצר:** ${conditionDesc}\n**זמן בשימושי:** ${sellerNotes?.usagePeriod || 'כשנה בערך'}.\n**סיבת מכירה:** ${reason}.\n\nרוצה לדעת עוד פרטים?`,
        `שמח שאתה שואל — זה מראה שאתה קונה רציני. 👍\n\n**מצב:** ${conditionDesc}\n**אחריות:** ${sellerNotes?.warranty || 'אין אחריות יצרן פעילה — אבל המוצר עצמו בסדר מושלם'}.\n**כלול:** כל האביזרים המקוריים.\n\nמה עוד רצית לדעת?`,
      ];

      // Remaining product questions (minus the one just asked)
      const allProductReplies = ['מה מצב המוצר?', 'כמה זמן בשימוש?', 'האם יש אחריות?', 'מה כלול במחיר?', 'למה אתה מוכר?'];
      const remainingQ = allProductReplies.filter(q => !msg.includes(q.replace('?', '').toLowerCase().slice(0, 8)));
      const followUps  = remainingQ.slice(0, 2);
      followUps.push(`אני מציע ₪${cleanPrice(lp * 0.88).toLocaleString()}`);

      return {
        message: pick(answers),
        currentOffer: lastAIOffer,
        confidence: 0.82,
        suggestedReplies: followUps,
      };
    }

    // ── No specific amount, general message ────────────────────────────────
    // Make a small additional concession from the last AI offer
    const smallDrop = cleanPrice(lp * 0.02);
    const counter   = clamp(lastAIOffer - smallDrop);
    if (round <= 2) {
      return {
        message: pick([
          `אני שמח לנהל משא ומתן, אבל תן לי קודם להסביר למה המחיר הוגן. 🧐\n\nהמוצר הזה במצב ${sellerNotes?.condition || 'מצוין'}, כולל את כל האביזרים, ומחירי השוק מאשרים שאנחנו בטווח הנכון. ₪${counter.toLocaleString()} — מה אתה מציע?`,
          `נשמח לדבר על מחיר. 😊\n\nאבל לפני, חשוב לי שתדע: ${sellerNotes?.reason ? `אני מוכר כי ${sellerNotes.reason}` : 'אני מוכר כי אני קונה משהו חדש'}, לא מכורח. ₪${counter.toLocaleString()} זה מחיר שמכבד את שני הצדדים.\n\nמה ההצעה שלך?`,
        ]),
        currentOffer: counter,
        confidence: 0.82,
        suggestedReplies: [`₪${cleanPrice(lp * 0.85).toLocaleString()}`, `₪${cleanPrice(lp * 0.88).toLocaleString()}`, 'יש גמישות?'],
      };
    }

    // Round 3+: Pressure to close
    const pressureOffer = clamp(lastAIOffer - cleanPrice(lp * 0.015));
    return {
      message: pick([
        `אוקיי, בוא נסגור את זה. ⏰\n\nיש לי מתעניין נוסף שחוזר אליי היום. אני יכול ל-₪${pressureOffer.toLocaleString()} — ולא פחות. אם אתה רוצה את המוצר, עכשיו זה הזמן.\n\nמה אומר?`,
        `הצעה אחרונה מצדי: ₪${pressureOffer.toLocaleString()}. 🎯\n\nאני לא יכול לחכות הרבה יותר, ואני לא מורד עוד. זה מחיר הוגן — קח את זה.`,
        `₪${pressureOffer.toLocaleString()} — ואנחנו סוגרים עסקה. 🤝\n\nאם לא, אני חוזר למתעניינים האחרים. אין טינה — אבל המחיר הזה לא ייחזיק הרבה.`,
      ]),
      currentOffer: pressureOffer,
      confidence: 0.92,
      suggestedReplies: [`מסכים! ₪${pressureOffer.toLocaleString()}`, 'עוד ₪100 הנחה?', 'לא מתאים לי'],
    };
  }

  // ── Buyer role (not used in current app flow) ───────────────────────────
  const buyerCounter = cleanPrice(lp * Math.max(0.78, 0.88 - round * 0.02));
  return {
    message: `אני מעוניין ב-₪${buyerCounter.toLocaleString()}. מה דעתך?`,
    currentOffer: buyerCounter,
    confidence: 0.78,
    suggestedReplies: ['בסדר', 'יקר לי', 'נפגש באמצע'],
  };
};

// AI Negotiation endpoint
router.post('/negotiate', async (req, res) => {
  try {
    const { message, listingId, listingPrice, history = [], role = 'buyer', sellerNotes } = req.body;

    if (!message || !listingPrice) {
      return res.status(400).json({ error: 'נתונים חסרים' });
    }

    const response = getAIMockResponse(message, role, listingPrice, history, sellerNotes);
    
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

// ── Market price database (Israeli market, ₪) ─────────────────────────────
// Format: keyword → { min, avg, max, confidence }
// confidence: how well this covers the typical item (0-1)
const MARKET_DB = {
  electronics: [
    // iPhones
    { k: 'iphone 16 pro max', min: 5200, avg: 6200, max: 7500, conf: 0.95 },
    { k: 'iphone 16 pro',     min: 4400, avg: 5300, max: 6400, conf: 0.95 },
    { k: 'iphone 16 plus',    min: 3600, avg: 4400, max: 5300, conf: 0.95 },
    { k: 'iphone 16',         min: 3200, avg: 3900, max: 4800, conf: 0.95 },
    { k: 'iphone 15 pro max', min: 4200, avg: 5200, max: 6400, conf: 0.95 },
    { k: 'iphone 15 pro',     min: 3500, avg: 4400, max: 5500, conf: 0.95 },
    { k: 'iphone 15 plus',    min: 2800, avg: 3500, max: 4400, conf: 0.95 },
    { k: 'iphone 15',         min: 2500, avg: 3200, max: 4000, conf: 0.95 },
    { k: 'iphone 14 pro max', min: 3200, avg: 4000, max: 5000, conf: 0.95 },
    { k: 'iphone 14 pro',     min: 2600, avg: 3300, max: 4200, conf: 0.95 },
    { k: 'iphone 14 plus',    min: 2000, avg: 2700, max: 3500, conf: 0.95 },
    { k: 'iphone 14',         min: 1800, avg: 2400, max: 3200, conf: 0.95 },
    { k: 'iphone 13 pro max', min: 2300, avg: 3000, max: 3900, conf: 0.95 },
    { k: 'iphone 13 pro',     min: 1800, avg: 2500, max: 3300, conf: 0.95 },
    { k: 'iphone 13 mini',    min: 1200, avg: 1700, max: 2300, conf: 0.95 },
    { k: 'iphone 13',         min: 1500, avg: 2100, max: 2900, conf: 0.95 },
    { k: 'iphone 12 pro max', min: 1600, avg: 2200, max: 3000, conf: 0.95 },
    { k: 'iphone 12 pro',     min: 1300, avg: 1900, max: 2600, conf: 0.95 },
    { k: 'iphone 12 mini',    min: 800,  avg: 1200, max: 1700, conf: 0.95 },
    { k: 'iphone 12',         min: 1000, avg: 1600, max: 2200, conf: 0.95 },
    { k: 'iphone 11 pro max', min: 1000, avg: 1500, max: 2100, conf: 0.95 },
    { k: 'iphone 11 pro',     min: 800,  avg: 1300, max: 1900, conf: 0.95 },
    { k: 'iphone 11',         min: 700,  avg: 1100, max: 1600, conf: 0.95 },
    { k: 'iphone se',         min: 600,  avg: 900,  max: 1400, conf: 0.90 },
    { k: 'iphone xr',         min: 500,  avg: 750,  max: 1100, conf: 0.90 },
    { k: 'iphone xs max',     min: 600,  avg: 950,  max: 1400, conf: 0.90 },
    { k: 'iphone xs',         min: 500,  avg: 750,  max: 1100, conf: 0.90 },
    // Samsung Galaxy
    { k: 'samsung galaxy s25 ultra', min: 5000, avg: 6200, max: 7500, conf: 0.95 },
    { k: 'samsung galaxy s25+',      min: 3800, avg: 4800, max: 5800, conf: 0.95 },
    { k: 'samsung galaxy s25',       min: 3200, avg: 4000, max: 5000, conf: 0.95 },
    { k: 'samsung galaxy s24 ultra', min: 4000, avg: 5000, max: 6200, conf: 0.95 },
    { k: 'samsung galaxy s24+',      min: 3000, avg: 3900, max: 4900, conf: 0.95 },
    { k: 'samsung galaxy s24',       min: 2600, avg: 3400, max: 4300, conf: 0.95 },
    { k: 'samsung galaxy s23 ultra', min: 2800, avg: 3700, max: 4700, conf: 0.95 },
    { k: 'samsung galaxy s23',       min: 1800, avg: 2600, max: 3500, conf: 0.95 },
    { k: 'samsung galaxy s22',       min: 1300, avg: 2000, max: 2800, conf: 0.90 },
    { k: 'samsung galaxy a55',       min: 1000, avg: 1400, max: 1900, conf: 0.90 },
    { k: 'samsung galaxy a54',       min: 800,  avg: 1200, max: 1700, conf: 0.90 },
    { k: 'samsung galaxy a35',       min: 700,  avg: 1000, max: 1400, conf: 0.90 },
    { k: 'samsung galaxy a34',       min: 600,  avg: 900,  max: 1300, conf: 0.90 },
    // Google Pixel
    { k: 'pixel 9 pro',   min: 3000, avg: 3800, max: 4800, conf: 0.90 },
    { k: 'pixel 9',       min: 2400, avg: 3100, max: 4000, conf: 0.90 },
    { k: 'pixel 8 pro',   min: 2500, avg: 3200, max: 4100, conf: 0.90 },
    { k: 'pixel 8',       min: 2000, avg: 2700, max: 3500, conf: 0.90 },
    // MacBook
    { k: 'macbook pro 16', min: 6500, avg: 9000, max: 14000, conf: 0.85 },
    { k: 'macbook pro 14', min: 5500, avg: 7500, max: 11000, conf: 0.85 },
    { k: 'macbook pro m3', min: 7000, avg: 9500, max: 13000, conf: 0.90 },
    { k: 'macbook pro m2', min: 5500, avg: 7500, max: 10500, conf: 0.90 },
    { k: 'macbook pro m1', min: 4000, avg: 6000, max: 8500,  conf: 0.90 },
    { k: 'macbook air m3', min: 4500, avg: 5800, max: 7500,  conf: 0.90 },
    { k: 'macbook air m2', min: 3500, avg: 4700, max: 6500,  conf: 0.90 },
    { k: 'macbook air m1', min: 2800, avg: 3800, max: 5200,  conf: 0.90 },
    { k: 'macbook pro',    min: 4000, avg: 7000, max: 13000, conf: 0.65 },
    { k: 'macbook air',    min: 2800, avg: 4500, max: 7000,  conf: 0.65 },
    { k: 'macbook',        min: 2800, avg: 5500, max: 13000, conf: 0.50 },
    // iPad
    { k: 'ipad pro 13',   min: 4500, avg: 6000, max: 8500,  conf: 0.90 },
    { k: 'ipad pro 12.9', min: 4000, avg: 5500, max: 8000,  conf: 0.90 },
    { k: 'ipad pro 11',   min: 3000, avg: 4200, max: 6000,  conf: 0.90 },
    { k: 'ipad pro',      min: 3000, avg: 5000, max: 8500,  conf: 0.70 },
    { k: 'ipad air m2',   min: 2500, avg: 3300, max: 4500,  conf: 0.90 },
    { k: 'ipad air',      min: 1800, avg: 2800, max: 4200,  conf: 0.75 },
    { k: 'ipad mini',     min: 1500, avg: 2200, max: 3200,  conf: 0.85 },
    { k: 'ipad',          min: 1200, avg: 2000, max: 3200,  conf: 0.55 },
    // AirPods
    { k: 'airpods pro 2',  min: 700, avg: 900,  max: 1150, conf: 0.92 },
    { k: 'airpods pro',    min: 500, avg: 700,  max: 900,  conf: 0.88 },
    { k: 'airpods max',    min: 1200, avg: 1600, max: 2200, conf: 0.90 },
    { k: 'airpods 4',      min: 400, avg: 550,  max: 700,  conf: 0.90 },
    { k: 'airpods 3',      min: 300, avg: 450,  max: 600,  conf: 0.88 },
    { k: 'airpods',        min: 250, avg: 600,  max: 1000, conf: 0.50 },
    // Apple Watch
    { k: 'apple watch ultra 2', min: 2800, avg: 3500, max: 4500, conf: 0.92 },
    { k: 'apple watch ultra',   min: 2300, avg: 3000, max: 4000, conf: 0.90 },
    { k: 'apple watch series 9',min: 1400, avg: 1800, max: 2400, conf: 0.92 },
    { k: 'apple watch series 8',min: 1100, avg: 1500, max: 2000, conf: 0.90 },
    { k: 'apple watch series 7',min: 800,  avg: 1200, max: 1700, conf: 0.88 },
    { k: 'apple watch se',      min: 700,  avg: 950,  max: 1300, conf: 0.90 },
    { k: 'apple watch',         min: 700,  avg: 1500, max: 3500, conf: 0.45 },
    // Gaming
    { k: 'playstation 5',      min: 1800, avg: 2200, max: 2800, conf: 0.92 },
    { k: 'ps5 slim',           min: 1600, avg: 2000, max: 2500, conf: 0.92 },
    { k: 'ps5',                min: 1600, avg: 2100, max: 2700, conf: 0.90 },
    { k: 'playstation 4 pro',  min: 600,  avg: 950,  max: 1400, conf: 0.90 },
    { k: 'ps4 pro',            min: 600,  avg: 950,  max: 1400, conf: 0.90 },
    { k: 'playstation 4',      min: 400,  avg: 650,  max: 950,  conf: 0.88 },
    { k: 'ps4',                min: 400,  avg: 650,  max: 950,  conf: 0.88 },
    { k: 'xbox series x',      min: 1600, avg: 2000, max: 2600, conf: 0.90 },
    { k: 'xbox series s',      min: 900,  avg: 1200, max: 1600, conf: 0.90 },
    { k: 'nintendo switch oled',min: 1000, avg: 1350, max: 1800, conf: 0.92 },
    { k: 'nintendo switch lite',min: 500,  avg: 750,  max: 1050, conf: 0.90 },
    { k: 'nintendo switch',    min: 700,  avg: 1050, max: 1500, conf: 0.85 },
    { k: 'steam deck',         min: 1500, avg: 2000, max: 2700, conf: 0.88 },
    // Laptops (generic)
    { k: 'dell xps 15',        min: 4500, avg: 6500, max: 9000, conf: 0.85 },
    { k: 'dell xps 13',        min: 3500, avg: 5000, max: 7000, conf: 0.85 },
    { k: 'lenovo thinkpad x1', min: 3000, avg: 5000, max: 7500, conf: 0.85 },
    { k: 'lenovo yoga',        min: 2500, avg: 4000, max: 6000, conf: 0.80 },
    { k: 'asus rog',           min: 3500, avg: 5500, max: 9000, conf: 0.82 },
    { k: 'hp spectre',         min: 4000, avg: 5800, max: 8500, conf: 0.82 },
    { k: 'surface pro',        min: 3500, avg: 5500, max: 8000, conf: 0.82 },
    // Camera / Drone
    { k: 'sony alpha a7',      min: 5000, avg: 7000, max: 10000, conf: 0.80 },
    { k: 'canon eos r6',       min: 5500, avg: 7500, max: 10500, conf: 0.82 },
    { k: 'canon eos r50',      min: 2800, avg: 3800, max: 5000,  conf: 0.85 },
    { k: 'fujifilm x100',      min: 3500, avg: 5000, max: 7000,  conf: 0.85 },
    { k: 'dji mini 4 pro',     min: 2500, avg: 3200, max: 4200,  conf: 0.88 },
    { k: 'dji mini 3',         min: 1800, avg: 2400, max: 3200,  conf: 0.88 },
    { k: 'dji air 3',          min: 3500, avg: 4500, max: 5800,  conf: 0.88 },
    { k: 'dji mavic',          min: 3000, avg: 4500, max: 6000,  conf: 0.80 },
    { k: 'gopro hero 13',      min: 1400, avg: 1800, max: 2300,  conf: 0.88 },
    { k: 'gopro hero 12',      min: 1100, avg: 1500, max: 2000,  conf: 0.88 },
    { k: 'gopro hero 11',      min: 800,  avg: 1200, max: 1700,  conf: 0.88 },
  ],
  vehicles: [
    // Tesla
    { k: 'tesla model 3',    min: 140000, avg: 185000, max: 240000, conf: 0.85 },
    { k: 'tesla model y',    min: 165000, avg: 215000, max: 270000, conf: 0.85 },
    { k: 'tesla model s',    min: 240000, avg: 320000, max: 420000, conf: 0.82 },
    { k: 'tesla model x',    min: 260000, avg: 350000, max: 450000, conf: 0.82 },
    // BMW
    { k: 'bmw m3',           min: 250000, avg: 350000, max: 500000, conf: 0.80 },
    { k: 'bmw m5',           min: 350000, avg: 480000, max: 650000, conf: 0.80 },
    { k: 'bmw x5',           min: 200000, avg: 280000, max: 400000, conf: 0.82 },
    { k: 'bmw x3',           min: 150000, avg: 210000, max: 290000, conf: 0.82 },
    { k: 'bmw x1',           min: 110000, avg: 155000, max: 220000, conf: 0.82 },
    { k: 'bmw 5',            min: 160000, avg: 220000, max: 320000, conf: 0.80 },
    { k: 'bmw 3',            min: 100000, avg: 145000, max: 210000, conf: 0.80 },
    { k: 'bmw 1',            min: 70000,  avg: 110000, max: 160000, conf: 0.78 },
    // Mercedes
    { k: 'mercedes amg',     min: 250000, avg: 380000, max: 600000, conf: 0.78 },
    { k: 'mercedes glc',     min: 160000, avg: 220000, max: 300000, conf: 0.82 },
    { k: 'mercedes gla',     min: 130000, avg: 175000, max: 240000, conf: 0.82 },
    { k: 'mercedes e',       min: 160000, avg: 230000, max: 340000, conf: 0.80 },
    { k: 'mercedes c',       min: 110000, avg: 160000, max: 230000, conf: 0.80 },
    { k: 'mercedes a',       min: 90000,  avg: 130000, max: 185000, conf: 0.78 },
    // Audi
    { k: 'audi q7',          min: 200000, avg: 280000, max: 380000, conf: 0.80 },
    { k: 'audi q5',          min: 150000, avg: 205000, max: 280000, conf: 0.82 },
    { k: 'audi q3',          min: 120000, avg: 165000, max: 230000, conf: 0.82 },
    { k: 'audi a6',          min: 140000, avg: 195000, max: 270000, conf: 0.80 },
    { k: 'audi a4',          min: 100000, avg: 145000, max: 205000, conf: 0.80 },
    { k: 'audi a3',          min: 75000,  avg: 115000, max: 165000, conf: 0.80 },
    // Toyota
    { k: 'toyota rav4',      min: 95000,  avg: 140000, max: 200000, conf: 0.85 },
    { k: 'toyota camry',     min: 90000,  avg: 135000, max: 190000, conf: 0.85 },
    { k: 'toyota chr',       min: 85000,  avg: 120000, max: 165000, conf: 0.85 },
    { k: 'toyota corolla',   min: 60000,  avg: 95000,  max: 140000, conf: 0.85 },
    { k: 'toyota yaris',     min: 45000,  avg: 70000,  max: 100000, conf: 0.85 },
    { k: 'toyota hilux',     min: 150000, avg: 200000, max: 270000, conf: 0.82 },
    // Hyundai
    { k: 'hyundai ioniq 6',  min: 140000, avg: 175000, max: 220000, conf: 0.85 },
    { k: 'hyundai ioniq 5',  min: 130000, avg: 165000, max: 210000, conf: 0.85 },
    { k: 'hyundai tucson',   min: 90000,  avg: 130000, max: 180000, conf: 0.85 },
    { k: 'hyundai kona',     min: 70000,  avg: 105000, max: 150000, conf: 0.85 },
    { k: 'hyundai i30',      min: 60000,  avg: 90000,  max: 130000, conf: 0.83 },
    { k: 'hyundai i20',      min: 50000,  avg: 78000,  max: 115000, conf: 0.83 },
    { k: 'hyundai i10',      min: 40000,  avg: 62000,  max: 90000,  conf: 0.83 },
    // Kia
    { k: 'kia ev9',          min: 220000, avg: 280000, max: 350000, conf: 0.85 },
    { k: 'kia ev6',          min: 140000, avg: 180000, max: 230000, conf: 0.85 },
    { k: 'kia sportage',     min: 85000,  avg: 125000, max: 175000, conf: 0.85 },
    { k: 'kia niro',         min: 80000,  avg: 115000, max: 155000, conf: 0.85 },
    { k: 'kia stonic',       min: 65000,  avg: 95000,  max: 135000, conf: 0.83 },
    { k: 'kia picanto',      min: 40000,  avg: 62000,  max: 90000,  conf: 0.83 },
    // Mazda
    { k: 'mazda cx-60',      min: 160000, avg: 210000, max: 270000, conf: 0.82 },
    { k: 'mazda cx-5',       min: 100000, avg: 145000, max: 200000, conf: 0.85 },
    { k: 'mazda cx-30',      min: 85000,  avg: 120000, max: 165000, conf: 0.85 },
    { k: 'mazda 3',          min: 70000,  avg: 105000, max: 150000, conf: 0.85 },
    { k: 'mazda 2',          min: 50000,  avg: 78000,  max: 110000, conf: 0.83 },
    // VW
    { k: 'volkswagen id.4',  min: 130000, avg: 175000, max: 230000, conf: 0.83 },
    { k: 'volkswagen tiguan', min: 110000, avg: 160000, max: 220000, conf: 0.83 },
    { k: 'volkswagen golf',  min: 75000,  avg: 115000, max: 165000, conf: 0.83 },
    { k: 'volkswagen polo',  min: 55000,  avg: 85000,  max: 120000, conf: 0.83 },
    // Honda
    { k: 'honda hr-v',       min: 80000,  avg: 115000, max: 160000, conf: 0.83 },
    { k: 'honda cr-v',       min: 100000, avg: 145000, max: 200000, conf: 0.83 },
    { k: 'honda civic',      min: 70000,  avg: 105000, max: 150000, conf: 0.83 },
    // Nissan
    { k: 'nissan leaf',      min: 70000,  avg: 110000, max: 155000, conf: 0.83 },
    { k: 'nissan qashqai',   min: 80000,  avg: 120000, max: 170000, conf: 0.83 },
    { k: 'nissan x-trail',   min: 85000,  avg: 130000, max: 185000, conf: 0.83 },
    // Mitsubishi / Subaru
    { k: 'mitsubishi outlander', min: 80000, avg: 125000, max: 180000, conf: 0.82 },
    { k: 'subaru forester',  min: 85000,  avg: 130000, max: 185000, conf: 0.82 },
    { k: 'subaru outback',   min: 90000,  avg: 135000, max: 190000, conf: 0.82 },
    // Peugeot / Renault / Citroen
    { k: 'peugeot 3008',     min: 90000,  avg: 130000, max: 180000, conf: 0.80 },
    { k: 'peugeot 2008',     min: 70000,  avg: 105000, max: 150000, conf: 0.80 },
    { k: 'peugeot 208',      min: 55000,  avg: 85000,  max: 120000, conf: 0.80 },
    { k: 'renault megane',   min: 60000,  avg: 90000,  max: 130000, conf: 0.80 },
    { k: 'renault captur',   min: 65000,  avg: 98000,  max: 140000, conf: 0.80 },
    { k: 'skoda kodiaq',     min: 95000,  avg: 140000, max: 195000, conf: 0.80 },
    { k: 'skoda octavia',    min: 75000,  avg: 115000, max: 165000, conf: 0.80 },
    // Pickup / Commercial
    { k: 'isuzu d-max',      min: 140000, avg: 185000, max: 250000, conf: 0.80 },
    { k: 'ford ranger',      min: 140000, avg: 185000, max: 250000, conf: 0.80 },
  ],
  real_estate: [
    // תל אביב
    { k: 'תל אביב',     min: 2200000, avg: 3800000, max: 7000000, conf: 0.80 },
    { k: 'tel aviv',    min: 2200000, avg: 3800000, max: 7000000, conf: 0.80 },
    // גוש דן
    { k: 'ירושלים',     min: 1500000, avg: 2800000, max: 5000000, conf: 0.80 },
    { k: 'jerusalem',   min: 1500000, avg: 2800000, max: 5000000, conf: 0.80 },
    { k: 'רמת גן',      min: 1400000, avg: 2200000, max: 3800000, conf: 0.82 },
    { k: 'גבעתיים',     min: 1600000, avg: 2500000, max: 4200000, conf: 0.82 },
    { k: 'בני ברק',     min: 1200000, avg: 1800000, max: 2900000, conf: 0.82 },
    { k: 'ראשון לציון', min: 1200000, avg: 1900000, max: 3200000, conf: 0.82 },
    { k: 'פתח תקווה',   min: 1100000, avg: 1750000, max: 2900000, conf: 0.82 },
    { k: 'בת ים',       min: 900000,  avg: 1450000, max: 2400000, conf: 0.82 },
    { k: 'חולון',       min: 950000,  avg: 1500000, max: 2500000, conf: 0.82 },
    { k: 'רחובות',      min: 1000000, avg: 1600000, max: 2700000, conf: 0.82 },
    // שרון
    { k: 'הרצליה',      min: 1600000, avg: 2600000, max: 4500000, conf: 0.82 },
    { k: 'רעננה',       min: 1400000, avg: 2100000, max: 3400000, conf: 0.82 },
    { k: 'כפר סבא',     min: 1200000, avg: 1900000, max: 3100000, conf: 0.82 },
    { k: 'נתניה',       min: 1100000, avg: 1750000, max: 2900000, conf: 0.82 },
    { k: 'הוד השרון',   min: 1300000, avg: 2000000, max: 3300000, conf: 0.82 },
    // צפון
    { k: 'חיפה',        min: 700000,  avg: 1300000, max: 2400000, conf: 0.82 },
    { k: 'haifa',       min: 700000,  avg: 1300000, max: 2400000, conf: 0.82 },
    { k: 'קריות',       min: 550000,  avg: 950000,  max: 1700000, conf: 0.80 },
    { k: 'נצרת עילית',  min: 400000,  avg: 750000,  max: 1300000, conf: 0.78 },
    // דרום
    { k: 'אשדוד',       min: 800000,  avg: 1300000, max: 2100000, conf: 0.82 },
    { k: 'אשקלון',      min: 700000,  avg: 1100000, max: 1800000, conf: 0.82 },
    { k: 'באר שבע',     min: 600000,  avg: 950000,  max: 1600000, conf: 0.82 },
    { k: 'beer sheva',  min: 600000,  avg: 950000,  max: 1600000, conf: 0.82 },
    { k: 'אילת',        min: 800000,  avg: 1400000, max: 2500000, conf: 0.80 },
    // סוג נכס
    { k: 'פנטהאוז',     min: 3000000, avg: 6000000, max: 15000000,conf: 0.60 },
    { k: 'דירת גן',     min: 1500000, avg: 2500000, max: 4500000, conf: 0.60 },
    { k: 'דירת סטודיו', min: 800000,  avg: 1400000, max: 2500000, conf: 0.65 },
    { k: 'קוטג',        min: 2500000, avg: 4000000, max: 8000000, conf: 0.60 },
    { k: 'דו משפחתי',   min: 2000000, avg: 3500000, max: 7000000, conf: 0.60 },
    { k: 'וילה',        min: 3000000, avg: 5500000, max: 12000000,conf: 0.60 },
    { k: 'בית',         min: 1500000, avg: 3500000, max: 8000000, conf: 0.50 },
  ],
  furniture: [
    { k: 'ספת פינה', min: 1500, avg: 3500, max: 8000, conf: 0.85 },
    { k: 'ספה תלת', min: 800,  avg: 2000, max: 5000, conf: 0.82 },
    { k: 'ספה דו',  min: 600,  avg: 1500, max: 3800, conf: 0.82 },
    { k: 'ספה',     min: 500,  avg: 2000, max: 8000, conf: 0.60 },
    { k: 'כורסא',   min: 300,  avg: 900,  max: 2500, conf: 0.80 },
    { k: 'מיטה זוגית', min: 1000, avg: 2800, max: 7000, conf: 0.85 },
    { k: 'מיטה וחצי', min: 700,  avg: 1800, max: 4500, conf: 0.85 },
    { k: 'מיטה יחיד', min: 400,  avg: 1200, max: 3000, conf: 0.85 },
    { k: 'מיטת ילדים',min: 300,  avg: 900,  max: 2500, conf: 0.85 },
    { k: 'מיטה',    min: 400,  avg: 1800, max: 6000, conf: 0.55 },
    { k: 'מזרן 180', min: 600,  avg: 1800, max: 5000, conf: 0.85 },
    { k: 'מזרן 160', min: 500,  avg: 1400, max: 4000, conf: 0.85 },
    { k: 'מזרן 120', min: 350,  avg: 1000, max: 2800, conf: 0.83 },
    { k: 'מזרן',    min: 350,  avg: 1400, max: 5000, conf: 0.55 },
    { k: 'שולחן אוכל', min: 500, avg: 1800, max: 5000, conf: 0.83 },
    { k: 'שולחן עבודה', min: 300, avg: 900,  max: 2500, conf: 0.83 },
    { k: 'שולחן קפה', min: 150,  avg: 600,  max: 2000, conf: 0.83 },
    { k: 'שולחן',   min: 150,  avg: 900,  max: 5000, conf: 0.50 },
    { k: 'ארון בגדים', min: 800, avg: 2500, max: 7000, conf: 0.85 },
    { k: 'ארון',    min: 400,  avg: 2000, max: 7000, conf: 0.55 },
    { k: 'שידה',    min: 300,  avg: 800,  max: 2500, conf: 0.82 },
    { k: 'כוננית',  min: 200,  avg: 600,  max: 1800, conf: 0.82 },
    { k: 'מדף',     min: 100,  avg: 300,  max: 900,  conf: 0.78 },
    { k: 'כסא משרדי', min: 300, avg: 900,  max: 3000, conf: 0.83 },
    { k: 'כסא',     min: 100,  avg: 400,  max: 1500, conf: 0.55 },
    { k: 'מנורה',   min: 100,  avg: 400,  max: 1500, conf: 0.70 },
    { k: 'שטיח',    min: 200,  avg: 700,  max: 2500, conf: 0.75 },
    { k: 'וילון',   min: 100,  avg: 350,  max: 1200, conf: 0.75 },
  ],
  clothing: [
    { k: 'מעיל', min: 80,  avg: 300,  max: 900,  conf: 0.65 },
    { k: 'חליפה', min: 200, avg: 600,  max: 2000, conf: 0.70 },
    { k: 'שמלה', min: 50,  avg: 200,  max: 700,  conf: 0.65 },
    { k: 'ג׳ינס', min: 50,  avg: 180,  max: 500,  conf: 0.70 },
    { k: 'נעלי ספורט', min: 80, avg: 300, max: 800, conf: 0.72 },
    { k: 'נעליים', min: 60,  avg: 250,  max: 800,  conf: 0.65 },
    { k: 'תיק',   min: 80,  avg: 350,  max: 1500, conf: 0.65 },
    { k: 'שעון',  min: 200, avg: 800,  max: 5000, conf: 0.55 },
  ],
  sports: [
    { k: 'אופניים חשמליים', min: 2000, avg: 4500, max: 10000, conf: 0.80 },
    { k: 'אופניים הרים',    min: 800,  avg: 2500, max: 7000,  conf: 0.78 },
    { k: 'אופניים',         min: 400,  avg: 2000, max: 8000,  conf: 0.55 },
    { k: 'קורקינט חשמלי',   min: 1500, avg: 3000, max: 7000,  conf: 0.80 },
    { k: 'קורקינט',         min: 300,  avg: 1200, max: 4000,  conf: 0.65 },
    { k: 'הליכון',          min: 600,  avg: 2000, max: 6000,  conf: 0.80 },
    { k: 'אופניי כושר',     min: 500,  avg: 1800, max: 5000,  conf: 0.80 },
    { k: 'טנדם',            min: 600,  avg: 2000, max: 5000,  conf: 0.75 },
    { k: 'מכונת כושר',      min: 500,  avg: 2000, max: 7000,  conf: 0.70 },
    { k: 'כדורסל',          min: 80,   avg: 250,  max: 700,   conf: 0.80 },
    { k: 'כדורגל',          min: 60,   avg: 200,  max: 600,   conf: 0.80 },
    { k: 'מחבט טניס',       min: 100,  avg: 400,  max: 1500,  conf: 0.80 },
    { k: 'ציוד גלישה',      min: 500,  avg: 2000, max: 6000,  conf: 0.70 },
  ],
  services: [
    { k: 'שיעור', min: 60, avg: 150, max: 400, conf: 0.60 },
    { k: 'אינסטלציה', min: 200, avg: 500, max: 1500, conf: 0.65 },
    { k: 'חשמל', min: 200, avg: 500, max: 1500, conf: 0.65 },
    { k: 'עיצוב', min: 300, avg: 1200, max: 5000, conf: 0.55 },
  ],
  pets: [
    { k: 'כלב', min: 500, avg: 2500, max: 8000, conf: 0.55 },
    { k: 'חתול', min: 300, avg: 1500, max: 5000, conf: 0.55 },
    { k: 'גור', min: 800, avg: 3000, max: 10000, conf: 0.55 },
  ],
};

// Condition multipliers (base = "מצוין" / "מעולה")
const COND_MULT = {
  'חדש':         1.12,
  'מעולה':       1.00,
  'טוב':         0.82,
  'סביר':        0.65,
  'דורש תיקון': 0.40,
};

// Extract model year from title → depreciation factor for vehicles
// Assumes base prices are for ~2022; depreciate/appreciate relative to that
const getYearFactor = (title) => {
  const match = title.match(/\b(20\d{2})\b/);
  if (!match) return 1.0;
  const year   = parseInt(match[1]);
  const currentYear = 2026;
  const age    = currentYear - year;
  if (age <= 0)  return 1.10; // עתידי / חדש מהיצרן
  if (age === 1) return 1.02;
  if (age === 2) return 0.92;
  if (age === 3) return 0.82;
  if (age === 4) return 0.73;
  if (age === 5) return 0.65;
  if (age === 6) return 0.58;
  if (age === 7) return 0.52;
  if (age === 8) return 0.46;
  if (age === 9) return 0.41;
  return Math.max(0.20, 0.38 - (age - 10) * 0.03);
};

// Score-based keyword match: finds best entry in DB for the given title
const findBestMatch = (title, categoryEn) => {
  const entries = MARKET_DB[categoryEn] || [];
  const t = title.toLowerCase();

  let best = null;
  let bestScore = 0;

  for (const entry of entries) {
    const words = entry.k.toLowerCase().split(/\s+/);
    let hits = 0;
    for (const w of words) {
      if (t.includes(w)) hits++;
    }
    if (hits === 0) continue;

    // Score = (fraction of keyword words matched) × confidence × (more words matched = more specific)
    const score = (hits / words.length) * entry.conf * (hits / (words.length + 1) + 0.5);
    if (score > bestScore) {
      bestScore = score;
      best = { ...entry, score };
    }
  }

  return bestScore >= 0.3 ? best : null;
};

// AI Price Analysis
router.post('/analyze-price', async (req, res) => {
  try {
    const { title, category, price, condition } = req.body;

    if (!title || !price || !category) {
      return res.status(400).json({ error: 'נתונים חסרים' });
    }

    const userPrice = parseFloat(price);
    const condMult  = COND_MULT[condition] || 1.0;
    const yearFact  = category === 'vehicles' ? getYearFactor(title) : 1.0;

    const match = findBestMatch(title, category);

    let minPrice, avgPrice, maxPrice, confidence, matchedName;

    if (match) {
      // Real market data found → apply condition + year modifiers
      minPrice    = Math.round(match.min * condMult * yearFact);
      avgPrice    = Math.round(match.avg * condMult * yearFact);
      maxPrice    = Math.round(match.max * condMult * yearFact);
      confidence  = Math.round(match.conf * 94);
      matchedName = match.k;
    } else {
      // Fallback: category-wide rough estimate
      const fallbackRanges = {
        real_estate:  { min: 800000,  avg: 2000000, max: 4500000  },
        vehicles:     { min: 60000,   avg: 130000,  max: 280000   },
        electronics:  { min: 300,     avg: 2000,    max: 8000     },
        furniture:    { min: 200,     avg: 1500,    max: 6000     },
        clothing:     { min: 50,      avg: 250,     max: 1000     },
        sports:       { min: 100,     avg: 1200,    max: 5000     },
        pets:         { min: 200,     avg: 2000,    max: 8000     },
        services:     { min: 50,      avg: 400,     max: 2000     },
      };
      const fb  = fallbackRanges[category] || { min: 100, avg: 1000, max: 5000 };
      minPrice   = Math.round(fb.min * condMult);
      avgPrice   = Math.round(fb.avg * condMult);
      maxPrice   = Math.round(fb.max * condMult);
      confidence = 45;
      matchedName = null;
    }

    // Make sure min < avg < max after modifiers (clamp)
    minPrice = Math.min(minPrice, avgPrice * 0.95);
    maxPrice = Math.max(maxPrice, avgPrice * 1.05);

    // Year string for display
    const yearStr = (() => {
      if (category !== 'vehicles') return '';
      const m = title.match(/\b(20\d{2})\b/);
      return m ? ` (${m[1]})` : '';
    })();

    // Verdict based on where user price falls relative to real market range
    let verdict, verdict_en, explanation, color;
    const rangeSpan = maxPrice - minPrice;

    if (userPrice > maxPrice * 1.05) {
      verdict    = 'יקר מדי';
      verdict_en = 'expensive';
      explanation = `המחיר גבוה משמעותית מהמקסימום בשוק${yearStr} (₪${maxPrice.toLocaleString()}). כדי למכור מהר, מומלץ לרדת לכ-₪${avgPrice.toLocaleString()}.`;
      color = 'red';
    } else if (userPrice > avgPrice * 1.12) {
      verdict    = 'קצת יקר';
      verdict_en = 'slightly_expensive';
      explanation = `המחיר מעט גבוה מהממוצע בשוק${yearStr} (₪${avgPrice.toLocaleString()}). ניתן למכור, אך הנמכה קטנה תזרז מכירה.`;
      color = 'amber';
    } else if (userPrice >= minPrice * 0.95) {
      verdict    = 'מחיר הוגן';
      verdict_en = 'fair';
      explanation = `המחיר נמצא בטווח הנורמלי לשוק${yearStr}. ממוצע השוק: ₪${avgPrice.toLocaleString()}.`;
      color = 'emerald';
    } else {
      verdict    = 'עסקה טובה';
      verdict_en = 'good_deal';
      explanation = `המחיר נמוך מהממוצע בשוק${yearStr} (₪${avgPrice.toLocaleString()}). זו עסקה אטרקטיבית — צפוי ביקוש מהיר!`;
      color = 'blue';
    }

    // Position of user price on the min-max scale (0-100%)
    const positionPct = rangeSpan > 0
      ? Math.round(Math.min(120, Math.max(-10, (userPrice - minPrice) / rangeSpan * 100)))
      : 50;

    res.json({
      verdict,
      verdict_en,
      explanation,
      color,
      market: { min: minPrice, avg: avgPrice, max: maxPrice },
      matchedItem: matchedName,
      positionPct,
      recommendation: verdict_en === 'good_deal' ? 'raise' : verdict_en === 'expensive' ? 'lower' : 'keep',
      confidence,
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

// ── Deals — AI Mediator ───────────────────────────────────────────────────────

// POST /api/ai/deals — קונה+AI הגיעו להסכם, שלח למוכר לאישור
router.post('/deals', (req, res) => {
  const { listingId, listingTitle, listingPrice, agreedPrice, buyerName = 'קונה אנונימי', sellerContact } = req.body;
  if (!listingId || !agreedPrice) {
    return res.status(400).json({ error: 'נתונים חסרים' });
  }
  const deal = {
    id: String(dealCounter++),
    listingId: String(listingId),
    listingTitle: listingTitle || 'מוצר',
    listingPrice: Number(listingPrice),
    agreedPrice: Number(agreedPrice),
    buyerName,
    sellerContact: sellerContact || null, // hidden until approved
    status: 'pending', // pending | approved | rejected
    createdAt: new Date(),
  };
  deals.push(deal);
  res.status(201).json({ deal, message: 'ההצעה נשלחה למוכר לאישור!' });
});

// GET /api/ai/deals?listingId=X — המוכר מושך את ההצעות הממתינות
router.get('/deals', (req, res) => {
  const { listingId } = req.query;
  if (!listingId) return res.status(400).json({ error: 'listingId נדרש' });
  const listingDeals = deals
    .filter(d => d.listingId === String(listingId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ deals: listingDeals });
});

// GET /api/ai/deals/:id — בדיקת סטטוס עסקה ספציפית (קונה מחכה לתשובה)
// sellerContact מוחזר רק אם המוכר אישר — אחרת מוסתר
router.get('/deals/:id', (req, res) => {
  const deal = deals.find(d => d.id === req.params.id);
  if (!deal) return res.status(404).json({ error: 'עסקה לא נמצאה' });
  const { sellerContact, ...publicDeal } = deal;
  if (deal.status === 'approved') publicDeal.sellerContact = sellerContact;
  res.json({ deal: publicDeal });
});

// PATCH /api/ai/deals/:id — מוכר מאשר או דוחה
router.patch('/deals/:id', (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'סטטוס לא חוקי' });
  }
  const deal = deals.find(d => d.id === req.params.id);
  if (!deal) return res.status(404).json({ error: 'עסקה לא נמצאה' });
  deal.status = status;
  deal.updatedAt = new Date();
  res.json({ deal });
});

export default router;
