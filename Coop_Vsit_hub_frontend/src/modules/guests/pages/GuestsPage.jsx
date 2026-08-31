import React, { useEffect, useState } from 'react';
import { Users2, Plus, RotateCcw, Search, Sparkles } from 'lucide-react';
import useGuestStore from '../store/guestStore';
import GuestKpiBanner from '../components/GuestKpiBanner';
import GuestTable from '../components/GuestTable';
import CreateGuestModal from '../components/CreateGuestModal';
import GuestProfileDrawer from '../components/GuestProfileDrawer';
import CreateVisitModal from '@/modules/visits/components/CreateVisitModal';
import Button from '@/shared/components/ui/Button';

const VIP_TIERS = [
  { label: 'All Guest Tiers', value: '' },
  { label: '👑 Tier 1 (C-Level / Ministers)', value: 'VIP_TIER_1' },
  { label: '⭐ Tier 2 (Directors / Senior)', value: 'VIP_TIER_2' },
  { label: 'Standard Guests', value: 'STANDARD' },
  { label: 'Diplomats', value: 'DIPLOMAT' },
];

export const GuestsPage = () => {
  const {
    filters,
    isLoading,
    fetchGuests,
    fetchStats,
    setFilters,
    resetFilters,
    openCreateModal,
  } = useGuestStore();

  const [searchInput, setSearchInput] = useState(filters.search || '');

  useEffect(() => {
    fetchGuests();
    fetchStats();
  }, [fetchGuests, fetchStats]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters({ search: searchInput });
  };

  const hasActiveFilters = Boolean(filters.search) || Boolean(filters.vipTier);

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-[#e38524] border border-amber-200 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Individual Guest Directory</span>
          </div>

          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#000000] tracking-tight">
            Individual Guests
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Directory of individual visitors, dignitaries, consultants, and scheduled delegations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              fetchGuests();
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
            + Register Individual Guest
          </Button>
        </div>
      </div>

      {/* 1. VIP KPI Summary Banner */}
      <GuestKpiBanner />

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
            placeholder="Search by VIP guest name, affiliation, title..."
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
            value={filters.vipTier || ''}
            onChange={(e) => setFilters({ vipTier: e.target.value })}
            className="text-xs font-semibold py-2.5 px-3 rounded-2xl bg-white border border-slate-200 text-slate-700 shadow-xs focus:outline-none focus:border-[#00adef] cursor-pointer"
          >
            {VIP_TIERS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
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

      {/* 3. VIP Guests Data Grid */}
      <GuestTable />

      {/* Modals & Drawers */}
      <CreateGuestModal />
      <GuestProfileDrawer />
      <CreateVisitModal />
    </div>
  );
};

export default GuestsPage;
