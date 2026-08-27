import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowLeft,
  Users,
  Clock,
  Sparkles,
  SlidersHorizontal,
  DoorOpen,
  CheckCircle,
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
  const { meetingRooms, fetchMeetingRooms, openMasterModal } = useMasterDataStore();
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchVisits();
    fetchMeetingRooms(true);
  }, [fetchVisits, fetchMeetingRooms]);

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

  const defaultRooms = [
    {
      id: 'default-1',
      name: 'Executive Boardroom - 4th Floor',
      capacity: 18,
      imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'default-2',
      name: 'FinTech Innovation Room A - 4th Floor',
      capacity: 12,
      imageUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'default-3',
      name: 'Strategic Peering Room B - 4th Floor',
      capacity: 10,
      imageUrl: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'default-4',
      name: 'CoopBank HQ VIP Lounge - Ground Floor',
      capacity: 25,
      imageUrl: 'https://images.unsplash.com/photo-1577412647305-991150c7d163?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const activeRooms = meetingRooms.length > 0 ? meetingRooms : defaultRooms;

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#00adef] border border-blue-200 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Facility Availability & Room Allocation</span>
          </div>

          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#000000] tracking-tight">
            Booking Calendar & Meeting Rooms
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Browse available boardroom facilities and book meeting spaces.
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
          className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-[#00adef] hover:text-white text-xs font-bold text-slate-700 transition-colors cursor-pointer"
        >
          Today
        </button>
      </div>

      {/* Clean Room Showcase & Schedule Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {activeRooms.map((room) => {
          const roomVisits = visits.filter(
            (v) =>
              v.locationRoom &&
              v.locationRoom.toLowerCase().includes(room.name.toLowerCase().split('-')[0].trim().toLowerCase())
          );

          const isAvailable = roomVisits.length === 0;

          return (
            <div
              key={room.id || room.name}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                {/* Room Image Header */}
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                  {room.imageUrl ? (
                    <img
                      src={room.imageUrl}
                      alt={room.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
                      <DoorOpen className="w-8 h-8 mb-1" />
                      <span className="text-[11px]">No Photo Uploaded</span>
                    </div>
                  )}

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-bold flex items-center gap-1">
                      <Users className="w-3 h-3 text-[#00adef]" />
                      <span>{room.capacity || 18} Seats</span>
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold backdrop-blur-md ${
                        isAvailable
                          ? 'bg-emerald-500/90 text-white'
                          : 'bg-amber-500/90 text-white'
                      }`}
                    >
                      {isAvailable ? 'Available' : `${roomVisits.length} Booked`}
                    </span>
                  </div>
                </div>

                {/* Room Title */}
                <div className="p-4 border-b border-slate-100">
                  <h3 className="font-heading font-black text-sm text-[#000000] leading-snug">
                    {room.name}
                  </h3>
                </div>

                {/* Timeline Bookings for this Room */}
                <div className="p-4 space-y-2.5">
                  {isAvailable ? (
                    <div className="py-6 text-center bg-emerald-50/50 rounded-2xl border border-dashed border-emerald-200">
                      <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                      <p className="text-xs text-emerald-700 font-bold">Available for Booking</p>
                      <p className="text-[10px] text-emerald-600/80">No conflicting meetings</p>
                    </div>
                  ) : (
                    roomVisits.map((v) => (
                      <div
                        key={v.id}
                        onClick={() => openDetailDrawer(v.id)}
                        className="p-3 rounded-2xl bg-slate-50 hover:bg-sky-50/60 border border-slate-200/80 hover:border-sky-300 transition-all cursor-pointer group text-left space-y-1"
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

                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                          <span className="truncate max-w-[120px] font-medium text-slate-600">
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

              {/* Action Button */}
              <div className="p-4 pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full font-bold"
                  onClick={openCreateModal}
                  icon={Plus}
                >
                  Book This Room
                </Button>
              </div>
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
