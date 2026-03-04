import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Sparkles } from 'lucide-react';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { syncUser } = useAuth();
  const from = location.state?.from?.pathname || '/';

  const [form, setForm]     = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const [resetMode, setResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMsg, setResetMsg]     = useState('');

  const set = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(''); };

  const handleReset = async (e) => {
    e.preventDefault();
    if (!resetEmail) { setResetMsg('הכנס אימייל'); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMsg('✅ מייל לאיפוס נשלח — בדוק את תיבת הדואר שלך');
    } catch {
      setResetMsg('⚠ לא נמצא חשבון עם אימייל זה');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('מלא את כל השדות'); return; }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      await syncUser();
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found'
        ? 'אימייל או סיסמה שגויים'
        : 'שגיאה בהתחברות';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      await syncUser();
      navigate(from, { replace: true });
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(`שגיאת Google: ${err.code || err.message}`);
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fadeIn">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-white font-extrabold text-lg">Y</span>
            </div>
            <span className="text-2xl font-extrabold text-white">יד<span className="text-blue-400">2</span> <span className="text-purple-400">AI</span></span>
          </div>
          <h1 className="text-xl font-bold text-white mb-1">ברוך הבא!</h1>
          <p className="text-gray-400 text-sm">התחבר לחשבון שלך</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-7 shadow-xl shadow-black/30">

          {/* Password Reset Mode */}
          {resetMode ? (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-white font-semibold mb-1">איפוס סיסמה</p>
                <p className="text-gray-400 text-sm">נשלח אליך מייל עם הוראות לאיפוס</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">אימייל</label>
                <div className="relative">
                  <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={e => { setResetEmail(e.target.value); setResetMsg(''); }}
                    placeholder="you@example.com"
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl pr-10 pl-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500 transition-all"
                  />
                </div>
              </div>
              {resetMsg && (
                <div className={`rounded-xl px-4 py-2.5 text-sm ${resetMsg.startsWith('✅') ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-400' : 'bg-red-500/10 border border-red-500/40 text-red-400'}`}>
                  {resetMsg}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-shimmer text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> שולח...</> : 'שלח מייל לאיפוס'}
              </button>
              <button
                type="button"
                onClick={() => { setResetMode(false); setResetMsg(''); }}
                className="w-full text-gray-400 hover:text-white text-sm transition-colors"
              >
                חזור להתחברות
              </button>
            </form>
          ) : (
          <>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-4 rounded-xl transition-all hover:scale-[1.02] active:scale-95 mb-5 shadow-sm disabled:opacity-60"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
              : <GoogleIcon />}
            התחבר עם Google
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-xs text-gray-500">או עם אימייל</span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">אימייל</label>
              <div className="relative">
                <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl pr-10 pl-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">סיסמה</label>
              <div className="relative">
                <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl pr-10 pl-10 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/40 rounded-xl px-4 py-2.5 text-red-400 text-sm">
                ⚠ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-shimmer text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-60"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> מתחבר...</>
              ) : (
                <><Sparkles size={16} /> התחבר</>
              )}
            </button>

            <button
              type="button"
              onClick={() => setResetMode(true)}
              className="w-full text-center text-gray-500 hover:text-gray-300 text-xs transition-colors mt-1"
            >
              שכחתי סיסמה
            </button>
          </form>
          </>
          )}
        </div>

        <p className="text-center text-gray-400 text-sm mt-5">
          אין לך חשבון?{' '}
          <Link to="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
            הרשם עכשיו
          </Link>
        </p>
      </div>
    </div>
  );
}

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
