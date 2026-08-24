import React, { useState } from 'react';
import { Search, Plus, Filter, RotateCcw, X } from 'lucide-react';
import useVisitStore from '../store/visitStore';
import useAuthStore from '@/modules/auth/store/authStore';
import Button from '@/shared/components/ui/Button';

const STATUS_PILLS = [
  { label: 'All Statuses', value: '' },
  { label: 'Submitted', value: 'SUBMITTED' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Rejected', value: 'REJECTED' },
];

const DEPARTMENTS = [
  'Digital Banking & Payments',
  'Corporate Banking',
  'FinTech PE & Open Banking',
  'Retail Banking',
  'Executive Office',
  'Information Security & Risk',
];

export const VisitFilterToolbar = () => {
  const { filters, setFilters, resetFilters, openCreateModal, visits, totalElements } = useVisitStore();
  const { hasAnyRole } = useAuthStore();
  const [searchInput, setSearchInput] = useState(filters.search || '');

  const canCreate = hasAnyRole(['ROLE_ADMIN', 'ROLE_RELATIONSHIP_MANAGER', 'ROLE_EMPLOYEE']);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters({ search: searchInput });
  };

  const handleStatusChange = (statusValue) => {
    setFilters({ status: statusValue });
  };

  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.status) ||
    Boolean(filters.department) ||
    Boolean(filters.priority);

  return (
    <div className="space-y-4 text-left">
      {/* Top Search & Actions Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input Form */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by code (VIS-2026), guest, org, room..."
            className="w-full pl-10 pr-20 py-2.5 text-xs rounded-2xl bg-white border border-slate-200 shadow-xs placeholder:text-slate-400 text-slate-900 focus:outline-none focus:border-[#00adef] focus:ring-2 focus:ring-[#00adef]/20 transition-all"
          />
          <button
            type="submit"
            className="absolute inset-y-1.5 right-1.5 px-3 rounded-xl bg-slate-100 hover:bg-[#00adef] hover:text-white text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Department Select */}
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

          {/* Reset Filters */}
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

          {/* Create Visit CTA */}
          {canCreate && (
            <Button
              variant="orange"
              size="md"
              onClick={openCreateModal}
              icon={Plus}
            >
              Book New Visit
            </Button>
          )}
        </div>
      </div>

      {/* Status Pill Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {STATUS_PILLS.map((pill) => {
          const isActive = filters.status === pill.value;
          return (
            <button
              key={pill.value}
              type="button"
              onClick={() => handleStatusChange(pill.value)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#00adef] text-white shadow-xs shadow-sky-500/30'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {pill.label}
            </button>
          );
        })}

        <span className="text-[11px] text-slate-400 font-semibold ml-auto shrink-0 pl-2">
          {totalElements} total records
        </span>
      </div>
    </div>
  );
};

export default VisitFilterToolbar;
