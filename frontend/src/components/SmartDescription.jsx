import React, { useState } from 'react';
import { Zap, Copy, Check, X, Sparkles } from 'lucide-react';
import { aiAPI } from '../services/api';

export default function SmartDescription({ title, category, onDescriptionGenerated }) {
  const [isOpen, setIsOpen]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState('');
  const [copied, setCopied]   = useState(false);
  const [formData, setFormData] = useState({ condition: 'טוב', features: '' });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await aiAPI.generateDescription({
        title, category,
        condition: formData.condition,
        details: formData.features,
        price: 0,
      });
      setGenerated(res.data.description);
    } catch {
      setGenerated('שגיאה בייצור התיאור. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  const handleUse = () => {
    if (!generated) return;
    onDescriptionGenerated(generated);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setIsOpen(false);
      setGenerated('');
    }, 800);
  };

  const close = () => { setIsOpen(false); setGenerated(''); };

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-2.5 px-4 rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-purple-500/20 text-sm"
      >
        <Zap size={16} />
        יצור תיאור עם AI
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl shadow-black/50 animate-slideUp overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 bg-gradient-to-r from-purple-600/10 to-blue-600/10">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-purple-400" />
                <h3 className="font-bold text-white">יצרן תיאור AI</h3>
              </div>
              <button onClick={close} className="text-gray-400 hover:text-white hover:bg-slate-700 p-1.5 rounded-lg transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              {!generated ? (
                /* Form */
                <div className="space-y-4">
                  {/* Title preview */}
                  <div className="bg-slate-700/60 rounded-xl px-4 py-3">
                    <p className="text-xs text-gray-400 mb-0.5">כותרת</p>
                    <p className="text-white font-medium text-sm">{title}</p>
                  </div>

                  {/* Condition */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">מצב הפריט</label>
                    <div className="flex flex-wrap gap-2">
                      {['חדש', 'מעולה', 'טוב', 'סביר', 'דורש תיקון'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setFormData({ ...formData, condition: c })}
                          className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all
                            ${formData.condition === c
                              ? 'bg-purple-600 border-purple-500 text-white scale-105'
                              : 'border-slate-600 bg-slate-700 text-gray-400 hover:border-slate-500 hover:text-gray-200'}`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">תכונות מיוחדות (אופציונלי)</label>
                    <textarea
                      value={formData.features}
                      onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                      placeholder="לדוגמה: מעלית, חניה, אחריות, פחות מ-10,000 ק״מ..."
                      className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 resize-none h-24 transition-all"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 shadow-md"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        יוצר תיאור...
                      </>
                    ) : (
                      <>
                        <Zap size={16} />
                        יצור תיאור
                      </>
                    )}
                  </button>
                </div>
              ) : (
                /* Result */
                <div className="space-y-4 animate-fadeIn">
                  <div className="bg-slate-700/60 border border-slate-600 rounded-xl p-4 max-h-56 overflow-y-auto">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles size={14} className="text-purple-400" />
                      <span className="text-xs font-semibold text-purple-300">תיאור שנוצר ע״י AI</span>
                    </div>
                    <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{generated}</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleUse}
                      className={`flex-1 font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 text-sm
                        ${copied
                          ? 'bg-emerald-600 text-white'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/20'}`}
                    >
                      {copied ? <><Check size={16} /> הועתק!</> : <><Copy size={16} /> השתמש בתיאור</>}
                    </button>
                    <button
                      type="button"
                      onClick={() => setGenerated('')}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 rounded-xl transition-all hover:scale-[1.02] active:scale-95 text-sm"
                    >
                      נסה שוב
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
