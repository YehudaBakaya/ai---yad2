import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, List, Plus, LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { pathname } = useLocation();
  const { user, isLoggedIn, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // סגור dropdown בלחיצה מחוץ
  useEffect(() => {
    const handler = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = (path) => path === '/' ? pathname === '/' : pathname.startsWith(path);

  return (
    <nav className="bg-slate-900/95 backdrop-blur border-b border-slate-800 sticky top-0 z-40 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-300 group-hover:scale-110">
            <span className="text-white font-extrabold text-lg">Y</span>
          </div>
          <span className="text-white font-extrabold text-xl tracking-tight">
            יד<span className="text-blue-400">2</span> <span className="text-purple-400">AI</span>
          </span>
        </Link>

        {/* Center links */}
        <div className="flex items-center gap-1">
          <NavLink to="/"        icon={<Home size={17} />} label="דף הבית" active={isActive('/')} />
          <NavLink to="/listings" icon={<List size={17} />} label="מודעות"  active={isActive('/listings')} />
        </div>

        {/* Right side — auth */}
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              {/* Create listing */}
              <Link
                to="/create"
                className="btn-shimmer text-white font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 text-sm shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 transition-shadow"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">פרסם</span>
              </Link>

              {/* User dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 px-3 py-2 rounded-xl transition-all"
                >
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {user?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                  <span className="hidden sm:inline text-sm text-white font-medium max-w-24 truncate">
                    {user?.name}
                  </span>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </button>

                {menuOpen && (
                  <div className="absolute left-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl shadow-black/30 overflow-hidden animate-fadeIn">
                    <div className="px-4 py-3 border-b border-slate-700">
                      <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
                      <p className="text-gray-400 text-xs truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => { logout(); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors text-sm"
                    >
                      <LogOut size={15} />
                      התנתק
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-gray-300 hover:text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-slate-800 transition-all"
              >
                התחבר
              </Link>
              <Link
                to="/register"
                className="btn-shimmer text-white font-bold py-2 px-4 rounded-lg text-sm shadow-md shadow-blue-500/20"
              >
                הרשמה
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function NavLink({ to, icon, label, active }) {
  return (
    <Link
      to={to}
      className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
        ${active ? 'text-white bg-slate-800' : 'text-gray-400 hover:text-white hover:bg-slate-800/60'}`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-blue-500 rounded-full" />}
    </Link>
  );
}
