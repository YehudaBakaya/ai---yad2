import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, Sparkles } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { saveUserProfile } from '../services/firestoreService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function Register() {
  const navigate = useNavigate();
  const { syncUser } = useAuth();
  const { t } = useLanguage();

  const [form, setForm]     = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim())         e.name     = t('reg.errRequired');
    if (!form.email)               e.email    = t('reg.errRequired');
    if (form.password.length < 6)  e.password = t('reg.errMinPw');
    if (form.password !== form.confirm) e.confirm = t('reg.errMismatch');
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
      await syncUser(cred.user, form.phone.trim() || null);
      navigate('/');
    } catch (err) {
      const firebaseErrors = {
        'auth/email-already-in-use':    t('reg.errEmailInUse'),
        'auth/weak-password':           'הסיסמה חלשה מדי (מינימום 6 תווים)',
        'auth/invalid-email':           'כתובת אימייל לא תקינה',
        'auth/operation-not-allowed':   'הרשמה באימייל לא מופעלת — יש להפעיל ב-Firebase Console',
        'auth/too-many-requests':       'יותר מדי ניסיונות, נסה שוב מאוחר יותר',
      };
      const msg = firebaseErrors[err.code] || `${t('reg.errGeneral')} (${err.code || err.message})`;
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
        setErrors({ submit: `Google: ${err.code || err.message}` });
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Aurora background */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-600/6 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-violet-600/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md animate-fadeIn relative z-10">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
            <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-all group-hover:scale-105 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
              <span className="text-white font-extrabold text-[10px] tracking-tight relative z-10">S2B</span>
            </div>
            <span className="text-2xl font-extrabold text-white">
              S<span className="text-emerald-400">2</span>B{' '}
              <span className="text-gradient-emerald">AI</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold text-white mb-1">{t('reg.title')}</h1>
          <p className="text-gray-500 text-sm">{t('reg.sub')}</p>
        </div>

        {/* Card */}
        <div className="glass-medium rounded-3xl p-7 shadow-2xl shadow-black/50">

          {/* Google button */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white/95 hover:bg-white text-gray-800 font-semibold py-3 px-4 rounded-2xl transition-all hover:scale-[1.015] active:scale-[0.99] mb-5 shadow-lg shadow-black/20 disabled:opacity-60 text-sm"
          >
            <GoogleIcon />
            {t('reg.google')}
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <span className="text-[11px] text-gray-600 font-medium">{t('reg.orEmail')}</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">

            <InputField label={t('reg.name')} icon={<User size={15} />} type="text" value={form.name}
              onChange={e => set('name', e.target.value)} placeholder="ישראל ישראלי" error={errors.name} />

            <InputField label={t('login.email')} icon={<Mail size={15} />} type="email" value={form.email}
              onChange={e => set('email', e.target.value)} placeholder="you@example.com" error={errors.email} />

            <InputField label={t('reg.phone')} icon={<Phone size={15} />} type="tel" value={form.phone}
              onChange={e => set('phone', e.target.value)} placeholder="050-0000000" />

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">{t('reg.password')}</label>
              <div className="relative">
                <Lock size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="••••••••"
                  className={`w-full border rounded-xl pr-10 pl-10 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-emerald-500/50 transition-all ${errors.password ? 'border-rose-500/50' : 'border-white/[0.08]'}`}
                  style={{ background: 'rgba(255,255,255,0.04)', boxShadow: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <p className="text-rose-400 text-[11px] mt-1">⚠ {errors.password}</p>}
            </div>

            {/* Confirm */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">{t('reg.confirm')}</label>
              <div className="relative">
                <Lock size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.confirm}
                  onChange={e => set('confirm', e.target.value)}
                  placeholder="••••••••"
                  className={`w-full border rounded-xl pr-10 pl-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-emerald-500/50 transition-all ${errors.confirm ? 'border-rose-500/50' : 'border-white/[0.08]'}`}
                  style={{ background: 'rgba(255,255,255,0.04)', boxShadow: 'none' }}
                />
              </div>
              {errors.confirm && <p className="text-rose-400 text-[11px] mt-1">⚠ {errors.confirm}</p>}
            </div>

            {errors.submit && (
              <div className="bg-rose-500/10 border border-rose-500/25 rounded-xl px-4 py-2.5 text-rose-400 text-sm">
                ⚠ {errors.submit}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-shimmer text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-[1.015] active:scale-[0.99] transition-transform disabled:opacity-60 text-sm mt-1"
            >
              {loading
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('reg.loading')}</>
                : <><Sparkles size={15} /> {t('reg.btn')}</>
              }
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          {t('reg.haveAccount')}{' '}
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
            {t('reg.loginHere')}
          </Link>
        </p>
      </div>
    </div>
  );
}

function InputField({ label, icon, type, value, onChange, placeholder, error }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-400 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500">{icon}</span>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full border rounded-xl pr-10 pl-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-emerald-500/50 transition-all ${error ? 'border-rose-500/50' : 'border-white/[0.08]'}`}
          style={{ background: 'rgba(255,255,255,0.04)', boxShadow: 'none' }}
        />
      </div>
      {error && <p className="text-rose-400 text-[11px] mt-1">⚠ {error}</p>}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
      <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
      <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z"/>
      <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
    </svg>
  );
}
