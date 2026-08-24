import React, { useEffect, useState } from 'react';
import { Building2, Plus, RotateCcw, Search, Sparkles } from 'lucide-react';
import useOrganizationStore from '../store/organizationStore';
import OrganizationKpiBanner from '../components/OrganizationKpiBanner';
import OrganizationTable from '../components/OrganizationTable';
import CreateOrganizationModal from '../components/CreateOrganizationModal';
import OrganizationProfileDrawer from '../components/OrganizationProfileDrawer';
import CreateVisitModal from '@/modules/visits/components/CreateVisitModal';
import Button from '@/shared/components/ui/Button';

const CATEGORIES = [
  { label: 'All Categories', value: '' },
  { label: 'Strategic Partners', value: 'Strategic Partner' },
  { label: 'FinTech Peers', value: 'FinTech Peer' },
  { label: 'Regulators', value: 'Regulator / Government Body' },
  { label: 'Enterprises', value: 'Commercial Enterprise' },
];

export const OrganizationsPage = () => {
  const {
    filters,
    isLoading,
    fetchOrganizations,
    fetchStats,
    setFilters,
    resetFilters,
    openCreateModal,
  } = useOrganizationStore();

  const [searchInput, setSearchInput] = useState(filters.search || '');

  useEffect(() => {
    fetchOrganizations();
    fetchStats();
  }, [fetchOrganizations, fetchStats]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters({ search: searchInput });
  };

  const hasActiveFilters = Boolean(filters.search) || Boolean(filters.category);

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-[#00adef] border border-sky-200 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#e38524]" />
            <span>Corporate Alliance Intelligence</span>
          </div>

          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#000000] tracking-tight">
            Partner Organizations Portfolio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Directory of corporate partners, FinTech peers, regulators, and relationship health metrics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              fetchOrganizations();
              fetchStats();
            }}
            disabled={isLoading}
            icon={RotateCcw}
          >
            Refresh
          </Button>

          <Button
            variant="orange"
            size="sm"
            onClick={openCreateModal}
            icon={Plus}
          >
            Register Organization
          </Button>
        </div>
      </div>

      {/* 1. Portfolio KPI Banner */}
      <OrganizationKpiBanner />

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
            placeholder="Search by partner name, contact, sector..."
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
            value={filters.category || ''}
            onChange={(e) => setFilters({ category: e.target.value })}
            className="text-xs font-semibold py-2.5 px-3 rounded-2xl bg-white border border-slate-200 text-slate-700 shadow-xs focus:outline-none focus:border-[#00adef] cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
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

      {/* 3. Organizations Data Grid */}
      <OrganizationTable />

      {/* Modals & Drawers */}
      <CreateOrganizationModal />
      <OrganizationProfileDrawer />
      <CreateVisitModal />
    </div>
  );
};

export default OrganizationsPage;
