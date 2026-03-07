import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Save, Camera, ArrowRight, UserCircle } from 'lucide-react';
import { updateProfile } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { saveUserProfile } from '../services/firestoreService';
import { authAPI, listingsAPI } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

export default function Profile() {
  const { user, syncUser, updateUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const [form, setForm] = useState({
    name:  user?.name  || '',
    phone: user?.phone || '',
  });
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [avatarBase64, setAvatarBase64]   = useState(null); // base64 of new image
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]    = useState('');

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target.result);
      setAvatarBase64(ev.target.result); // keep base64 for save
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError(t('profile.errName')); return; }
    setSaving(true);
    setError('');
    try {
      // Avatar: use new base64 if selected, otherwise keep existing
      const avatarData = avatarBase64 || user?.avatar || null;

      // Save to MongoDB (name, phone, avatar as base64)
      await authAPI.updateProfile({
        uid:    user.id,
        name:   form.name.trim(),
        phone:  form.phone.trim() || null,
        avatar: avatarData,
      });

      // Update Firebase Auth displayName
      await updateProfile(auth.currentUser, {
        displayName: form.name.trim(),
      });

      // Update Firestore (name + phone only, no avatar)
      await saveUserProfile(user.id, {
        name:  form.name.trim(),
        phone: form.phone.trim() || null,
        email: user.email,
      });

      // Update AuthContext immediately
      updateUser({ name: form.name.trim(), phone: form.phone.trim() || null, avatar: avatarData });

      // Sync all user listings with new seller info (fire-and-forget)
      if (user?.id) {
        listingsAPI.updateSellerInfo(user.id, {
          name:  form.name.trim(),
          phone: form.phone.trim() || null,
          email: user.email,
          image: avatarData || null,
        }).catch(() => {});
      }

      setAvatarBase64(null); // reset — already saved
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(t('profile.errSave'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-10 px-4">
      <div className="max-w-lg mx-auto animate-fadeIn">

        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6 transition-colors group"
        >
          <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          {t('profile.back')}
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center gap-3 justify-center mb-1">
            <div className="w-1 h-7 bg-gradient-to-b from-violet-500 to-cyan-500 rounded-full" />
            <h1 className="text-2xl font-extrabold text-white">{t('profile.title')}</h1>
          </div>
          <p className="text-gray-400 text-sm">{t('profile.sub')}</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-7 shadow-xl shadow-black/30 space-y-6">

          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-24 h-24 rounded-full ring-4 ring-violet-500/30 overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle size={52} className="text-white/70" />
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -left-1 w-8 h-8 bg-violet-600 hover:bg-violet-500 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
              >
                <Camera size={14} className="text-white" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div className="text-center">
              <p className="text-white font-bold">{user?.name}</p>
              <p className="text-gray-400 text-xs">{user?.email}</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-700" />

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">{t('profile.name')}</label>
            <div className="relative">
              <User size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={form.name}
                onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setError(''); }}
                placeholder={t('profile.name')}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl pr-10 pl-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">{t('profile.email')}</label>
            <div className="relative">
              <Mail size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-slate-700/50 border border-slate-700 rounded-xl pr-10 pl-4 py-2.5 text-gray-500 text-sm cursor-not-allowed"
              />
            </div>
            <p className="text-gray-600 text-xs mt-1">{t('profile.emailNote')}</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">{t('profile.phone')}</label>
            <div className="relative">
              <Phone size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="050-0000000"
                className="w-full bg-slate-700 border border-slate-600 rounded-xl pr-10 pl-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition-all"
              />
            </div>
          </div>

          {/* Error / Success */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/40 rounded-xl px-4 py-2.5 text-red-400 text-sm">
              ⚠ {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-xl px-4 py-2.5 text-emerald-400 text-sm animate-fadeIn">
              {t('profile.success')}
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full btn-shimmer text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-60"
          >
            {saving
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('profile.saving')}</>
              : <><Save size={16} /> {t('profile.save')}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
