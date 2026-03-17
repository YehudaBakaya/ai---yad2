import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, List, Plus, LogOut, ChevronDown } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { subscribeUserPendingDeals } from '../services/firestoreService';
import { Sun, Moon } from 'lucide-react';

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, isLoggedIn, logout } = useAuth();
  const { favoritesList } = useFavorites();
  const { isDark, toggle: toggleTheme } = useTheme();
  const { t, toggleLang } = useLanguage();
  const [menuOpen,     setMenuOpen]     = useState(false);
  const [pendingDeals, setPendingDeals] = useState(0);
  const [dealToast,    setDealToast]    = useState(false);
  const prevDealsRef = useRef(0);
  const menuRef      = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!user?.id) { setPendingDeals(0); return; }
    const unsub = subscribeUserPendingDeals(user.id, (count) => {
      if (count > prevDealsRef.current) {
        setDealToast(true);
        setTimeout(() => setDealToast(false), 5000);
      }
      prevDealsRef.current = count;
      setPendingDeals(count);
    });
    return unsub;
  }, [user?.id]);

  const isActive = (path) => path === '/' ? pathname === '/' : pathname.startsWith(path);

  return (
    <>
    {dealToast && (
      <div
        className="fixed top-4 right-4 z-50 animate-slideUp cursor-pointer"
        style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          background: 'linear-gradient(135deg, rgba(245,158,11,0.95), rgba(251,191,36,0.95))',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(251,191,36,0.4)',
          padding: '12px 16px', borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(245,158,11,0.3)',
          maxWidth: '300px',
        }}
        onClick={() => setDealToast(false)}
      >
        <div style={{ width: '36px', height: '36px', background: 'rgba(255,255,255,0.2)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>🔔</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: '700', fontSize: '13px', color: 'white', marginBottom: '2px' }}>{t('navbar.dealToast')}</p>
          <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.8)' }}>{t('navbar.dealDesc')}</p>
        </div>
        <Link to="/my-listings" onClick={() => setDealToast(false)}
          style={{ fontSize: '11px', fontWeight: '700', background: 'rgba(255,255,255,0.25)', color: 'white', padding: '4px 10px', borderRadius: '8px', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {t('navbar.view')}
        </Link>
      </div>
    )}

    <nav style={{
      background: 'var(--bg-nav)',
      backdropFilter: 'blur(28px) saturate(200%)',
      WebkitBackdropFilter: 'blur(28px) saturate(200%)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky', top: 0, zIndex: 40,
      boxShadow: '0 4px 32px rgba(0,0,0,0.15)',
      transition: 'background 0.4s, border-color 0.4s',
    }}>
      {/* Top glow line */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.5) 40%, rgba(99,102,241,0.3) 60%, transparent 100%)' }} />

      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3 justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
            background: 'linear-gradient(135deg, #10B981, #059669)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
            position: 'relative', overflow: 'hidden',
            transition: 'box-shadow 0.3s, transform 0.3s',
          }} className="group-hover:scale-105">
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.25), transparent)' }} />
            <span style={{ color: 'white', fontWeight: '900', fontSize: '10px', letterSpacing: '-0.5px', position: 'relative' }}>S2B</span>
          </div>
          <span className="hidden sm:block text-gradient-emerald font-extrabold text-lg tracking-tight">
            S2B AI
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <NavLink to="/"        icon={<Home size={15} />} label={t('navbar.home')}     active={isActive('/')} />
          <NavLink to="/listings" icon={<List size={15} />} label={t('navbar.listings')} active={isActive('/listings')} />
        </div>

        {/* Right */}
        <div className="flex items-center gap-1.5">
          <IconBtn onClick={toggleLang} title="Switch language">
            <span style={{ fontSize: '11px', fontWeight: '700' }}>{t('navbar.lang')}</span>
          </IconBtn>

          <IconBtn onClick={toggleTheme} title={isDark ? t('navbar.lightMode') : t('navbar.darkMode')}>
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </IconBtn>

          {isLoggedIn ? (
            <>
              <Link to="/create" className="btn-shimmer text-white font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 text-sm">
                <Plus size={14} />
                <span className="hidden sm:inline">{t('navbar.publish')}</span>
              </Link>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    background: 'var(--bg-glass)',
                    border: '1px solid var(--border-dim)',
                    padding: '7px 12px', borderRadius: '12px',
                    transition: 'all 0.2s', position: 'relative',
                    cursor: 'pointer', color: 'var(--text-primary)',
                  }}
                  className="hover:bg-white/10"
                >
                  {pendingDeals > 0 && (
                    <span style={{
                      position: 'absolute', top: '-6px', right: '-6px',
                      width: '18px', height: '18px',
                      background: '#F59E0B', color: 'white',
                      fontSize: '10px', fontWeight: '800',
                      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 0 10px rgba(245,158,11,0.6)',
                    }} className="animate-pulse">
                      {pendingDeals > 9 ? '9+' : pendingDeals}
                    </span>
                  )}
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} style={{ width: '26px', height: '26px', borderRadius: '50%', border: '2px solid rgba(16,185,129,0.4)' }} />
                  ) : (
                    <div style={{
                      width: '26px', height: '26px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #10B981, #6366f1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'white', fontSize: '11px', fontWeight: '800',
                    }}>
                      {user?.name?.[0] || '?'}
                    </div>
                  )}
                  <span className="hidden sm:inline text-sm font-medium" style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                    {user?.name}
                  </span>
                  <ChevronDown size={12} style={{ color: 'var(--text-dim)', transition: 'transform 0.3s', transform: menuOpen ? 'rotate(180deg)' : 'none' }} />
                </button>

                {menuOpen && (
                  <div
                    className="absolute left-0 mt-2 animate-fadeIn"
                    style={{
                      width: '220px',
                      background: 'var(--bg-dropdown)',
                      backdropFilter: 'blur(32px)',
                      border: '1px solid var(--border-mid)',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      boxShadow: '0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(16,185,129,0.1)',
                    }}
                  >
                    {/* Header */}
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {user?.avatar ? (
                          <img src={user.avatar} alt={user.name} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid rgba(16,185,129,0.4)' }} />
                        ) : (
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #10B981, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: '800' }}>
                            {user?.name?.[0] || '?'}
                          </div>
                        )}
                        <div style={{ overflow: 'hidden' }}>
                          <p style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
                          <p style={{ color: 'var(--text-dim)', fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: '4px 0' }}>
                      <MenuItem to="/my-listings" icon="📋" label={t('navbar.myListings')} badge={pendingDeals > 0 ? pendingDeals : null} badgeColor="#F59E0B" onClick={() => setMenuOpen(false)} />
                      <MenuItem to="/favorites"   icon="❤️"  label={t('navbar.favorites')}  badge={favoritesList.length > 0 ? favoritesList.length : null} badgeColor="#EF4444" onClick={() => setMenuOpen(false)} />
                      <MenuItem to="/history"     icon="📜"  label={t('navbar.history')}    onClick={() => setMenuOpen(false)} />
                      <MenuItem to="/profile"     icon="👤"  label={t('navbar.profile')}    onClick={() => setMenuOpen(false)} />
                      {user?.isAdmin && <MenuItem to="/admin" icon="🛡️" label={t('navbar.admin')} onClick={() => setMenuOpen(false)} accent="#F59E0B" />}
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '4px 0 6px' }}>
                      <button
                        onClick={() => { logout(); setMenuOpen(false); }}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 16px', color: '#FCA5A5', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                        className="hover:bg-red-500/10"
                      >
                        <LogOut size={13} />
                        {t('navbar.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" style={{ color: 'var(--text-dim)', fontSize: '14px', fontWeight: '500', padding: '8px 12px', borderRadius: '10px', textDecoration: 'none', transition: 'all 0.2s' }} className="hover:text-white hover:bg-white/5">
                {t('navbar.login')}
              </Link>
              <Link to="/register" className="btn-shimmer text-white font-bold py-2 px-4 rounded-xl text-sm">
                {t('navbar.register')}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
    </>
  );
}

function NavLink({ to, icon, label, active }) {
  return (
    <Link to={to} style={{
      display: 'flex', alignItems: 'center', gap: '5px',
      padding: '7px 12px', borderRadius: '10px',
      fontSize: '13px', fontWeight: '500',
      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
      background: active ? 'var(--bg-glass)' : 'transparent',
      position: 'relative', transition: 'all 0.2s', textDecoration: 'none',
    }} className="hover:bg-white/5">
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {active && (
        <span style={{
          position: 'absolute', bottom: '2px', left: '50%', transform: 'translateX(-50%)',
          width: '16px', height: '2px', borderRadius: '99px',
          background: 'linear-gradient(90deg, #10B981, #34D399)',
        }} />
      )}
    </Link>
  );
}

function IconBtn({ onClick, title, children }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: '34px', height: '34px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: '10px',
      background: 'var(--bg-glass)',
      border: '1px solid var(--border-dim)',
      color: 'var(--text-secondary)',
      transition: 'all 0.2s', cursor: 'pointer',
    }} className="hover:bg-white/10 hover:border-white/15">
      {children}
    </button>
  );
}

function MenuItem({ to, icon, label, badge, badgeColor, onClick, accent }) {
  return (
    <Link to={to} onClick={onClick} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '9px 16px', textDecoration: 'none',
      color: accent || 'var(--text-secondary)',
      fontSize: '13px', transition: 'background 0.15s',
    }} className="hover:bg-white/5">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '14px' }}>{icon}</span>
        {label}
      </div>
      {badge && (
        <span style={{ background: badgeColor, color: 'white', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '99px' }}>
          {badge}
        </span>
      )}
    </Link>
  );
}
