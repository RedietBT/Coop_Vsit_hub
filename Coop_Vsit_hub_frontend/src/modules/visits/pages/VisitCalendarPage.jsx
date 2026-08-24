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
} from 'lucide-react';
import useVisitStore from '../store/visitStore';
import VisitDetailDrawer from '../components/VisitDetailDrawer';
import CreateVisitModal from '../components/CreateVisitModal';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';

const MEETING_ROOMS = [
  'DxValley Executive Boardroom (4th Floor)',
  'DxValley FinTech Innovation Room A',
  'DxValley Strategic Peering Room B',
  'CoopBank HQ VIP Lounge (Ground Floor)',
];

export const VisitCalendarPage = () => {
  const navigate = useNavigate();
  const { visits, fetchVisits, openDetailDrawer, openCreateModal } = useVisitStore();
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

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

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-[#00adef] border border-sky-200 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#e38524]" />
            <span>Room Booking Calendar</span>
          </div>

          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#000000] tracking-tight">
            Smart Booking Timetable
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Visual room allocation, executive conflict prevention, and daily delegation timeline.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/visits')}
            icon={ArrowLeft}
          >
            Table View
          </Button>

          <Button
            variant="orange"
            size="sm"
            onClick={openCreateModal}
            icon={Plus}
          >
            Schedule Visit
          </Button>
        </div>
      </div>

      {/* Date Navigator Strip */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => changeDate(1)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="font-heading font-black text-sm text-[#000000] ml-2">
            {dateString}
          </span>
        </div>

        <button
          onClick={() => setSelectedDate(new Date())}
          className="px-3 py-1.5 rounded-xl bg-sky-50 text-[#00adef] font-bold text-xs hover:bg-sky-100 transition-colors cursor-pointer"
        >
          Today
        </button>
      </div>

      {/* Meeting Rooms Schedule Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {MEETING_ROOMS.map((roomName) => {
          const roomVisits = visits.filter(
            (v) => (v.locationRoom || '').toLowerCase() === roomName.toLowerCase()
          );

          return (
            <div
              key={roomName}
              className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-sky-50 text-[#00adef]">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-xs text-[#000000]">
                        {roomName}
                      </h3>
                      <p className="text-[10px] text-slate-400">DxValley Executive Facilities</p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700">
                    {roomVisits.length} Bookings
                  </span>
                </div>

                {/* Bookings in this Room */}
                <div className="space-y-3">
                  {roomVisits.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      Room Available • No conflicts scheduled
                    </div>
                  ) : (
                    roomVisits.map((visit) => (
                      <div
                        key={visit.id}
                        onClick={() => openDetailDrawer(visit)}
                        className="p-3.5 rounded-2xl bg-slate-50 hover:bg-sky-50/50 border border-slate-200 hover:border-[#00adef] transition-all cursor-pointer group text-left"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="font-mono text-[10px] font-black text-[#00adef]">
                            {visit.visitCode || 'VIS-2026'}
                          </span>
                          <Badge variant={visit.status} size="sm">
                            {visit.status}
                          </Badge>
                        </div>

                        <h4 className="font-bold text-xs text-[#000000] group-hover:text-[#00adef] transition-colors truncate">
                          {visit.title}
                        </h4>

                        <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                          <div className="flex items-center gap-1 font-semibold text-slate-700">
                            <Clock className="w-3 h-3 text-[#e38524]" />
                            <span>
                              {formatScheduleTime(visit.scheduledStartTime)} -{' '}
                              {formatScheduleTime(visit.scheduledEndTime)}
                            </span>
                          </div>

                          <span className="text-slate-600 truncate max-w-[120px]">
                            {visit.guestDisplayName || 'Guest Partner'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 mt-4">
                <span>CoopBank Facility Peering</span>
                <span className="font-bold text-[#00adef]">Real-Time Sync</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Drawers & Modals */}
      <CreateVisitModal />
      <VisitDetailDrawer />
    </div>
  );
};

export default VisitCalendarPage;
