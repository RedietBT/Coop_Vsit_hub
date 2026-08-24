import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowLeft,
  MapPin,
  Clock,
  Sparkles,
  Building2,
  SlidersHorizontal,
} from 'lucide-react';
import useVisitStore from '../store/visitStore';
import useMasterDataStore from '@/modules/master_data/store/masterDataStore';
import VisitDetailDrawer from '../components/VisitDetailDrawer';
import CreateVisitModal from '../components/CreateVisitModal';
import MasterDataManagementModal from '@/modules/master_data/components/MasterDataManagementModal';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';

export const VisitCalendarPage = () => {
  const navigate = useNavigate();
  const { visits, fetchVisits, openDetailDrawer, openCreateModal } = useVisitStore();
  const { meetingRooms, fetchAllMasterData, openMasterModal } = useMasterDataStore();
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchVisits();
    fetchAllMasterData();
  }, [fetchVisits, fetchAllMasterData]);

  const changeDate = (days) => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + days);
    setSelectedDate(next);
  };

  const formatScheduleTime = (isoString) => {
    if (!isoString) return 'TBD';
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const dateString = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const roomsList =
    meetingRooms.length > 0
      ? meetingRooms.map((r) => r.name)
      : [
          'DxValley Executive Boardroom (4th Floor)',
          'DxValley FinTech Innovation Room A',
          'DxValley Strategic Peering Room B',
          'CoopBank HQ VIP Lounge (Ground Floor)',
        ];

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-[#e38524] border border-orange-200 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Facility Schedule Intelligence</span>
          </div>

          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#000000] tracking-tight">
            Meeting Rooms & Booking Calendar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Visual room schedule, conflict prevention, and conference facility allocation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openMasterModal('rooms')}
            icon={SlidersHorizontal}
          >
            Manage Rooms
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/visits')}
            icon={ArrowLeft}
          >
            Visits Table View
          </Button>

          <Button
            variant="orange"
            size="sm"
            onClick={openCreateModal}
            icon={Plus}
          >
            Book Visit
          </Button>
        </div>
      </div>

      {/* Date Navigation Strip */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#e38524]" />
            <span className="font-heading font-bold text-sm text-[#000000]">
              {dateString}
            </span>
          </div>

          <button
            onClick={() => changeDate(1)}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={() => setSelectedDate(new Date())}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#00adef] hover:text-white text-xs font-bold text-slate-700 transition-colors cursor-pointer"
        >
          Today
        </button>
      </div>

      {/* Room Schedule Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {roomsList.map((roomName) => {
          const roomVisits = visits.filter(
            (v) =>
              v.locationRoom &&
              v.locationRoom.toLowerCase() === roomName.toLowerCase()
          );

          return (
            <div
              key={roomName}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-heading font-black text-sm text-[#000000]">
                      {roomName}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-[#00adef]" />
                      <span>CoopBank DxValley Hub</span>
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-lg bg-sky-50 text-[#00adef] font-mono text-[10px] font-bold border border-sky-200">
                    {roomVisits.length} Bookings
                  </span>
                </div>

                {/* Timeline Cards for this Room */}
                <div className="mt-4 space-y-3">
                  {roomVisits.length === 0 ? (
                    <div className="py-8 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-xs text-slate-400 font-medium">Available All Day</p>
                      <p className="text-[10px] text-slate-300 mt-0.5">No conflict scheduled</p>
                    </div>
                  ) : (
                    roomVisits.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => openDetailDrawer(v.id)}
                        className="p-3.5 rounded-2xl bg-slate-50 hover:bg-sky-50/60 border border-slate-200/80 hover:border-sky-300 transition-all cursor-pointer group text-left space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-[#00adef]">
                            {v.visitCode}
                          </span>
                          <Badge status={v.status} />
                        </div>

                        <p className="font-bold text-xs text-[#000000] truncate group-hover:text-[#00adef] transition-colors">
                          {v.title}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                          <span className="truncate max-w-[120px] font-semibold text-slate-700">
                            {v.guestDisplayName}
                          </span>
                          <span className="font-mono flex items-center gap-1 shrink-0 text-[#e38524] font-bold">
                            <Clock className="w-3 h-3" />
                            {formatScheduleTime(v.scheduledStartTime)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={openCreateModal}
                icon={Plus}
              >
                Schedule in Room
              </Button>
            </div>
          );
        })}
      </div>

      {/* Slide-out Drawers & Modals */}
      <VisitDetailDrawer />
      <CreateVisitModal />
      <MasterDataManagementModal />
    </div>
  );
};

export default VisitCalendarPage;
