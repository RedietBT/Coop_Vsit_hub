import React, { useEffect } from 'react';
import { Sparkles, CalendarDays } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useVisitStore from '../store/visitStore';
import VisitFilterToolbar from '../components/VisitFilterToolbar';
import VisitTable from '../components/VisitTable';
import StatusTransitionModal from '../components/StatusTransitionModal';
import VisitDetailDrawer from '../components/VisitDetailDrawer';
import Button from '@/shared/components/ui/Button';

export const VisitsListPage = () => {
  const navigate = useNavigate();
  const { fetchVisits } = useVisitStore();

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-[#00adef] border border-sky-200 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#e38524]" />
            <span>Delegation Operations</span>
          </div>

          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#000000] tracking-tight">
            Visits Lifecycle Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Register, approve, schedule, and track VIP guest and corporate partner delegations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline-cyan"
            size="sm"
            onClick={() => navigate('/visits/calendar')}
            icon={CalendarDays}
          >
            Calendar View
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <VisitFilterToolbar />

      {/* Data Table */}
      <VisitTable />

      {/* Modals & Slide-out Drawers */}
      <StatusTransitionModal />
      <VisitDetailDrawer />
    </div>
  );
};

export default VisitsListPage;
