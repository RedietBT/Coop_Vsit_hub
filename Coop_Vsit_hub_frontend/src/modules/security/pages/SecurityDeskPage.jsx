import React, { useEffect } from 'react';
import { UserCheck, RotateCcw, Sparkles, LogIn, Users } from 'lucide-react';
import useSecurityStore from '../store/securityStore';
import SecurityKpiBanner from '../components/SecurityKpiBanner';
import SecurityArrivalsTable from '../components/SecurityArrivalsTable';
import SecurityOnSiteTable from '../components/SecurityOnSiteTable';
import CheckInModal from '../components/CheckInModal';
import CheckOutModal from '../components/CheckOutModal';
import VisitDetailDrawer from '@/modules/visits/components/VisitDetailDrawer';
import Button from '@/shared/components/ui/Button';

export const SecurityDeskPage = () => {
  const {
    activeTab,
    setActiveTab,
    expectedArrivals,
    activeOnSite,
    isLoading,
    fetchSecurityFeed,
  } = useSecurityStore();

  useEffect(() => {
    fetchSecurityFeed();
    const interval = setInterval(() => {
      fetchSecurityFeed(false);
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchSecurityFeed]);

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-[#e38524] border border-amber-200 text-xs font-bold uppercase tracking-wider mb-2">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Front Desk Reception</span>
          </div>

          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#000000] tracking-tight">
            Front Desk Cockpit
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time visitor check-in, auto badge issuance (COOPV), ID verification, and on-premises escort tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchSecurityFeed(true)}
            disabled={isLoading}
            icon={RotateCcw}
          >
            Refresh Feed
          </Button>
        </div>
      </div>

      {/* 1. Live KPI Summary Banner */}
      <SecurityKpiBanner />

      {/* 2. Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('arrivals')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'arrivals'
              ? 'bg-white text-[#000000] shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LogIn className="w-3.5 h-3.5 text-[#00adef]" />
          <span>Expected Arrivals ({expectedArrivals.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('onsite')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'onsite'
              ? 'bg-white text-[#000000] shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e38524] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e38524]" />
          </span>
          <span>On-Premises Now ({activeOnSite.length})</span>
        </button>
      </div>

      {/* 3. Main Data Table */}
      {activeTab === 'arrivals' ? (
        <SecurityArrivalsTable />
      ) : (
        <SecurityOnSiteTable />
      )}

      {/* Modals & Slide-out Drawers */}
      <CheckInModal />
      <CheckOutModal />
      <VisitDetailDrawer />
    </div>
  );
};

export default SecurityDeskPage;
