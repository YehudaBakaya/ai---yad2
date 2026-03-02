import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

/**
 * דף זה מקבל את ה-JWT מ-Google OAuth callback
 * URL: /auth/callback?token=...
 */
export default function AuthCallback() {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = params.get('token');
    if (!token) { navigate('/login'); return; }

    // שמור token ואמת אותו
    localStorage.setItem('token', token);
    authAPI.me()
      .then(res => {
        login(token, res.data.user);
        navigate('/');
      })
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/login?error=auth');
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center animate-fadeIn">
        <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">מתחבר עם Google...</p>
      </div>
    </div>
  );
}
