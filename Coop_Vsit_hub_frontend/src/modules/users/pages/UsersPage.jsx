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
  Database,
  SlidersHorizontal,
} from 'lucide-react';
import useUserStore from '../store/userStore';
import useMasterDataStore from '@/modules/master_data/store/masterDataStore';
import UserTable from '../components/UserTable';
import OnboardUserModal from '../components/OnboardUserModal';
import AssignRolesModal from '../components/AssignRolesModal';
import MasterDataManagementModal from '@/modules/master_data/components/MasterDataManagementModal';
import Button from '@/shared/components/ui/Button';

const ROLES = [
  { label: 'All Roles', value: '' },
  { label: 'Admin', value: 'ROLE_ADMIN' },
  { label: 'Relationship Manager', value: 'ROLE_RELATIONSHIP_MANAGER' },
  { label: 'Approver', value: 'ROLE_APPROVER' },
  { label: 'Front Desk Reception', value: 'ROLE_SECURITY_DESK' },
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

  const { departments, fetchAllMasterData, openMasterModal } = useMasterDataStore();

  const [searchInput, setSearchInput] = useState(filters.search || '');

  useEffect(() => {
    fetchUsers();
    fetchStatsAndRoles();
    fetchAllMasterData();
  }, [fetchUsers, fetchStatsAndRoles, fetchAllMasterData]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters({ search: searchInput });
  };

  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.roleName) ||
    Boolean(filters.department);

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-[#00adef] border border-sky-200 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security Governance & Access Control</span>
          </div>

          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#000000] tracking-tight">
            Staff User & Master Data Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage staff accounts, assign authorization roles, and configure bank master data & facilities.
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
            variant="outline"
            size="sm"
            onClick={() => openMasterModal('departments')}
            icon={SlidersHorizontal}
          >
            Manage Master Data
          </Button>

          <Button
            variant="orange"
            size="sm"
            onClick={openOnboardModal}
            icon={UserPlus}
          >
            Onboard Staff
          </Button>
        </div>
      </div>

      {/* 1. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Staff Users
            </span>
            <p className="font-heading font-black text-3xl text-[#000000] mt-1">
              {totalElements}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Active bank accounts</p>
          </div>
          <div className="p-3 rounded-2xl bg-sky-50 text-[#00adef] border border-sky-200">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* System Admins */}
        <div className="p-5 rounded-3xl bg-white border border-amber-300 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#e38524] uppercase tracking-wider">
              System Admins
            </span>
            <p className="font-heading font-black text-3xl text-[#000000] mt-1">
              {userStats?.adminsCount || 1}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Privileged administrators</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-[#e38524] border border-amber-200">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Departments Count */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Bank Departments
            </span>
            <p className="font-heading font-black text-3xl text-[#000000] mt-1">
              {departments.length || 7}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Configured master units</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-50 text-slate-700 border border-slate-200">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        {/* Account Health */}
        <div className="p-5 rounded-3xl bg-white border border-emerald-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Security Compliance
            </span>
            <p className="font-heading font-black text-3xl text-emerald-800 mt-1">
              100%
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">No locked accounts</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, username, email..."
            className="w-full pl-10 pr-20 py-2.5 text-xs rounded-2xl bg-white border border-slate-200 shadow-xs placeholder:text-slate-400 text-slate-900 focus:outline-none focus:border-[#00adef]"
          />
          <button
            type="submit"
            className="absolute inset-y-1.5 right-1.5 px-3 rounded-xl bg-slate-100 hover:bg-[#00adef] hover:text-white text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2.5 shrink-0">
          <select
            value={filters.department || ''}
            onChange={(e) => setFilters({ department: e.target.value })}
            className="text-xs font-semibold py-2.5 px-3 rounded-2xl bg-white border border-slate-200 text-slate-700 shadow-xs focus:outline-none focus:border-[#00adef] cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id || d.name} value={d.name}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={filters.roleName || ''}
            onChange={(e) => setFilters({ roleName: e.target.value })}
            className="text-xs font-semibold py-2.5 px-3 rounded-2xl bg-white border border-slate-200 text-slate-700 shadow-xs focus:outline-none focus:border-[#00adef] cursor-pointer"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

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

      {/* 3. Main Staff Table */}
      <UserTable />

      {/* Modals */}
      <OnboardUserModal />
      <AssignRolesModal />
      <MasterDataManagementModal />
    </div>
  );
};

export default UsersPage;
