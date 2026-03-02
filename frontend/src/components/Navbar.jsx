import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, List, Plus } from 'lucide-react';

export default function Navbar() {
  const { pathname } = useLocation();

  const isActive = (path) =>
    path === '/' ? pathname === '/' : pathname.startsWith(path);

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

        {/* Links */}
        <div className="flex items-center gap-1">
          <NavLink to="/" icon={<Home size={17} />} label="דף הבית" active={isActive('/')} />
          <NavLink to="/listings" icon={<List size={17} />} label="מודעות" active={isActive('/listings')} />

          <Link
            to="/create"
            className="mr-2 btn-shimmer text-white font-bold py-2 px-4 rounded-lg flex items-center gap-1.5 text-sm shadow-md shadow-blue-500/20 hover:shadow-blue-500/40 transition-shadow"
          >
            <Plus size={17} />
            <span className="hidden sm:inline">פרסם מודעה</span>
          </Link>
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
        ${active
          ? 'text-white bg-slate-800'
          : 'text-gray-400 hover:text-white hover:bg-slate-800/60'
        }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {active && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-blue-500 rounded-full" />
      )}
    </Link>
  );
}
