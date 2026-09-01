import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  CalendarDays,
  DoorOpen,
  UserCheck,
  Building2,
  Users2,
  UserCog,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Database,
  FileSpreadsheet,
  Sparkles,
} from 'lucide-react';
import CoopLogo from '@/core/assets/CoopLogo';
import useAuthStore from '@/modules/auth/store/authStore';

const NAV_ITEMS = [
  {
    name: 'Executive Analytics',
    path: '/dashboard',
    icon: LayoutDashboard,
    roles: ['ROLE_ADMIN', 'ROLE_APPROVER'],
  },
  {
    name: 'My Meetings & Guests',
    path: '/my-tracking',
    icon: Sparkles,
    roles: ['ROLE_ADMIN', 'ROLE_EMPLOYEE', 'ROLE_RELATIONSHIP_MANAGER', 'ROLE_APPROVER', 'ROLE_SECURITY_DESK'],
  },
  {
    name: 'Booking Calendar',
    path: '/visits/calendar',
    icon: CalendarDays,
    roles: ['ROLE_ADMIN', 'ROLE_EMPLOYEE', 'ROLE_RELATIONSHIP_MANAGER', 'ROLE_APPROVER'],
  },
  {
    name: 'Visits Management',
    path: '/visits',
    icon: Calendar,
    roles: ['ROLE_ADMIN'],
  },
  {
    name: 'Booking Management',
    path: '/bookings',
    icon: DoorOpen,
    roles: ['ROLE_ADMIN'],
  },
  {
    name: 'Front Desk',
    path: '/security-desk',
    icon: UserCheck,
    roles: ['ROLE_SECURITY_DESK', 'ROLE_ADMIN'],
  },
  {
    name: 'Reports & Exports',
    path: '/reports',
    icon: FileSpreadsheet,
    roles: ['ROLE_ADMIN'],
  },
  {
    name: 'Partner Organizations',
    path: '/organizations',
    icon: Building2,
    roles: ['ROLE_ADMIN'],
  },
  {
    name: 'Individual Guests',
    path: '/guests',
    icon: Users2,
    roles: ['ROLE_ADMIN'],
  },
  {
    name: 'Staff & Access Control',
    path: '/users',
    icon: UserCog,
    roles: ['ROLE_ADMIN'],
  },
  {
    name: 'System Audit Logs',
    path: '/audit-logs',
    icon: Database,
    roles: ['ROLE_ADMIN'],
  },
];

export const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const navigate = useNavigate();
  const { user, logout, hasAnyRole } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true;
    return hasAnyRole(item.roles);
  });

  return (
    <aside
      className={`relative h-screen bg-white border-r border-slate-200/90 transition-all duration-300 flex flex-col justify-between z-30 shrink-0 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="py-4 px-4 flex items-center justify-between border-b border-slate-100 min-h-[82px]">
          <div className="flex items-center gap-3 overflow-hidden">
            <CoopLogo
              size={isCollapsed ? 'sm' : 'md'}
              hideText={isCollapsed}
            />
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-[#00adef] hover:bg-sky-50 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
            {!isCollapsed ? 'Workspace' : '•••'}
          </div>

          <nav className="space-y-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-linear-to-r from-[#e38524] to-[#f59e0b] text-white shadow-md shadow-orange-500/20'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-[#00adef]'
                    } ${isCollapsed ? 'justify-center' : ''}`
                  }
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* User Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50">
        <div
          className={`flex items-center gap-3 p-2 rounded-2xl bg-white border border-slate-200/80 shadow-xs ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#00adef] font-black text-xs flex items-center justify-center shrink-0 border border-sky-200">
              {(user?.firstName?.[0] || user?.username?.[0] || 'U').toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 text-left">
                <p className="font-bold text-xs text-[#000000] truncate">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.username || 'Staff User'}
                </p>
                <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider truncate">
                  {user?.roles?.[0]?.replace('ROLE_', '') || 'STAFF'}
                </p>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
