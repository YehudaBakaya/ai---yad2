import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, List, ShoppingBag, TrendingUp, Trash2, Shield, ShieldOff,
  Eye, EyeOff, ArrowRight, RefreshCw, Search
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getAllUsers, setUserAdmin, getBuyerDeals } from '../services/firestoreService';
import { listingsAPI } from '../services/api';

export default function Admin() {
  const { user, isLoggedIn } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [tab, setTab]               = useState('stats');
  const [users, setUsers]           = useState([]);
  const [listings, setListings]     = useState([]);
  const [deals, setDeals]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');

  useEffect(() => {
    if (!isLoggedIn) { navigate('/login'); return; }
    if (isLoggedIn && user && !user.isAdmin) { navigate('/'); }
  }, [isLoggedIn, user, navigate]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersData, { data: listingsData }] = await Promise.all([
        getAllUsers(),
        listingsAPI.getAll({ isActive: undefined }),
      ]);
      setUsers(usersData);
      setListings(listingsData);
    } catch (err) {
      console.error('Admin load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleListingActive = async (id, current) => {
    await listingsAPI.update(id, { isActive: !current });
    setListings(prev => prev.map(l => l.id === id ? { ...l, isActive: !current } : l));
  };

  const deleteListing = async (id) => {
    if (!window.confirm(t('admin.delConfirm'))) return;
    await listingsAPI.remove(id);
    setListings(prev => prev.filter(l => l.id !== id));
  };

  const toggleAdmin = async (uid, current) => {
    await setUserAdmin(uid, !current);
    setUsers(prev => prev.map(u => u.uid === uid ? { ...u, isAdmin: !current } : u));
  };

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-gray-400">{t('admin.noPermission')}</p>
      </div>
    );
  }

  const activeListings   = listings.filter(l => l.isActive !== false);
  const inactiveListings = listings.filter(l => l.isActive === false);
  const adminUsers       = users.filter(u => u.isAdmin);

  const filteredListings = listings.filter(l =>
    l.title?.toLowerCase().includes(search.toLowerCase()) ||
    l.seller?.name?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4">
      <div className="max-w-7xl mx-auto animate-fadeIn">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors">
              <ArrowRight size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
                <Shield size={22} className="text-violet-400" />
                {t('admin.title')}
              </h1>
              <p className="text-gray-400 text-sm mt-0.5">{t('admin.sub')}</p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-gray-300 hover:text-white px-3 py-2 rounded-xl text-sm transition-all"
          >
            <RefreshCw size={14} />
            {t('admin.refresh')}
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { key: 'admin.stat.users',  value: users.length,           icon: <Users size={18} />,       color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/30' },
            { key: 'admin.stat.active', value: activeListings.length,  icon: <List size={18} />,        color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
            { key: 'admin.stat.hidden', value: inactiveListings.length,icon: <EyeOff size={18} />,      color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/30' },
            { key: 'admin.stat.admins', value: adminUsers.length,       icon: <Shield size={18} />,      color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/30' },
          ].map(({ key, value, icon, color, bg }) => (
            <div key={key} className={`border rounded-2xl p-4 ${bg}`}>
              <div className={`flex items-center gap-2 mb-2 ${color}`}>{icon}<span className="text-xs font-semibold">{t(key)}</span></div>
              <div className="text-3xl font-extrabold text-white">{loading ? '…' : value}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {[
            { id: 'listings', labelKey: 'admin.tab.listings', icon: <List size={15} /> },
            { id: 'users',    labelKey: 'admin.tab.users',    icon: <Users size={15} /> },
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => { setTab(btn.id); setSearch(''); }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === btn.id
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                  : 'bg-slate-800 border border-slate-700 text-gray-400 hover:text-white'
              }`}
            >
              {btn.icon}{t(btn.labelKey)}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={tab === 'listings' ? t('admin.searchListings') : t('admin.searchUsers')}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pr-9 pl-4 py-2.5 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Listings tab */}
        {tab === 'listings' && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-gray-400 text-xs">
                    <th className="text-right px-4 py-3 font-semibold">{t('admin.col.listing')}</th>
                    <th className="text-right px-4 py-3 font-semibold hidden sm:table-cell">{t('admin.col.seller')}</th>
                    <th className="text-right px-4 py-3 font-semibold">{t('admin.col.price')}</th>
                    <th className="text-right px-4 py-3 font-semibold hidden md:table-cell">{t('admin.col.views')}</th>
                    <th className="text-right px-4 py-3 font-semibold">{t('admin.col.status')}</th>
                    <th className="text-right px-4 py-3 font-semibold">{t('admin.col.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">{t('admin.loading')}</td></tr>
                  ) : filteredListings.map(l => (
                    <tr key={l.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {l.images?.[0] && (
                            <img src={l.images[0]} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0" />
                          )}
                          <span className="text-white font-medium text-xs max-w-36 truncate">{l.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-gray-300 text-xs">{l.seller?.name || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-emerald-400 font-bold text-xs">₪{l.price?.toLocaleString()}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-gray-400 text-xs">{l.views || 0}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          l.isActive !== false
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-red-500/15 text-red-400'
                        }`}>
                          {l.isActive !== false ? t('admin.status.active') : t('admin.status.hidden')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleListingActive(l.id, l.isActive !== false)}
                            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-gray-300 hover:text-white transition-all"
                          >
                            {l.isActive !== false ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                          <button
                            onClick={() => deleteListing(l.id)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/25 text-red-400 transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && filteredListings.length === 0 && (
                <p className="text-center py-8 text-gray-400 text-sm">{t('admin.noListings')}</p>
              )}
            </div>
          </div>
        )}

        {/* Users tab */}
        {tab === 'users' && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 text-gray-400 text-xs">
                    <th className="text-right px-4 py-3 font-semibold">{t('admin.col.user')}</th>
                    <th className="text-right px-4 py-3 font-semibold hidden sm:table-cell">{t('admin.col.email')}</th>
                    <th className="text-right px-4 py-3 font-semibold hidden md:table-cell">{t('admin.col.phone')}</th>
                    <th className="text-right px-4 py-3 font-semibold">{t('admin.col.perm')}</th>
                    <th className="text-right px-4 py-3 font-semibold">{t('admin.col.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">{t('admin.loading')}</td></tr>
                  ) : filteredUsers.map(u => (
                    <tr key={u.uid} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {u.avatar ? (
                            <img src={u.avatar} alt="" className="w-7 h-7 rounded-full" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                              {u.name?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                          <span className="text-white text-xs font-medium">{u.name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-gray-300 text-xs">{u.email || '—'}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-gray-400 text-xs">{u.phone || '—'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          u.isAdmin
                            ? 'bg-violet-500/15 text-violet-400'
                            : 'bg-slate-700 text-gray-400'
                        }`}>
                          {u.isAdmin ? t('admin.role.admin') : t('admin.role.user')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.uid !== user.id && (
                          <button
                            onClick={() => toggleAdmin(u.uid, u.isAdmin)}
                            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-all ${
                              u.isAdmin
                                ? 'bg-red-500/10 hover:bg-red-500/25 text-red-400'
                                : 'bg-violet-500/10 hover:bg-violet-500/25 text-violet-400'
                            }`}
                          >
                            {u.isAdmin ? <><ShieldOff size={12} /> {t('admin.removeAdmin')}</> : <><Shield size={12} /> {t('admin.makeAdmin')}</>}
                          </button>
                        )}
                        {u.uid === user.id && (
                          <span className="text-xs text-gray-500">{t('admin.you')}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!loading && filteredUsers.length === 0 && (
                <p className="text-center py-8 text-gray-400 text-sm">{t('admin.noUsers')}</p>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
