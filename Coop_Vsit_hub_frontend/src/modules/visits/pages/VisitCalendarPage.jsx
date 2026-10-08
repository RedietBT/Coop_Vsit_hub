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
  Search,
  Filter,
  ShieldCheck,
  Calendar as CalendarIcon,
  Info,
  Check,
  Building2,
  FileText,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import useAuthStore from '@/modules/auth/store/authStore';
import useMasterDataStore from '@/modules/master_data/store/masterDataStore';
import visitApi from '../api/visitApi';
import roomBookingApi from '@/modules/booking/api/roomBookingApi';
import soundPlayer from '@/core/utils/soundPlayer';

const STANDARD_BUSINESS_SLOTS = [
  { start: '08:00', end: '09:00', label: '08:00 - 09:00' },
  { start: '09:00', end: '10:00', label: '09:00 - 10:00' },
  { start: '10:00', end: '11:00', label: '10:00 - 11:00' },
  { start: '11:00', end: '12:00', label: '11:00 - 12:00' },
  { start: '12:00', end: '13:00', label: '12:00 - 13:00' },
  { start: '13:00', end: '14:00', label: '13:00 - 14:00' },
  { start: '14:00', end: '15:00', label: '14:00 - 15:00' },
  { start: '15:00', end: '16:00', label: '15:00 - 16:00' },
  { start: '16:00', end: '17:00', label: '16:00 - 17:00' },
  { start: '17:00', end: '18:00', label: '17:00 - 18:00' },
];

const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
};

const getLocalDateString = (d) => {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getConflictingBooking = (dateStr, startStr, endStr, slotsList) => {
  if (!dateStr || !startStr || !endStr) return null;
  const startMin = parseTimeToMinutes(startStr);
  const endMin = parseTimeToMinutes(endStr);
  if (startMin >= endMin) return null;

  return (slotsList || []).find((b) => {
    if (!b.scheduledStartTime || !b.scheduledEndTime) return false;
    let bDate = b.date;
    if (!bDate && b.scheduledStartTime) {
      bDate = b.scheduledStartTime.split('T')[0];
    }
    const bLocalDate = getLocalDateString(new Date(b.scheduledStartTime));
    if (bDate !== dateStr && bLocalDate !== dateStr) return false;

    const bStartDate = new Date(b.scheduledStartTime);
    const bEndDate = new Date(b.scheduledEndTime);
    const bStartMin = bStartDate.getHours() * 60 + bStartDate.getMinutes();
    const bEndMin = bEndDate.getHours() * 60 + bEndDate.getMinutes();

    return startMin < bEndMin && endMin > bStartMin;
  });
};
import Button from '@/shared/components/ui/Button';
import Badge from '@/shared/components/ui/Badge';
import Modal from '@/shared/components/ui/Modal';
import AdminRoomBookingsModal from '../components/AdminRoomBookingsModal';
import MasterDataManagementModal from '@/modules/master_data/components/MasterDataManagementModal';
import RoomCardImage from '@/modules/booking/components/RoomCardImage';

export const VisitCalendarPage = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuthStore();
  const isAdmin = hasRole('ROLE_ADMIN');
  const isSecretary = hasRole('ROLE_SECRETARY');

  const { meetingRooms, fetchMeetingRooms, fetchAllMasterData, openMasterModal } =
    useMasterDataStore();

  // State
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('ALL');
  const [isAdminRosterOpen, setIsAdminRosterOpen] = useState(false);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;
    if (!cancelReason.trim()) {
      toast.error('Please specify a reason for cancellation.');
      return;
    }
    setIsCancelling(true);
    try {
      await roomBookingApi.cancelBooking(cancellingBooking.id, cancelReason.trim());
      soundPlayer.playNotificationChime();
      toast.success(
        `Reservation ${cancellingBooking.bookingCode || ''} cancelled successfully.`
      );
      setCancellingBooking(null);
      setCancelReason('');
      if (selectedRoom) {
        loadRoomSlots(selectedRoom.name);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel reservation.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Calendar & Booking State (for detailed view)
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState(null);
  const [roomSlots, setRoomSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Booking Form State
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:30',
    requestingDepartment: user?.department || 'Growth and Operations',
    guestName: '',
    visitorCount: 2,
    visitObjective: '',
  });

  // Fetch meeting rooms on mount
  useEffect(() => {
    if (typeof fetchMeetingRooms === 'function') {
      fetchMeetingRooms(true);
    } else if (typeof fetchAllMasterData === 'function') {
      fetchAllMasterData();
    }
  }, [fetchMeetingRooms, fetchAllMasterData]);

  // Use real meeting rooms from database
  const activeRooms = Array.isArray(meetingRooms) ? meetingRooms : [];

  // Filter rooms
  const filteredRooms = activeRooms.filter((room) => {
    const matchesSearch =
      !searchQuery ||
      room.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCap =
      capacityFilter === 'ALL' ||
      (capacityFilter === 'SMALL' && room.capacity <= 10) ||
      (capacityFilter === 'MEDIUM' && room.capacity > 10 && room.capacity <= 18) ||
      (capacityFilter === 'LARGE' && room.capacity > 18);
    return matchesSearch && matchesCap;
  });

  // Load booked slots when a room is selected
  const loadRoomSlots = async (roomName) => {
    if (!roomName) return;
    setIsLoadingSlots(true);
    try {
      const slots = await roomBookingApi.getRoomSlots(roomName);
      const formatted = (Array.isArray(slots) ? slots : []).map((s) => {
        const d = s.scheduledStartTime ? s.scheduledStartTime.split('T')[0] : '';
        const sTime = s.scheduledStartTime
          ? new Date(s.scheduledStartTime).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '';
        const eTime = s.scheduledEndTime
          ? new Date(s.scheduledEndTime).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '';
        return {
          ...s,
          date: d,
          timeFormatted: `${sTime} - ${eTime}`,
        };
      });
      setRoomSlots(formatted);
    } catch (err) {
      console.warn('Failed to load room slots:', err);
      setRoomSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    setFormData((prev) => ({
      ...prev,
      date: new Date().toISOString().split('T')[0],
      visitorCount: Math.min(room.capacity || 10, 4),
    }));
    loadRoomSlots(room.name);
  };

  // Calendar Helpers
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCalendarDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarDate(new Date(year, month + 1, 1));
  };

  // Format date YYYY-MM-DD
  const formatDateKey = (day) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  // Get booked slots for a specific date
  const getSlotsForDate = (dateStr) => {
    return roomSlots.filter((slot) => slot.date === dateStr);
  };

  const activeHoverDateStr = hoveredDate
    ? formatDateKey(hoveredDate)
    : selectedDate
    ? getLocalDateString(selectedDate)
    : null;

  const activeDateSlots = activeHoverDateStr ? getSlotsForDate(activeHoverDateStr) : [];

  const activeFormConflict = getConflictingBooking(
    formData.date,
    formData.startTime,
    formData.endTime,
    roomSlots
  );

  // Form Submit: Instant direct booking without approvals!
  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a meeting or visit title.');
      return;
    }
    if (!formData.startTime || !formData.endTime) {
      toast.error('Please specify meeting start and end times.');
      return;
    }
    if (formData.startTime >= formData.endTime) {
      toast.error('End time must be after start time.');
      return;
    }

    const conflict = getConflictingBooking(
      formData.date,
      formData.startTime,
      formData.endTime,
      roomSlots
    );
    if (conflict) {
      toast.error(
        `Selected time overlaps with an existing booking: ${conflict.meetingTitle || 'Reserved'} (${conflict.timeFormatted || ''})`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const startIso = `${formData.date}T${formData.startTime}:00Z`;
      const endIso = `${formData.date}T${formData.endTime}:00Z`;

      const payload = {
        roomName: selectedRoom.name,
        meetingTitle: formData.title.trim(),
        hostDepartment: selectedRoom.department || user?.department || 'Executive Office',
        scheduledStartTime: startIso,
        scheduledEndTime: endIso,
        expectedAttendees: parseInt(formData.visitorCount, 10) || 1,
        meetingAgenda: formData.visitObjective.trim() || 'Internal boardroom session',
        guestOrganizationName: formData.guestName?.trim() || null,
        guestName: formData.guestName?.trim() || null,
        bookedByName: user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username,
        bookedByEmail: user?.email,
        bookedByUsername: user?.username,
      };

      const result = await roomBookingApi.createBooking(payload);
      soundPlayer.playNotificationChime();
      toast.success(
        `🎉 Room "${selectedRoom.name}" booked successfully! Booking Reference: ${result.bookingCode}`
      );

      // Refresh slots
      loadRoomSlots(selectedRoom.name);

      // Reset form title/objective
      setFormData((prev) => ({
        ...prev,
        title: '',
        visitObjective: '',
        guestName: '',
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book meeting room.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* ========================================================================= */}
      {/* VIEW 1: ROOM CARDS SELECTION (Destination-card style matching Image 1)     */}
      {/* ========================================================================= */}
      {!selectedRoom ? (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#00adef] border border-blue-200 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Executive Facilities & Meeting Spaces</span>
              </div>
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
                Select a Boardroom or Lounge
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Choose a meeting room to view real-time availability and schedule your reservation.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsAdminRosterOpen(true)}
                  icon={ShieldCheck}
                  className="border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                >
                  Super Admin Room Audit
                </Button>
              )}

              {(isAdmin || isSecretary) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openMasterModal('rooms')}
                  icon={SlidersHorizontal}
                >
                  Manage Rooms
                </Button>
              )}

              <Button
                variant="outline-cyan"
                size="sm"
                onClick={() => navigate('/visits?tab=rooms')}
                icon={CalendarDays}
              >
                My Reservations
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/visits')}
                icon={ArrowLeft}
              >
                Visits Register
              </Button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search meeting rooms by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#00adef] focus:outline-none transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={capacityFilter}
                onChange={(e) => setCapacityFilter(e.target.value)}
                className="text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none"
              >
                <option value="ALL">All Capacities</option>
                <option value="SMALL">Small (1 - 10 Seats)</option>
                <option value="MEDIUM">Medium (11 - 18 Seats)</option>
                <option value="LARGE">Large (19+ Seats)</option>
              </select>
            </div>
          </div>

          {/* Room Cards Grid */}
          {filteredRooms.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/90 shadow-xs max-w-md mx-auto my-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#00adef] flex items-center justify-center mx-auto mb-3">
                <Building2 className="w-7 h-7" />
              </div>
              <h3 className="font-heading font-bold text-base text-slate-800">No Meeting Rooms Found</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {searchQuery || capacityFilter !== 'ALL'
                  ? 'No meeting rooms match your filter criteria. Try adjusting your search query.'
                  : 'No meeting rooms have been added to the system yet. Configure rooms in Master Data.'}
              </p>
              {typeof openMasterModal === 'function' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openMasterModal('rooms')}
                  className="mt-4 text-xs font-semibold"
                >
                  Configure Meeting Rooms
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredRooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => handleSelectRoom(room)}
                  className="bg-white rounded-3xl p-3 border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Room Cover Photo */}
                    <div className="w-full h-48 rounded-2xl overflow-hidden relative mb-4 bg-slate-100">
                      <RoomCardImage room={room} />
                      {room.department && (
                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-[#e38524]" />
                            <span>{room.department}</span>
                          </span>
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-slate-800 text-[11px] font-bold shadow-xs flex items-center gap-1">
                          <Users className="w-3 h-3 text-[#00adef]" />
                          <span>{room.capacity || 12} Seats</span>
                        </span>
                      </div>
                    </div>

                    {/* Room Title in CoopBank Blue */}
                    <h3 className="text-[#00adef] font-bold text-base leading-snug group-hover:text-blue-600 transition-colors line-clamp-1">
                      {room.name}
                    </h3>

                    {/* Capacity & Details */}
                    <p className="text-slate-500 text-xs font-medium mt-1 flex items-center gap-1.5 line-clamp-1">
                      <span>👥 Up to {room.capacity || 12} People</span>
                      {room.department && (
                        <>
                          <span>•</span>
                          <span className="text-slate-600 font-bold">{room.department}</span>
                        </>
                      )}
                    </p>
                  </div>

                  {/* Footer Action */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      Available for Booking
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#00adef] group-hover:translate-x-0.5 transition-transform">
                      Book Room →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 2: SPLIT ROOM DETAIL & INTERACTIVE BOOKING WORKSPACE                 */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Top Bar with Back Button & Room Info */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedRoom(null)}
                className="w-10 h-10 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer shrink-0"
                title="Back to All Rooms"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-heading font-black text-xl sm:text-2xl text-slate-900 tracking-tight">
                    {selectedRoom.name}
                  </h1>
                  <Badge variant="info">
                    <Users className="w-3 h-3 mr-1" />
                    {selectedRoom.capacity || 12} Seats
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select your desired date and time slot. No approval required — instant confirmation!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline-cyan"
                size="sm"
                onClick={() => navigate('/visits?tab=rooms')}
                icon={CalendarDays}
              >
                My Reservations
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRoom(null)}
                icon={ArrowLeft}
              >
                Choose Different Room
              </Button>
            </div>
          </div>

          {/* 50/50 Split Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* =================================================================== */}
            {/* LEFT COLUMN: ROOM IMAGE + LARGE INTERACTIVE CALENDAR (~50% width)   */}
            {/* =================================================================== */}
            <div className="lg:col-span-6 space-y-6">
              {/* Room Image Showcase */}
              <div className="w-full h-56 rounded-3xl overflow-hidden relative border border-slate-200 shadow-xs bg-slate-100">
                <RoomCardImage
                  room={selectedRoom}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent flex items-end p-5">
                  <div className="text-white">
                    <p className="text-xs uppercase font-bold tracking-wider text-blue-300">
                      CoopBank Boardroom
                    </p>
                    <h3 className="font-heading font-bold text-lg text-white">
                      {selectedRoom.name}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Large Interactive Calendar */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
                {/* Calendar Header with Month Navigation */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-[#00adef]" />
                    <h2 className="font-heading font-bold text-lg text-slate-800">
                      {monthNames[month]} {year}
                    </h2>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={handlePrevMonth}
                      className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNextMonth}
                      className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Day Names Grid */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-1">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                {/* Calendar Days Matrix */}
                <div className="grid grid-cols-7 gap-1.5">
                  {/* Empty slots for first week padding */}
                  {Array.from({ length: firstDayIndex }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="h-14 rounded-2xl bg-slate-50/50" />
                  ))}

                  {/* Month Days */}
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const dayNumber = idx + 1;
                    const dateKey = formatDateKey(dayNumber);
                    const slots = getSlotsForDate(dateKey);
                    const hasBookings = slots.length > 0;
                    const isSelected =
                      selectedDate &&
                      selectedDate.getFullYear() === year &&
                      selectedDate.getMonth() === month &&
                      selectedDate.getDate() === dayNumber;

                    return (
                      <div
                        key={`day-${dayNumber}`}
                        onClick={() => {
                          const clicked = new Date(year, month, dayNumber);
                          setSelectedDate(clicked);
                          setFormData((prev) => ({
                            ...prev,
                            date: dateKey,
                          }));
                        }}
                        onMouseEnter={() => setHoveredDate(dayNumber)}
                        onMouseLeave={() => setHoveredDate(null)}
                        className={`h-14 p-1.5 rounded-2xl border transition-colors duration-150 cursor-pointer flex flex-col justify-between select-none relative ${
                          isSelected
                            ? 'border-[#00adef] bg-blue-50/60 shadow-xs'
                            : 'border-slate-100 hover:border-blue-300 hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className={`text-xs font-bold pointer-events-none ${
                            isSelected ? 'text-[#00adef]' : 'text-slate-700'
                          }`}
                        >
                          {dayNumber}
                        </span>

                        {hasBookings ? (
                          <div className="flex items-center gap-1 pointer-events-none">
                            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                            <span className="text-[10px] font-bold text-red-600 truncate">
                              {slots.length} Booked
                            </span>
                          </div>
                        ) : (
                          <span className="text-[9px] font-medium text-emerald-600 pointer-events-none">
                            Available
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Interactive Hourly Availability Box (Occupied times disabled) */}
                <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50/80 p-4 rounded-2xl flex flex-col justify-between overflow-hidden">
                  <div className="flex items-center justify-between mb-2 shrink-0">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#00adef]" />
                      <span>
                        Hourly Schedule on{' '}
                        {activeHoverDateStr
                          ? new Date(activeHoverDateStr + 'T00:00:00').toLocaleDateString(
                              'en-US',
                              { month: 'short', day: 'numeric', year: 'numeric' }
                            )
                          : 'Selected Date'}
                      </span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      (Occupied hours are disabled)
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto pr-1 space-y-1.5">
                    {STANDARD_BUSINESS_SLOTS.map((slot) => {
                      const conflict = getConflictingBooking(
                        activeHoverDateStr,
                        slot.start,
                        slot.end,
                        roomSlots
                      );
                      const isOccupied = Boolean(conflict);
                      const isCurrentFormSlot =
                        formData.date === activeHoverDateStr &&
                        formData.startTime === slot.start &&
                        formData.endTime === slot.end;

                      if (isOccupied) {
                        const isOwner = user && conflict && (
                          (conflict.bookedByUserId && user.id && String(conflict.bookedByUserId).toLowerCase() === String(user.id).toLowerCase()) ||
                          (conflict.bookedByEmail && user.email && conflict.bookedByEmail.trim().toLowerCase() === user.email.trim().toLowerCase()) ||
                          (conflict.bookedByUsername && user.username && conflict.bookedByUsername.trim().toLowerCase() === user.username.trim().toLowerCase()) ||
                          (conflict.bookedByName && user.fullName && conflict.bookedByName.trim().toLowerCase() === user.fullName.trim().toLowerCase())
                        );
                        const canCancelSlot = isAdmin || isSecretary || isOwner;

                        return (
                          <div
                            key={slot.label}
                            className="flex items-center justify-between px-3 py-2 rounded-xl bg-rose-50/80 border border-rose-200/90 text-rose-700 text-xs font-semibold select-none"
                            title={`Occupied: ${conflict.meetingTitle || 'Reserved'} (${conflict.timeFormatted || slot.label})`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                              <span className="font-mono line-through text-rose-600">{slot.label}</span>
                              <span className="text-[11px] text-rose-600 truncate max-w-[150px]">
                                • {conflict.meetingTitle || 'Booked Session'}
                              </span>
                              {isOwner && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-rose-200 text-rose-800">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold uppercase flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                Occupied
                              </span>
                              {canCancelSlot && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCancellingBooking(conflict);
                                  }}
                                  className="px-2 py-0.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold uppercase transition-colors cursor-pointer shadow-xs"
                                  title="Cancel this reservation"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={slot.label}
                          onClick={() => {
                            if (activeHoverDateStr) {
                              const [y, m, d] = activeHoverDateStr.split('-').map(Number);
                              setSelectedDate(new Date(y, m - 1, d));
                              setFormData((prev) => ({
                                ...prev,
                                date: activeHoverDateStr,
                                startTime: slot.start,
                                endTime: slot.end,
                              }));
                            }
                          }}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            isCurrentFormSlot
                              ? 'bg-[#00adef] text-white border-[#00adef] shadow-xs'
                              : 'bg-emerald-50/80 border-emerald-200/80 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300'
                          }`}
                          title={`Available: Click to select ${slot.label}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${isCurrentFormSlot ? 'bg-white' : 'bg-emerald-500'}`} />
                            <span className="font-mono">{slot.label}</span>
                            <span className={`text-[11px] ${isCurrentFormSlot ? 'text-white/90' : 'text-emerald-700'}`}>
                              • Available
                            </span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase shrink-0 ${
                              isCurrentFormSlot
                                ? 'bg-white/20 text-white'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isCurrentFormSlot ? 'Selected' : 'Open • Select'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* =================================================================== */}
            {/* RIGHT COLUMN: BOOKING RESERVATION FORM (~50% width)                 */}
            {/* =================================================================== */}
            <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase tracking-wider mb-2">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Instant Confirmation</span>
                </div>
                <h2 className="font-heading font-black text-xl text-slate-900 tracking-tight">
                  Book {selectedRoom.name}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Fill in meeting parameters. Direct reservation requires no approver delay.
                </p>
              </div>

              {/* Booking Form */}
              <form onSubmit={handleSubmitBooking} className="space-y-4">
                {/* Meeting Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Meeting / Visit Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. FinTech Integration Review"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#00adef] focus:outline-none transition-all"
                  />
                </div>

                {/* Date Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Reservation Date <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Synchronized with calendar view
                    </span>
                  </div>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setFormData((prev) => ({ ...prev, date: newDate }));
                      if (newDate) {
                        const [y, m, d] = newDate.split('-').map(Number);
                        setSelectedDate(new Date(y, m - 1, d));
                        setCalendarDate(new Date(y, m - 1, 1));
                      }
                    }}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#00adef] focus:outline-none transition-all"
                  />
                </div>

                {/* Quick Time Slots (Occupied Times Disabled) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">
                      Select Standard Time Slot <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-medium">
                      Occupied slots are locked & disabled
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {STANDARD_BUSINESS_SLOTS.map((slot) => {
                      const conflict = getConflictingBooking(
                        formData.date,
                        slot.start,
                        slot.end,
                        roomSlots
                      );
                      const isOccupied = Boolean(conflict);
                      const isSelectedSlot =
                        formData.startTime === slot.start &&
                        formData.endTime === slot.end;

                      if (isOccupied) {
                        return (
                          <button
                            key={slot.label}
                            type="button"
                            disabled={true}
                            title={`Unavailable: Already booked for "${conflict.meetingTitle || 'Meeting'}" (${conflict.timeFormatted || slot.label})`}
                            className="p-2 rounded-xl border border-rose-200 bg-rose-50/70 text-rose-500 text-[11px] font-mono font-medium flex flex-col items-center justify-center gap-1 cursor-not-allowed opacity-75 select-none transition-all"
                          >
                            <span className="line-through">{slot.label}</span>
                            <span className="flex items-center gap-0.5 text-[9px] font-bold text-rose-600 uppercase bg-rose-100/90 px-1 py-0.2 rounded">
                              <Lock className="w-2.5 h-2.5" />
                              Occupied
                            </span>
                          </button>
                        );
                      }

                      return (
                        <button
                          key={slot.label}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              startTime: slot.start,
                              endTime: slot.end,
                            }))
                          }
                          className={`p-2 rounded-xl border text-[11px] font-mono font-medium flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                            isSelectedSlot
                              ? 'bg-[#00adef] text-white border-[#00adef] shadow-xs font-bold ring-2 ring-[#00adef]/30'
                              : 'bg-emerald-50/80 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100 hover:border-emerald-300'
                          }`}
                        >
                          <span>{slot.label}</span>
                          <span
                            className={`text-[9px] font-bold uppercase px-1 py-0.2 rounded ${
                              isSelectedSlot
                                ? 'bg-white/20 text-white'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {isSelectedSlot ? 'Selected' : 'Open'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Start & End Time Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                      className={`w-full px-3 py-2 text-xs rounded-xl border transition-all focus:outline-none ${
                        activeFormConflict
                          ? 'border-rose-400 bg-rose-50/60 text-rose-900 focus:border-rose-500'
                          : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-[#00adef]'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.endTime}
                      onChange={(e) =>
                        setFormData({ ...formData, endTime: e.target.value })
                      }
                      className={`w-full px-3 py-2 text-xs rounded-xl border transition-all focus:outline-none ${
                        activeFormConflict
                          ? 'border-rose-400 bg-rose-50/60 text-rose-900 focus:border-rose-500'
                          : 'border-slate-200 bg-slate-50 focus:bg-white focus:border-[#00adef]'
                      }`}
                    />
                  </div>
                </div>

                {/* Overlap / Occupied Warning Banner */}
                {activeFormConflict && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 animate-fadeIn">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="font-bold text-rose-900">
                        Selected Time Is Occupied & Disabled
                      </p>
                      <p className="text-[11px] leading-relaxed text-rose-700">
                        This room is already reserved for{' '}
                        <span className="font-bold text-rose-900">
                          "{activeFormConflict.meetingTitle || 'Staff Meeting'}"
                        </span>{' '}
                        (
                        <span className="font-mono font-bold">
                          {activeFormConflict.timeFormatted || `${formData.startTime} - ${formData.endTime}`}
                        </span>
                        ). Please choose an unoccupied time slot above.
                      </p>
                    </div>
                  </div>
                )}

                {/* Department & Expected Attendees */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Room Managing Department
                    </label>
                    <div className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 text-slate-800 font-semibold flex items-center gap-1.5 h-[38px]">
                      <Building2 className="w-3.5 h-3.5 text-[#00adef]" />
                      <span>{selectedRoom.department || 'General Facility'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Expected Attendees (Max {selectedRoom.capacity || 20})
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={selectedRoom.capacity || 50}
                      value={formData.visitorCount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          visitorCount: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Guest Organization / Visitor Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Guest Organization or VIP Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ethio Telecom or Internal Steering Team"
                    value={formData.guestName}
                    onChange={(e) =>
                      setFormData({ ...formData, guestName: e.target.value })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Meeting Agenda / Purpose */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Meeting Agenda / Purpose
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe the purpose of this meeting or visit..."
                    value={formData.visitObjective}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        visitObjective: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>

                {/* Info Notice */}
                <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/80 text-xs text-blue-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Info className="w-4 h-4 text-[#00adef]" />
                    <span>Instant Booking Policy</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-blue-700">
                    Your reservation will be immediately confirmed without requiring executive approval. An email notification will be dispatched to the System Administrator upon submission.
                  </p>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    variant={activeFormConflict ? 'outline' : 'orange'}
                    size="lg"
                    disabled={isSubmitting || Boolean(activeFormConflict)}
                    className={`w-full justify-center py-3 text-sm font-bold shadow-md transition-all ${
                      activeFormConflict
                        ? 'opacity-60 cursor-not-allowed border-rose-300 text-rose-600 bg-rose-50 hover:bg-rose-50'
                        : 'hover:shadow-lg'
                    }`}
                  >
                    {isSubmitting
                      ? 'Booking Room...'
                      : activeFormConflict
                      ? 'Time Slot Occupied (Disabled)'
                      : `Confirm & Book ${selectedRoom.name}`}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Audit Roster Modal */}
      {isAdmin && (
        <AdminRoomBookingsModal
          isOpen={isAdminRosterOpen}
          onClose={() => setIsAdminRosterOpen(false)}
        />
      )}

      {/* Master Data Management Modal (for Admins) */}
      <MasterDataManagementModal />

      {/* Cancel Room Booking Confirmation Modal */}
      {cancellingBooking && (
        <Modal
          isOpen={true}
          onClose={() => !isCancelling && setCancellingBooking(null)}
          title={`Cancel Reservation • ${cancellingBooking.bookingCode || 'Room Booking'}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-rose-900 text-sm">
                  Cancel This Room Reservation?
                </p>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  Are you sure you want to cancel this booking for "{selectedRoom?.name || cancellingBooking.roomName}"? The slot will immediately open up for other staff meetings.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex justify-between items-center text-slate-700">
                <span className="text-slate-400 font-medium">Meeting Title:</span>
                <span className="font-bold text-slate-900 truncate max-w-[200px]">
                  {cancellingBooking.meetingTitle || 'Scheduled Meeting'}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span className="text-slate-400 font-medium">Time Window:</span>
                <span className="font-mono text-slate-900">
                  {cancellingBooking.timeFormatted || `${cancellingBooking.scheduledStartTime || ''}`}
                </span>
              </div>
            </div>

            {/* Cancellation Reason Input */}
            <div className="space-y-1.5 text-left">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Reason for Cancellation <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please state why this booking is being cancelled..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00adef]/20 focus:border-[#00adef] bg-slate-50 focus:bg-white placeholder:text-slate-400 resize-none transition-all"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Meeting Postponed', 'Client Rescheduled', 'Moved to Virtual Call', 'Emergency / Illness', 'Room Conflict'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCancelReason(preset)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors font-medium cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCancellingBooking(null);
                  setCancelReason('');
                }}
                disabled={isCancelling}
              >
                Keep Booking
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmCancel}
                disabled={isCancelling || !cancelReason.trim()}
                className="font-bold shadow-md"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm & Release Room'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default VisitCalendarPage;
