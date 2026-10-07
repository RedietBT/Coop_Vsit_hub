import React, { useEffect, useState } from 'react';
import {
  UserCheck,
  RotateCcw,
  Sparkles,
  LogIn,
  Users,
  Plus,
  Clock,
  Building2,
  MapPin,
  AlertTriangle,
  Flame,
  ArrowRight,
} from 'lucide-react';
import useSecurityStore from '../store/securityStore';
import useVisitStore from '@/modules/visits/store/visitStore';
import SecurityKpiBanner from '../components/SecurityKpiBanner';
import SecurityArrivalsTable from '../components/SecurityArrivalsTable';
import SecurityOnSiteTable from '../components/SecurityOnSiteTable';
import CheckInModal from '../components/CheckInModal';
import CheckOutModal from '../components/CheckOutModal';
import CancelVisitModal from '../components/CancelVisitModal';
import EditVisitorModal from '@/modules/visits/components/EditVisitorModal';
import NewVisitorBookingModal from '../components/NewVisitorBookingModal';
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
    editVisitorTarget,
    isEditVisitorModalOpen,
    closeEditVisitorModal,
    openCheckInModal,
  } = useSecurityStore();

  const { openDetailDrawer } = useVisitStore();

  const [isNewVisitModalOpen, setIsNewVisitModalOpen] = useState(false);

  useEffect(() => {
    fetchSecurityFeed();
    const interval = setInterval(() => {
      fetchSecurityFeed(false);
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchSecurityFeed]);

  // Compute live urgent visits (scheduled today or currently underway)
  const todayStr = new Date().toISOString().split('T')[0];
  const nowMs = Date.now();

  const liveUrgentVisits = [...expectedArrivals, ...activeOnSite]
    .filter((v) => {
      if (!v.scheduledStartTime) return false;
      const vDate = v.scheduledStartTime.split('T')[0];
      const vTime = new Date(v.scheduledStartTime).getTime();
      return (
        vDate === todayStr ||
        v.status === 'IN_PROGRESS' ||
        (vTime < nowMs && nowMs - vTime < 86400000)
      );
    })
    .sort((a, b) => {
      const timeA = new Date(a.scheduledStartTime).getTime();
      const timeB = new Date(b.scheduledStartTime).getTime();
      return timeA - timeB;
    });

  const getUrgencyBadge = (visit) => {
    if (visit.status === 'IN_PROGRESS') {
      return {
        label: 'On-Premises Now',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse',
      };
    }
    const startTimeMs = new Date(visit.scheduledStartTime).getTime();
    const diffMins = Math.round((startTimeMs - nowMs) / 60000);

    if (diffMins < 0) {
      return {
        label: `Overdue by ${Math.abs(diffMins)}m`,
        className: 'bg-red-50 text-red-700 border-red-200 font-black',
      };
    }
    if (diffMins <= 30) {
      return {
        label: `Arriving in ${diffMins}m`,
        className: 'bg-amber-50 text-amber-700 border-amber-200 font-bold',
      };
    }
    return {
      label: `Today at ${new Date(visit.scheduledStartTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
      className: 'bg-sky-50 text-sky-700 border-sky-200',
    };
  };

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

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="orange"
            size="sm"
            onClick={() => setIsNewVisitModalOpen(true)}
            icon={Plus}
            className="shadow-sm font-bold"
          >
            + Register New Visit / Reception Walk-In
          </Button>

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

      {/* 2. LIVE URGENCY & SCHEDULE SPOTLIGHT (Visits pop up until completed) */}
      {liveUrgentVisits.length > 0 && (
        <div className="bg-linear-to-r from-amber-50/90 via-sky-50/80 to-white p-5 rounded-3xl border border-amber-200/70 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <Flame className="w-4 h-4" />
              </div>
              <h3 className="font-heading font-bold text-sm text-slate-900">
                Today's Schedule & Urgency Queue ({liveUrgentVisits.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Live until reception completion
            </span>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {liveUrgentVisits.slice(0, 6).map((visit) => {
              const badge = getUrgencyBadge(visit);
              return (
                <div
                  key={visit.id}
                  onClick={() => openDetailDrawer(visit)}
                  className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-[#00adef] transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-xs font-bold text-[#00adef]">
                        {visit.visitCode || 'VIS-2026'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 line-clamp-1">
                      {visit.title}
                    </h4>

                    <div className="mt-1 space-y-1 text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate font-medium text-slate-700">
                          {visit.guestDisplayName || 'Guest Delegation'}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-[#e38524] shrink-0" />
                        <span className="truncate">{visit.locationRoom || 'Lobby / Floor Visit'}</span>
                        <span>•</span>
                        <span>{visit.visitorCount || 1} Guest(s)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-[#00adef] font-mono font-bold">
                      {visit.visitCode || 'VIS-2026'}
                    </span>

                    {visit.status !== 'IN_PROGRESS' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openCheckInModal(visit);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#00adef] text-white text-[11px] font-bold hover:bg-sky-600 transition-colors cursor-pointer"
                      >
                        Check In →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Navigation Tabs */}
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

      {/* 4. Main Data Table */}
      {activeTab === 'arrivals' ? (
        <SecurityArrivalsTable />
      ) : (
        <SecurityOnSiteTable />
      )}

      {/* Modals & Slide-out Drawers */}
      <CheckInModal />
      <CheckOutModal />
      <CancelVisitModal />
      <NewVisitorBookingModal
        isOpen={isNewVisitModalOpen}
        onClose={() => setIsNewVisitModalOpen(false)}
        onSuccess={() => fetchSecurityFeed(true)}
      />
      <EditVisitorModal
        isOpen={isEditVisitorModalOpen}
        onClose={closeEditVisitorModal}
        visit={editVisitorTarget}
        onSaveSuccess={() => fetchSecurityFeed(false)}
      />
      <VisitDetailDrawer />
    </div>
  );
};

export default SecurityDeskPage;
