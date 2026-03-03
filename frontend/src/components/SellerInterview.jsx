import { useState } from 'react';
import { Bot, Check, ChevronLeft, SkipForward } from 'lucide-react';

const QUESTIONS = [
  {
    key: 'minPrice',
    question: 'מה המחיר המינימלי שתסכים לו?',
    sub: 'הסוכן לא ירד מתחת למחיר זה בשום מקרה',
    type: 'number',
    placeholder: 'לדוגמה: 4500',
    required: true,
  },
  {
    key: 'flexibility',
    question: 'כמה אתה גמיש במחיר?',
    sub: 'עוזר לסוכן לקבוע את אסטרטגיית המשא ומתן',
    type: 'choice',
    choices: ['לא גמיש — זה המחיר', 'קצת גמיש (עד 10%)', 'גמיש (עד 20%)', 'מאוד גמיש (30%+)'],
  },
  {
    key: 'reason',
    question: 'מה סיבת המכירה?',
    sub: 'לא חובה — מסייע לסוכן לשכנע קונים',
    type: 'text',
    placeholder: 'לדוגמה: קניתי חדש, מעבר דירה...',
    required: false,
  },
  {
    key: 'terms',
    question: 'יש תנאים מיוחדים לעסקה?',
    sub: 'לא חובה',
    type: 'text',
    placeholder: 'לדוגמה: לא כולל משלוח, איסוף עצמי בלבד...',
    required: false,
  },
];

export default function SellerInterview({ listingPrice, onComplete, onSkip }) {
  const [qIndex, setQIndex]   = useState(0);
  const [answers, setAnswers] = useState({});
  const [inputVal, setInputVal] = useState('');
  const [done, setDone]        = useState(false);

  const currentQ = QUESTIONS[qIndex];

  // Thread: previously answered Q&A pairs
  const thread = QUESTIONS.slice(0, qIndex).map((q) => ({
    question: q.question,
    answer:   answers[q.key] ?? '—',
  }));

  const submitAnswer = (value) => {
    const trimmed = String(value).trim();
    if (currentQ.required && !trimmed) return;

    const next = { ...answers, [currentQ.key]: trimmed || null };
    setAnswers(next);
    setInputVal('');

    if (qIndex < QUESTIONS.length - 1) {
      setQIndex(qIndex + 1);
    } else {
      setDone(true);
      onComplete({
        minPrice:    parseFloat(next.minPrice) || null,
        flexibility: next.flexibility || null,
        reason:      next.reason || null,
        terms:       next.terms || null,
      });
    }
  };

  /* ── Done screen ── */
  if (done) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-2xl p-5 text-center animate-bounceIn">
        <div className="w-12 h-12 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
          <Check size={22} className="text-emerald-400" />
        </div>
        <h3 className="font-bold text-white mb-1">הסוכן מוכן לפעולה! 🤖</h3>
        <p className="text-gray-400 text-sm">הסוכן יפעל לפי ההגדרות שסיפקת</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Previously answered — read-only thread */}
      {thread.map((item, i) => (
        <div key={i} className="space-y-2">
          <AIBubble text={item.question} />
          <UserBubble text={item.answer} />
        </div>
      ))}

      {/* Current question */}
      <AIBubble text={currentQ.question} sub={currentQ.sub} />

      {/* Answer input */}
      {currentQ.type === 'choice' ? (
        <div className="flex flex-wrap gap-2 pr-9">
          {currentQ.choices.map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => submitAnswer(choice)}
              className="px-4 py-2 rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-300 text-sm font-medium hover:bg-purple-500/20 hover:border-purple-500/70 transition-all hover:scale-105 active:scale-95"
            >
              {choice}
            </button>
          ))}
        </div>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); submitAnswer(inputVal); }}
          className="flex gap-2 pr-9"
        >
          <input
            type={currentQ.type}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={currentQ.placeholder}
            autoFocus
            className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 text-sm transition-all"
          />
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 text-sm"
          >
            אישור
          </button>
          {!currentQ.required && (
            <button
              type="button"
              onClick={() => submitAnswer('')}
              className="bg-slate-700 hover:bg-slate-600 text-gray-400 hover:text-white px-3 py-2.5 rounded-xl transition-all text-sm"
              title="דלג"
            >
              דלג
            </button>
          )}
        </form>
      )}

      {/* Progress dots */}
      <div className="flex items-center justify-between px-1 pt-1">
        <div className="flex gap-1.5">
          {QUESTIONS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i < qIndex  ? 'w-5 h-2 bg-emerald-500' :
                i === qIndex ? 'w-5 h-2 bg-purple-500' :
                               'w-2 h-2 bg-slate-600'
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={onSkip}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          <SkipForward size={12} />
          דלג על ראיון
        </button>
      </div>
    </div>
  );
}

function AIBubble({ text, sub }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
        <Bot size={13} className="text-white" />
      </div>
      <div className="bg-slate-700/80 border border-slate-600 rounded-2xl rounded-tl-none px-3.5 py-2.5 max-w-xs">
        <p className="text-sm text-gray-100 leading-relaxed">{text}</p>
        {sub && <p className="text-[11px] text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function UserBubble({ text }) {
  return (
    <div className="flex justify-end">
      <div className="bg-purple-600/80 border border-purple-500/40 rounded-2xl rounded-tr-none px-3.5 py-2 max-w-xs">
        <p className="text-sm text-white">{text}</p>
      </div>
    </div>
  );
}
