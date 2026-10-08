import React, { useEffect } from 'react';
import { Sparkles, CalendarDays, Users, DoorOpen } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import useVisitStore from '../store/visitStore';
import VisitFilterToolbar from '../components/VisitFilterToolbar';
import VisitTable from '../components/VisitTable';
import RoomBookingsTable from '../components/RoomBookingsTable';
import StatusTransitionModal from '../components/StatusTransitionModal';
import VisitDetailDrawer from '../components/VisitDetailDrawer';
import Button from '@/shared/components/ui/Button';

export const VisitsListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'rooms' ? 'rooms' : 'visits';

  const { fetchVisits } = useVisitStore();

  useEffect(() => {
    if (activeTab === 'visits') {
      fetchVisits();
    }
  }, [fetchVisits, activeTab]);

  const handleTabChange = (tabKey) => {
    setSearchParams(tabKey === 'rooms' ? { tab: 'rooms' } : {});
  };

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-[#00adef] border border-sky-200 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#e38524]" />
            <span>Operations & Scheduling Hub</span>
          </div>

          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#000000] tracking-tight">
            Visits & Room Reservations Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Register delegations, review corporate guests, and inspect or cancel boardroom reservations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline-cyan"
            size="sm"
            onClick={() => navigate('/visits/calendar')}
            icon={CalendarDays}
          >
            Interactive Calendar
          </Button>
        </div>
      </div>

      {/* Main Mode Tabs Switcher */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => handleTabChange('visits')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'visits'
              ? 'bg-white text-[#00adef] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Delegation Visits</span>
        </button>

        <button
          onClick={() => handleTabChange('rooms')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'rooms'
              ? 'bg-white text-[#00adef] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <DoorOpen className="w-4 h-4" />
          <span>Room Reservations & Bookings</span>
        </button>
      </div>

      {/* Tab 1: Delegation Visits */}
      {activeTab === 'visits' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Filter Toolbar */}
          <VisitFilterToolbar />

          {/* Data Table */}
          <VisitTable />

          {/* Modals & Slide-out Drawers */}
          <StatusTransitionModal />
          <VisitDetailDrawer />
        </div>
      )}

      {/* Tab 2: Dedicated Room Bookings */}
      {activeTab === 'rooms' && (
        <div className="animate-fadeIn">
          <RoomBookingsTable />
        </div>
      )}
    </div>
  );
};

export default VisitsListPage;
