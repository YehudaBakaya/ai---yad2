import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, MapPin, Tag, FileText, ImagePlus, Sparkles } from 'lucide-react';
import SmartDescription from '../components/SmartDescription';
import { listingsAPI } from '../services/api';

const categories = [
  { id: 'real_estate', name: 'נדל"ן',      icon: '🏠' },
  { id: 'vehicles',   name: 'רכבים',        icon: '🚗' },
  { id: 'electronics',name: 'אלקטרוניקה',  icon: '📱' },
  { id: 'furniture',  name: 'ריהוט',        icon: '🛋️' },
  { id: 'clothing',   name: 'ביגוד',        icon: '👕' },
  { id: 'sports',     name: 'ספורט',        icon: '⚽' },
  { id: 'pets',       name: 'חיות מחמד',   icon: '🐱' },
  { id: 'services',   name: 'שירותים',      icon: '🔧' },
];

const conditions = [
  { value: 'חדש',          color: 'border-emerald-500 bg-emerald-500/20 text-emerald-300' },
  { value: 'מעולה',        color: 'border-blue-500 bg-blue-500/20 text-blue-300' },
  { value: 'טוב',          color: 'border-amber-500 bg-amber-500/20 text-amber-300' },
  { value: 'סביר',         color: 'border-orange-500 bg-orange-500/20 text-orange-300' },
  { value: 'דורש תיקון',  color: 'border-red-500 bg-red-500/20 text-red-300' },
];

const STEPS = [
  { label: 'בסיסי',  icon: <Tag size={16} /> },
  { label: 'פרטים', icon: <MapPin size={16} /> },
  { label: 'תיאור',  icon: <FileText size={16} /> },
];

export default function CreateListing() {
  const navigate  = useNavigate();
  const [step, setStep]     = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors]   = useState({});
  const [formData, setFormData] = useState({
    title: '', category: '', price: '',
    location: '', condition: 'טוב', description: '',
  });

  const set = (key, val) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validateStep = () => {
    const errs = {};
    if (step === 0) {
      if (!formData.title.trim())    errs.title    = 'שדה חובה';
      if (!formData.category)        errs.category = 'בחר קטגוריה';
      if (formData.price === '')     errs.price    = 'שדה חובה';
    }
    if (step === 1) {
      if (!formData.location.trim()) errs.location = 'שדה חובה';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => { if (validateStep()) setStep((s) => s + 1); };
  const handleBack = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setLoading(true);
    try {
      await listingsAPI.create({ ...formData, price: parseFloat(formData.price) });
      setSuccess(true);
      setTimeout(() => navigate('/listings'), 2000);
    } catch {
      setErrors({ submit: 'שגיאה בפרסום. נסה שוב.' });
    } finally {
      setLoading(false);
    }
  };

  /* ── Success screen ── */
  if (success) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center animate-bounceIn">
          <div className="w-20 h-20 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5">
            <Check size={40} className="text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">המודעה פורסמה! 🎉</h2>
          <p className="text-gray-400">מעביר אותך לדף המודעות...</p>
        </div>
      </div>
    );
  }

  const selectedCat = categories.find((c) => c.id === formData.category);

  return (
    <div className="min-h-screen bg-slate-900 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10 animate-fadeIn">
          <h1 className="text-3xl font-extrabold text-white mb-1">פרסם מודעה חדשה</h1>
          <p className="text-gray-400 text-sm">מלא את הפרטים ותן ל-AI לעזור לך</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {STEPS.map((s, i) => (
            <React.Fragment key={i}>
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300
                  ${i === step   ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105' :
                    i < step     ? 'bg-emerald-600/30 text-emerald-300 cursor-pointer hover:bg-emerald-600/50' :
                                   'bg-slate-800 text-gray-500 cursor-default'}`}
              >
                {i < step ? <Check size={14} /> : s.icon}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-10 mx-1 transition-all duration-500 ${i < step ? 'bg-emerald-500' : 'bg-slate-700'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl shadow-black/30 animate-fadeIn">

          {/* ── STEP 0: Basic Info ── */}
          {step === 0 && (
            <div className="p-7 space-y-6">
              <StepTitle icon="✏️" title="פרטים בסיסיים" sub="כותרת, קטגוריה ומחיר" />

              {/* Title */}
              <Field label="כותרת המודעה *" error={errors.title}>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => set('title', e.target.value)}
                  placeholder='לדוגמה: iPhone 15 Pro Max כחול'
                  className={inputCls(errors.title)}
                />
              </Field>

              {/* Category tiles */}
              <Field label="קטגוריה *" error={errors.category}>
                <div className="grid grid-cols-4 gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => set('category', cat.id)}
                      className={`relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-medium transition-all duration-200
                        ${formData.category === cat.id
                          ? 'border-blue-500 bg-blue-500/20 text-blue-300 scale-105 shadow-md shadow-blue-500/20'
                          : 'border-slate-600 bg-slate-700/60 text-gray-400 hover:border-slate-500 hover:text-gray-200'}`}
                    >
                      <span className="text-2xl">{cat.icon}</span>
                      <span>{cat.name}</span>
                      {formData.category === cat.id && (
                        <span className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <Check size={10} className="text-white" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Price */}
              <Field label="מחיר (₪) *" error={errors.price}>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₪</span>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => set('price', e.target.value)}
                    placeholder="0 = חינם"
                    className={`${inputCls(errors.price)} pr-8`}
                  />
                </div>
                {formData.price === '0' && (
                  <p className="text-emerald-400 text-xs mt-1">✅ המודעה תסומן כחינם</p>
                )}
              </Field>
            </div>
          )}

          {/* ── STEP 1: Details ── */}
          {step === 1 && (
            <div className="p-7 space-y-6">
              <StepTitle icon="📍" title="פרטים נוספים" sub="מיקום ומצב הפריט" />

              <Field label="מיקום *" error={errors.location}>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => set('location', e.target.value)}
                  placeholder="עיר או אזור"
                  className={inputCls(errors.location)}
                />
              </Field>

              <Field label="מצב הפריט">
                <div className="flex flex-wrap gap-2">
                  {conditions.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => set('condition', c.value)}
                      className={`px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200
                        ${formData.condition === c.value
                          ? `${c.color} scale-105 shadow-md`
                          : 'border-slate-600 bg-slate-700 text-gray-400 hover:border-slate-500 hover:text-gray-200'}`}
                    >
                      {formData.condition === c.value && '✓ '}{c.value}
                    </button>
                  ))}
                </div>
              </Field>

              {/* Mini preview */}
              {formData.title && (
                <div className="bg-slate-700/60 border border-slate-600 rounded-xl p-4">
                  <p className="text-xs text-gray-400 mb-2 font-semibold">תצוגה מקדימה</p>
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">{selectedCat?.icon || '📦'}</div>
                    <div>
                      <p className="text-white font-bold text-sm">{formData.title}</p>
                      <p className="text-blue-400 font-bold">
                        {formData.price === '' ? '—' : formData.price === '0' ? 'חינם' : `₪${Number(formData.price).toLocaleString()}`}
                      </p>
                      <div className="flex gap-2 mt-1 text-xs text-gray-400">
                        {formData.location && <span>📍 {formData.location}</span>}
                        <span>• {formData.condition}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 2: Description ── */}
          {step === 2 && (
            <div className="p-7 space-y-5">
              <StepTitle icon="✨" title="תיאור המודעה" sub="כתוב בעצמך או תן ל-AI לכתוב" />

              <Field label="תיאור">
                <textarea
                  value={formData.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="תאר את הפריט בפירוט — מצב, גיל, סיבת מכירה..."
                  className={`${inputCls()} resize-none h-36`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.description.length}/500 תווים
                </p>
              </Field>

              {/* AI Generator */}
              {formData.title && formData.category ? (
                <div className="border border-purple-500/30 bg-purple-500/5 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-purple-400" />
                    <span className="text-sm font-semibold text-purple-300">יצרן תיאור AI</span>
                  </div>
                  <SmartDescription
                    title={formData.title}
                    category={formData.category}
                    onDescriptionGenerated={(desc) => set('description', desc)}
                  />
                </div>
              ) : (
                <div className="border border-slate-600 rounded-xl p-4 text-center text-gray-500 text-sm">
                  מלא כותרת וקטגוריה בשלב הראשון כדי להשתמש ב-AI
                </div>
              )}

              {/* Image placeholder */}
              <div className="border-2 border-dashed border-slate-600 hover:border-blue-500/50 rounded-xl p-6 text-center transition-colors cursor-pointer group">
                <ImagePlus size={28} className="text-gray-500 group-hover:text-blue-400 mx-auto mb-2 transition-colors" />
                <p className="text-gray-400 text-sm">הוסף תמונות (בקרוב)</p>
                <p className="text-gray-600 text-xs mt-1">ניתן להוסיף לאחר פרסום</p>
              </div>

              {errors.submit && (
                <p className="text-red-400 text-sm text-center">{errors.submit}</p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="px-7 pb-7 flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-5 rounded-xl transition-all hover:scale-[1.02] active:scale-95"
              >
                <ChevronRight size={18} />
                חזור
              </button>
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 btn-shimmer text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-transform"
              >
                המשך
                <ChevronLeft size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    מפרסם...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    פרסם מודעה!
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Cancel */}
        <button
          onClick={() => navigate('/')}
          className="mt-4 w-full text-gray-500 hover:text-gray-300 text-sm py-2 transition-colors"
        >
          ביטול — חזור לדף הבית
        </button>
      </div>
    </div>
  );
}

/* ── helpers ── */

function StepTitle({ icon, title, sub }) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-700 pb-5">
      <span className="text-3xl">{icon}</span>
      <div>
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <p className="text-gray-400 text-sm">{sub}</p>
      </div>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-gray-300 mb-2">
          {label}
        </label>
      )}
      {children}
      {error && <p className="text-red-400 text-xs mt-1.5">⚠ {error}</p>}
    </div>
  );
}

const inputCls = (error) =>
  `w-full bg-slate-700 border ${error ? 'border-red-500' : 'border-slate-600'} rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all text-sm`;
