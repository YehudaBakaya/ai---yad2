import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, Sparkles } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { saveUserProfile } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { syncUser } = useAuth();

  const [form, setForm]     = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = 'שדה חובה';
    if (!form.email)          e.email   = 'שדה חובה';
    if (form.password.length < 6) e.password = 'לפחות 6 תווים';
    if (form.password !== form.confirm) e.confirm = 'הסיסמאות אינן תואמות';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(cred.user, { displayName: form.name.trim() });
      await saveUserProfile(cred.user.uid, {
        name:  form.name.trim(),
        email: form.email.toLowerCase(),
        phone: form.phone.trim() || null,
      });
      await syncUser();
      navigate('/');
    } catch (err) {
      const msg = err.code === 'auth/email-already-in-use'
        ? 'האימייל כבר רשום במערכת'
        : 'שגיאה בהרשמה';
      setErrors({ submit: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const { user: firebaseUser } = await signInWithPopup(auth, googleProvider);
      await syncUser(firebaseUser);
      navigate('/');
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrors({ submit: `שגיאת Google: ${err.code || err.message}` });
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md animate-fadeIn">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white font-extrabold text-lg">Y</span>
            </div>
            <span className="text-2xl font-extrabold text-white">יד<span className="text-blue-400">2</span> <span className="text-purple-400">AI</span></span>
          </div>
          <h1 className="text-xl font-bold text-white mb-1">צור חשבון חדש</h1>
          <p className="text-gray-400 text-sm">הצטרף לאלפי משתמשים שכבר נהנים</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-7 shadow-xl shadow-black/30">

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-4 rounded-xl transition-all hover:scale-[1.02] active:scale-95 mb-5 shadow-sm disabled:opacity-60"
          >
            <GoogleIcon />
            הרשם עם Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-xs text-gray-500">או עם אימייל</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            <FormField label="שם מלא" error={errors.name}>
              <div className="relative">
                <User size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="ישראל ישראלי"
                  className={inputCls(errors.name)} />
              </div>
            </FormField>

            <FormField label="אימייל" error={errors.email}>
              <div className="relative">
                <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  placeholder="you@example.com"
                  className={inputCls(errors.email)} />
              </div>
            </FormField>

            <FormField label="טלפון (לפרטי התקשרות עם קונים)">
              <div className="relative">
                <Phone size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="050-0000000"
                  className={inputCls()} />
              </div>
            </FormField>

            <FormField label="סיסמה" error={errors.password}>
              <div className="relative">
                <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPw ? 'text' : 'password'} value={form.password}
                  onChange={e => set('password', e.target.value)} placeholder="לפחות 6 תווים"
                  className={`${inputCls(errors.password)} pl-10`} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </FormField>

            <FormField label="אימות סיסמה" error={errors.confirm}>
              <div className="relative">
                <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPw ? 'text' : 'password'} value={form.confirm}
                  onChange={e => set('confirm', e.target.value)} placeholder="הכנס שוב את הסיסמה"
                  className={inputCls(errors.confirm)} />
              </div>
            </FormField>

            {errors.submit && (
              <div className="bg-red-500/10 border border-red-500/40 rounded-xl px-4 py-2.5 text-red-400 text-sm">
                ⚠ {errors.submit}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> נרשם...</>
              ) : (
                <><Sparkles size={16} /> צור חשבון</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-400 text-sm mt-5">
          כבר יש לך חשבון?{' '}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            התחבר כאן
          </Link>
        </p>
      </div>
    </div>
  );
}

function FormField({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">⚠ {error}</p>}
    </div>
  );
}

const inputCls = (err) =>
  `w-full bg-slate-700 border ${err ? 'border-red-500' : 'border-slate-600'} rounded-xl pr-10 pl-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all`;

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
      <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
      <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z"/>
      <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
    </svg>
  );
}
