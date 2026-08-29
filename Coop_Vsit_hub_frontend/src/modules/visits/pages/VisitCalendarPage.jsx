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
} from 'lucide-react';
import { toast } from 'sonner';
import useAuthStore from '@/modules/auth/store/authStore';
import useMasterDataStore from '@/modules/master_data/store/masterDataStore';
import visitApi from '../api/visitApi';
import soundPlayer from '@/core/utils/soundPlayer';
import Button from '@/shared/components/ui/Button';
import Badge from '@/shared/components/ui/Badge';
import AdminRoomBookingsModal from '../components/AdminRoomBookingsModal';
import MasterDataManagementModal from '@/modules/master_data/components/MasterDataManagementModal';

export const VisitCalendarPage = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuthStore();
  const isAdmin = hasRole('ROLE_ADMIN');

  const { meetingRooms, fetchMeetingRooms, fetchAllMasterData, openMasterModal } =
    useMasterDataStore();

  // State
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('ALL');
  const [isAdminRosterOpen, setIsAdminRosterOpen] = useState(false);

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

  // Default rooms fallback if DB has none yet
  const defaultRooms = [
    {
      id: 'default-1',
      name: 'Executive Boardroom - 4th Floor',
      capacity: 18,
      imageUrl:
        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'default-2',
      name: 'FinTech Innovation Room A - 4th Floor',
      capacity: 12,
      imageUrl:
        'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'default-3',
      name: 'Strategic Peering Room B - 4th Floor',
      capacity: 10,
      imageUrl:
        'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'default-4',
      name: 'CoopBank HQ VIP Lounge - Ground Floor',
      capacity: 25,
      imageUrl:
        'https://images.unsplash.com/photo-1577412647305-991150c7d163?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const activeRooms = meetingRooms.length > 0 ? meetingRooms : defaultRooms;

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
      const slots = await visitApi.getRoomSlots(roomName);
      setRoomSlots(Array.isArray(slots) ? slots : []);
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
    ? selectedDate.toISOString().split('T')[0]
    : null;

  const activeDateSlots = activeHoverDateStr ? getSlotsForDate(activeHoverDateStr) : [];

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

    setIsSubmitting(true);
    try {
      const startIso = `${formData.date}T${formData.startTime}:00Z`;
      const endIso = `${formData.date}T${formData.endTime}:00Z`;

      const payload = {
        title: formData.title.trim(),
        requestingDepartment: formData.requestingDepartment.trim(),
        locationRoom: selectedRoom.name,
        scheduledStartTime: startIso,
        scheduledEndTime: endIso,
        visitorCount: parseInt(formData.visitorCount, 10) || 1,
        visitObjective: formData.visitObjective.trim() || 'Internal boardroom session',
        visitType: 'INTERNAL',
        priorityLevel: 'MEDIUM',
        guestCategory: 'INDIVIDUAL',
        individualGuestFirstName: formData.guestName || user?.firstName || 'Host',
        individualGuestLastName: user?.lastName || 'Staff',
        isDraft: false,
        directBooking: true,
      };

      await visitApi.createVisit(payload);
      soundPlayer.playNotificationChime();
      toast.success(
        `🎉 Room "${selectedRoom.name}" booked successfully! Confirmation registered and email sent to Admin.`
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
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAdminRosterOpen(true)}
                    icon={ShieldCheck}
                    className="border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                  >
                    Super Admin Room Audit
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openMasterModal('rooms')}
                    icon={SlidersHorizontal}
                  >
                    Manage Rooms
                  </Button>
                </>
              )}

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

          {/* Room Cards Grid (Matching Reference Image) */}
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
                    <img
                      src={
                        room.imageUrl ||
                        'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'
                      }
                      alt={room.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
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
                  <p className="text-slate-500 text-xs font-medium mt-1 flex items-center gap-1.5">
                    <span>👥 Up to {room.capacity || 12} People</span>
                    <span>•</span>
                    <span>High-Speed AV & Screen</span>
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

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedRoom(null)}
            >
              Choose Different Room
            </Button>
          </div>

          {/* 50/50 Split Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* =================================================================== */}
            {/* LEFT COLUMN: ROOM IMAGE + LARGE INTERACTIVE CALENDAR (~50% width)   */}
            {/* =================================================================== */}
            <div className="lg:col-span-6 space-y-6">
              {/* Room Image Showcase */}
              <div className="w-full h-56 rounded-3xl overflow-hidden relative border border-slate-200 shadow-xs bg-slate-100">
                <img
                  src={
                    selectedRoom.imageUrl ||
                    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'
                  }
                  alt={selectedRoom.name}
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
                        className={`h-14 p-1.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none relative ${
                          isSelected
                            ? 'border-[#00adef] bg-blue-50/60 shadow-xs'
                            : 'border-slate-100 hover:border-blue-300 hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className={`text-xs font-bold ${
                            isSelected ? 'text-[#00adef]' : 'text-slate-700'
                          }`}
                        >
                          {dayNumber}
                        </span>

                        {hasBookings ? (
                          <div className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                            <span className="text-[10px] font-bold text-red-600 truncate">
                              {slots.length} Booked
                            </span>
                          </div>
                        ) : (
                          <span className="text-[9px] font-medium text-emerald-600">
                            Available
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Interactive Hourly Availability Box (Hover or Selected Day) */}
                <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/80 p-4 rounded-2xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#00adef]" />
                      Schedule on{' '}
                      {activeHoverDateStr
                        ? new Date(activeHoverDateStr + 'T00:00:00').toLocaleDateString(
                            'en-US',
                            { month: 'short', day: 'numeric', year: 'numeric' }
                          )
                        : 'Selected Date'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      (Hover over calendar days to inspect)
                    </span>
                  </div>

                  {activeDateSlots.length > 0 ? (
                    <div className="space-y-1.5">
                      {activeDateSlots.map((slot, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-3 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-semibold"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            <span>{slot.timeFormatted || 'Reserved Hours'}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 text-[10px] font-bold uppercase">
                            Booked
                          </span>
                        </div>
                      ))}
                      <p className="text-[11px] text-emerald-600 font-medium mt-1">
                        ✓ Other remaining hours on this date are open for booking.
                      </p>
                    </div>
                  ) : (
                    <div className="px-3 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span>Entire day is currently open. No scheduled bookings yet.</span>
                    </div>
                  )}
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

                {/* Date & Times (Multi-slot booking support) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Reservation Date
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                    />
                  </div>

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
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
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
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Department & Expected Attendees */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Host Department
                    </label>
                    <input
                      type="text"
                      value={formData.requestingDepartment}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          requestingDepartment: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                    />
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
                    variant="orange"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full justify-center py-3 text-sm font-bold shadow-md hover:shadow-lg"
                  >
                    {isSubmitting ? 'Booking Room...' : `Confirm & Book ${selectedRoom.name}`}
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
    </div>
  );
};

export default VisitCalendarPage;
