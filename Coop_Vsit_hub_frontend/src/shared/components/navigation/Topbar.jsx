import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  Volume2,
  VolumeX,
  User,
  Shield,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/modules/auth/store/authStore';
import useNotificationStore from '@/modules/notifications/store/notificationStore';
import soundPlayer from '@/core/utils/soundPlayer';

export const Topbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { unreadCount, toggleDrawer, fetchUnreadCount } = useNotificationStore();
  const [isSoundMuted, setIsSoundMuted] = useState(soundPlayer.isSoundMuted());
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Poll for unread notification counter every 30s
  useEffect(() => {
    fetchUnreadCount(false);
    const interval = setInterval(() => {
      fetchUnreadCount(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleToggleSound = () => {
    const nextMuted = !isSoundMuted;
    soundPlayer.setMuted(nextMuted);
    setIsSoundMuted(nextMuted);
    if (!nextMuted) {
      soundPlayer.playNotificationChime();
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/visits?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between transition-all select-none">
      {/* Left: Global Quick Search */}
      <form onSubmit={handleSearchSubmit} className="relative w-72 lg:w-96">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search visits, organizations, VIP guests..."
          className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-100/80 border border-slate-200/80 placeholder:text-slate-400 text-slate-900 focus:outline-none focus:border-[#00adef] focus:bg-white focus:ring-2 focus:ring-[#00adef]/20 transition-all"
        />
      </form>

      {/* Right: Actions (Sound Toggle, Notification Bell, User Menu) */}
      <div className="flex items-center gap-3">
        {/* Audio Notification Chime Toggle */}
        <button
          onClick={handleToggleSound}
          className={`p-2 rounded-xl border transition-all cursor-pointer ${
            isSoundMuted
              ? 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-700'
              : 'bg-orange-50 border-orange-200 text-[#e38524] hover:bg-orange-100'
          }`}
          title={isSoundMuted ? 'Notification Sound: Muted (Click to Unmute)' : 'Notification Sound: Enabled (Click to Mute)'}
        >
          {isSoundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Live Notification Bell */}
        <button
          onClick={toggleDrawer}
          className="relative p-2 rounded-xl bg-slate-100 hover:bg-sky-50 border border-slate-200/80 hover:border-[#00adef] text-slate-700 hover:text-[#00adef] transition-all cursor-pointer"
          title="Open Notifications Center"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#e38524] text-white text-[10px] font-black flex items-center justify-center animate-pulse shadow-sm">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all cursor-pointer"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-[#000000] leading-none">
                {user?.fullName || user?.username}
              </p>
              <p className="text-[10px] text-[#00adef] font-semibold mt-0.5">
                {user?.roles?.[0]?.replace('ROLE_', '') || 'Staff'}
              </p>
            </div>

            <div className="w-8 h-8 rounded-xl bg-[#00adef] text-white font-black text-xs flex items-center justify-center shadow-xs">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fadeIn text-left">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-[#000000]">{user?.fullName}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {user?.roles?.map((role) => (
                    <span
                      key={role}
                      className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-sky-50 text-[#00adef] border border-sky-200"
                    >
                      {role.replace('ROLE_', '')}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
