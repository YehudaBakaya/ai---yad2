import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Sparkles, ArrowRight } from 'lucide-react';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

export default function Login() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { syncUser } = useAuth();
  const { t } = useLanguage();
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
    if (!resetEmail) { setResetMsg(t('login.errEnterEmail')); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMsg(t('login.resetSent'));
    } catch {
      setResetMsg('⚠ ' + t('login.errNoAccount'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError(t('login.errFillAll')); return; }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      await syncUser();
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found'
        ? t('login.errWrongCreds')
        : t('login.errGeneral');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    try {
      const { user: firebaseUser } = await signInWithPopup(auth, googleProvider);
      await syncUser(firebaseUser);
      navigate(from, { replace: true });
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(`Google: ${err.code || err.message}`);
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 relative overflow-hidden">
      {/* Aurora background */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-600/6 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-violet-600/5 rounded-full blur-[80px] pointer-events-none" />

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
          <h1 className="text-xl font-bold text-white mb-1">{t('login.welcome')}</h1>
          <p className="text-gray-500 text-sm">{t('login.sub')}</p>
        </div>

        {/* Card */}
        <div className="glass-medium rounded-3xl p-7 shadow-2xl shadow-black/50">

          {resetMode ? (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="text-center mb-4">
                <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Mail size={22} className="text-emerald-400" />
                </div>
                <p className="text-white font-semibold">{t('login.resetTitle')}</p>
                <p className="text-gray-500 text-sm mt-1">{t('login.resetSub')}</p>
              </div>

              <InputField
                label={t('login.email')}
                icon={<Mail size={15} />}
                type="email"
                value={resetEmail}
                onChange={e => { setResetEmail(e.target.value); setResetMsg(''); }}
                placeholder="you@example.com"
              />

              {resetMsg && (
                <StatusBanner
                  text={resetMsg}
                  type={resetMsg.startsWith('✅') ? 'success' : 'error'}
                />
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-shimmer text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60 text-sm"
              >
                {loading ? <Spinner /> : t('login.sendReset')}
              </button>

              <button
                type="button"
                onClick={() => { setResetMode(false); setResetMsg(''); }}
                className="w-full text-center text-gray-500 hover:text-gray-300 text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowRight size={12} />
                {t('login.backToLogin')}
              </button>
            </form>
          ) : (
            <>
              {/* Google button */}
              <button
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white/95 hover:bg-white text-gray-800 font-semibold py-3 px-4 rounded-2xl transition-all hover:scale-[1.015] active:scale-[0.99] mb-5 shadow-lg shadow-black/20 disabled:opacity-60 text-sm"
              >
                {loading ? <Spinner dark /> : <GoogleIcon />}
                {t('login.google')}
              </button>

              <Divider label={t('login.orEmail')} />

              <form onSubmit={handleSubmit} className="space-y-4 mt-5">
                <InputField
                  label={t('login.email')}
                  icon={<Mail size={15} />}
                  type="email"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  placeholder="you@example.com"
                />

                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5">{t('login.password')}</label>
                  <div className="relative">
                    <Lock size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pr-10 pl-10 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
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
                </div>

                {error && <StatusBanner text={`⚠ ${error}`} type="error" />}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-shimmer text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:scale-[1.015] active:scale-[0.99] transition-transform disabled:opacity-60 text-sm mt-1"
                >
                  {loading ? <Spinner /> : <><Sparkles size={15} /> {t('login.btn')}</>}
                </button>

                <button
                  type="button"
                  onClick={() => setResetMode(true)}
                  className="w-full text-center text-gray-600 hover:text-gray-400 text-xs transition-colors pt-1"
                >
                  {t('login.forgot')}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          {t('login.noAccount')}{' '}
          <Link to="/register" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
            {t('login.register')}
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ─── Shared sub-components ─── */

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
          className={`w-full bg-white/[0.04] border rounded-xl pr-10 pl-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-emerald-500/50 transition-all ${error ? 'border-rose-500/50' : 'border-white/[0.08]'}`}
          style={{ background: 'rgba(255,255,255,0.04)', boxShadow: 'none' }}
        />
      </div>
      {error && <p className="text-rose-400 text-[11px] mt-1">⚠ {error}</p>}
    </div>
  );
}

function StatusBanner({ text, type }) {
  return (
    <div className={`rounded-xl px-4 py-2.5 text-sm border ${
      type === 'success'
        ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
        : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
    }`}>
      {text}
    </div>
  );
}

function Divider({ label }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-white/[0.06]" />
      <span className="text-[11px] text-gray-600 font-medium">{label}</span>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
  );
}

function Spinner({ dark }) {
  return <span className={`w-4 h-4 border-2 rounded-full animate-spin ${dark ? 'border-gray-300 border-t-gray-700' : 'border-white/30 border-t-white'}`} />;
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
