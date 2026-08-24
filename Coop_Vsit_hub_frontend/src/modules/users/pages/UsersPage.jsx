import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Lock,
  RotateCcw,
  Search,
  Sparkles,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import useUserStore from '../store/userStore';
import UserTable from '../components/UserTable';
import OnboardUserModal from '../components/OnboardUserModal';
import AssignRolesModal from '../components/AssignRolesModal';
import Button from '@/shared/components/ui/Button';

const DEPARTMENTS = [
  'Digital Banking & Payments',
  'Corporate Banking',
  'FinTech PE & Open Banking',
  'Retail Banking',
  'Executive Office',
  'Information Security & Risk',
  'Operations & Security Desk',
];

const ROLES = [
  { label: 'All Roles', value: '' },
  { label: 'Admin', value: 'ROLE_ADMIN' },
  { label: 'Executive', value: 'ROLE_EXECUTIVE' },
  { label: 'Relationship Manager', value: 'ROLE_RELATIONSHIP_MANAGER' },
  { label: 'Approver', value: 'ROLE_APPROVER' },
  { label: 'Security Desk', value: 'ROLE_SECURITY_DESK' },
  { label: 'Employee', value: 'ROLE_EMPLOYEE' },
];

export const UsersPage = () => {
  const {
    users,
    totalElements,
    userStats,
    filters,
    isLoading,
    fetchUsers,
    fetchStatsAndRoles,
    setFilters,
    resetFilters,
    openOnboardModal,
  } = useUserStore();

  const [searchInput, setSearchInput] = useState(filters.search || '');

  useEffect(() => {
    fetchUsers();
    fetchStatsAndRoles();
  }, [fetchUsers, fetchStatsAndRoles]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters({ search: searchInput });
  };

  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.department) ||
    Boolean(filters.role);

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-[#00adef] border border-sky-200 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#e38524]" />
            <span>Staff Administration</span>
          </div>

          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#000000] tracking-tight">
            Staff User & Access Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage bank employees, assign RBAC authorization roles, unlock accounts, and control access permissions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              fetchUsers();
              fetchStatsAndRoles();
            }}
            disabled={isLoading}
            icon={RotateCcw}
          >
            Refresh
          </Button>

          <Button
            variant="orange"
            size="sm"
            onClick={openOnboardModal}
            icon={UserPlus}
          >
            Onboard Staff User
          </Button>
        </div>
      </div>

      {/* KPI Cards Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Staff Members
            </span>
            <p className="font-heading font-black text-3xl text-[#000000] mt-1">
              {totalElements}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Registered bank personnel</p>
          </div>
          <div className="p-3 rounded-2xl bg-sky-50 text-[#00adef] border border-sky-200">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Active Accounts */}
        <div className="p-5 rounded-3xl bg-white border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Active Accounts
            </span>
            <p className="font-heading font-black text-3xl text-emerald-800 mt-1">
              {userStats?.activeUsersCount || users.filter((u) => u.isEnabled !== false).length}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Enabled & authorized</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Locked Accounts */}
        <div className="p-5 rounded-3xl bg-white border border-rose-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
              Locked Accounts
            </span>
            <p className="font-heading font-black text-3xl text-rose-800 mt-1">
              {userStats?.lockedAccountsCount || users.filter((u) => u.isAccountNonLocked === false).length}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">3 failed attempts (1-click unlock)</p>
          </div>
          <div className="p-3 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200">
            <Lock className="w-5 h-5" />
          </div>
        </div>

        {/* Roles Distribution */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#e38524] uppercase tracking-wider">
              System Roles
            </span>
            <p className="font-heading font-black text-3xl text-[#000000] mt-1">
              6 <span className="text-xs font-semibold text-slate-500">Tier Levels</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">RBAC security policies active</p>
          </div>
          <div className="p-3 rounded-2xl bg-orange-50 text-[#e38524] border border-orange-200">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by staff name, username, email..."
            className="w-full pl-10 pr-20 py-2.5 text-xs rounded-2xl bg-white border border-slate-200 shadow-xs placeholder:text-slate-400 text-slate-900 focus:outline-none focus:border-[#00adef]"
          />
          <button
            type="submit"
            className="absolute inset-y-1.5 right-1.5 px-3 rounded-xl bg-slate-100 hover:bg-[#00adef] hover:text-white text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Filter Selectors */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Department */}
          <select
            value={filters.department || ''}
            onChange={(e) => setFilters({ department: e.target.value })}
            className="text-xs font-semibold py-2.5 px-3 rounded-2xl bg-white border border-slate-200 text-slate-700 shadow-xs focus:outline-none focus:border-[#00adef] cursor-pointer"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Role */}
          <select
            value={filters.role || ''}
            onChange={(e) => setFilters({ role: e.target.value })}
            className="text-xs font-semibold py-2.5 px-3 rounded-2xl bg-white border border-slate-200 text-slate-700 shadow-xs focus:outline-none focus:border-[#00adef] cursor-pointer"
          >
            {ROLES.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>

          {/* Reset */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                resetFilters();
              }}
              className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
              title="Reset Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Staff User Table */}
      <UserTable />

      {/* Modals */}
      <OnboardUserModal />
      <AssignRolesModal />
    </div>
  );
};

export default UsersPage;
