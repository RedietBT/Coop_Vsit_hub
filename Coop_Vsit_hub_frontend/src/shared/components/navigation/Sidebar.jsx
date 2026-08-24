import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  ShieldCheck,
  Building2,
  Users2,
  UserCog,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import CoopLogo from '@/core/assets/CoopLogo';
import useAuthStore from '@/modules/auth/store/authStore';

const NAV_ITEMS = [
  {
    name: 'Executive Analytics',
    path: '/dashboard',
    icon: LayoutDashboard,
    roles: ['ROLE_ADMIN', 'ROLE_EXECUTIVE', 'ROLE_RELATIONSHIP_MANAGER'],
  },
  {
    name: 'Visits Management',
    path: '/visits',
    icon: Calendar,
    roles: ['ROLE_ADMIN', 'ROLE_RELATIONSHIP_MANAGER', 'ROLE_APPROVER', 'ROLE_EMPLOYEE'],
  },
  {
    name: 'Booking Calendar',
    path: '/visits/calendar',
    icon: CalendarDays,
    roles: ['ROLE_ADMIN', 'ROLE_RELATIONSHIP_MANAGER', 'ROLE_APPROVER'],
  },
  {
    name: 'Security Front Desk',
    path: '/security-desk',
    icon: ShieldCheck,
    roles: ['ROLE_SECURITY_DESK', 'ROLE_ADMIN'],
    badge: 'Front Desk',
  },
  {
    name: 'Partner Organizations',
    path: '/organizations',
    icon: Building2,
    roles: ['ROLE_ADMIN', 'ROLE_RELATIONSHIP_MANAGER', 'ROLE_EXECUTIVE'],
  },
  {
    name: 'VIP Individual Guests',
    path: '/guests',
    icon: Users2,
    roles: ['ROLE_ADMIN', 'ROLE_RELATIONSHIP_MANAGER', 'ROLE_EXECUTIVE'],
  },
  {
    name: 'Staff User Management',
    path: '/users',
    icon: UserCog,
    roles: ['ROLE_ADMIN'],
    badge: 'Admin',
  },
];

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, hasAnyRole, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Filter items based on user's authorized roles
  const authorizedNavItems = NAV_ITEMS.filter((item) => hasAnyRole(item.roles));

  return (
    <aside
      className={`relative h-screen bg-white border-r border-slate-200 flex flex-col justify-between transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center overflow-hidden">
            <CoopLogo size={isCollapsed ? 'sm' : 'md'} variant={isCollapsed ? 'icon' : 'full'} />
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-180px)]">
          {!isCollapsed && (
            <p className="px-3 pt-3 pb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
              Workspace
            </p>
          )}

          {authorizedNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-200 group ${
                    isActive
                      ? 'bg-[#e38524] text-white shadow-md shadow-orange-500/20'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-[#00adef]'
                  } ${isCollapsed ? 'justify-center px-2' : ''}`
                }
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className="w-5 h-5 shrink-0 transition-transform group-hover:scale-110" />

                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between truncate">
                    <span className="truncate">{item.name}</span>
                    {item.badge && (
                      <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-white/20 text-white">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Profile & Sign Out Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70">
        {!isCollapsed ? (
          <div className="flex items-center justify-between p-2 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#00adef]/15 text-[#00adef] font-black text-sm flex items-center justify-center shrink-0">
                {user?.fullName?.charAt(0) || user?.username?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs font-bold text-[#000000] truncate">
                  {user?.fullName || user?.username}
                </p>
                <p className="text-[10px] text-slate-500 truncate">
                  {user?.roles?.[0]?.replace('ROLE_', '') || 'Staff'}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex justify-center p-3 rounded-2xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
