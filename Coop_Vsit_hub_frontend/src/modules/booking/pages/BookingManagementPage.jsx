import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  CalendarDays,
  Clock,
  DoorOpen,
  User,
  Building2,
  Search,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
  Filter,
  X,
  Mail,
  Info,
  ArrowLeft,
  Users,
  CheckCircle,
  Check,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import roomBookingApi from '../api/roomBookingApi';
import useAuthStore from '@/modules/auth/store/authStore';
import useMasterDataStore from '@/modules/master_data/store/masterDataStore';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Spinner from '@/shared/components/ui/Spinner';
import Modal from '@/shared/components/ui/Modal';

export const BookingManagementPage = () => {
  const { user, hasRole } = useAuthStore();
  const { meetingRooms, fetchAllMasterData } = useMasterDataStore();

  // Selected Room for detailed calendar schedule inspector
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomSlots, setRoomSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Calendar Date State for the selected room
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState(null);

  // Room search & capacity filter for room cards
  const [roomSearch, setRoomSearch] = useState('');
  const [roomCapacityFilter, setRoomCapacityFilter] = useState('ALL');

  // Recent Bookings Ledger State
  const [bookings, setBookings] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  // Ledger Filters
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [ledgerRoomFilter, setLedgerRoomFilter] = useState('');
  const [ledgerStatusFilter, setLedgerStatusFilter] = useState('');

  // Cancel Modal State
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Detail Modal State
  const [inspectingBooking, setInspectingBooking] = useState(null);

  const isAdmin = hasRole('ROLE_ADMIN');

  // Fetch recent bookings ledger
  const fetchBookings = useCallback(async () => {
    setIsLoadingBookings(true);
    try {
      const data = await roomBookingApi.getBookings({
        search: ledgerSearch.trim() || undefined,
        roomName: ledgerRoomFilter || undefined,
        status: ledgerStatusFilter || undefined,
        page: currentPage,
        size: pageSize,
        sortBy: 'scheduledStartTime',
        sortDirection: 'desc',
      });
      setBookings(data.content || []);
      setTotalElements(data.totalElements || 0);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      console.error('Failed to load room bookings:', e);
      toast.error('Failed to load room reservations roster.');
    } finally {
      setIsLoadingBookings(false);
    }
  }, [ledgerSearch, ledgerRoomFilter, ledgerStatusFilter, currentPage, pageSize]);

  // Load booked slots for the selected room
  const loadRoomSlots = useCallback(async (roomName) => {
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
  }, []);

  useEffect(() => {
    fetchAllMasterData();
  }, [fetchAllMasterData]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    if (selectedRoom) {
      loadRoomSlots(selectedRoom.name);
    }
  }, [selectedRoom, loadRoomSlots]);

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    setCalendarDate(new Date());
    setSelectedDate(new Date());
  };

  const handleCancelConfirm = async () => {
    if (!cancellingBooking) return;
    setIsCancelling(true);
    try {
      await roomBookingApi.cancelBooking(cancellingBooking.id);
      toast.success(`Booking ${cancellingBooking.bookingCode} cancelled successfully.`);
      setCancellingBooking(null);
      fetchBookings();
      if (selectedRoom) {
        loadRoomSlots(selectedRoom.name);
      }
    } catch (e) {
      toast.error('Failed to cancel room booking.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Filtered rooms for directory
  const activeRooms = meetingRooms && meetingRooms.length > 0 ? meetingRooms : [
    {
      id: '1',
      name: 'Executive Boardroom',
      capacity: 20,
      imageUrl: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: '2',
      name: 'CoopBank HQ VIP Lounge',
      capacity: 12,
      imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: '3',
      name: 'FinTech Innovation Lab',
      capacity: 16,
      imageUrl: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: '4',
      name: 'Strategic Operations Room',
      capacity: 10,
      imageUrl: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const filteredRooms = activeRooms.filter((room) => {
    const matchesSearch =
      !roomSearch || room.name?.toLowerCase().includes(roomSearch.toLowerCase());
    const matchesCap =
      roomCapacityFilter === 'ALL' ||
      (roomCapacityFilter === 'SMALL' && room.capacity <= 10) ||
      (roomCapacityFilter === 'MEDIUM' && room.capacity > 10 && room.capacity <= 18) ||
      (roomCapacityFilter === 'LARGE' && room.capacity > 18);
    return matchesSearch && matchesCap;
  });

  // Calendar Helpers for Selected Room
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const formatDateKey = (day) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  const getSlotsForDate = (dateStr) => {
    return roomSlots.filter((slot) => slot.date === dateStr);
  };

  const activeHoverDateStr = hoveredDate
    ? formatDateKey(hoveredDate)
    : selectedDate
    ? selectedDate.toISOString().split('T')[0]
    : null;

  const activeDateSlots = activeHoverDateStr ? getSlotsForDate(activeHoverDateStr) : [];
  const selectedDateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : '';
  const selectedDateBookings = selectedDateStr ? getSlotsForDate(selectedDateStr) : [];

  return (
    <div className="space-y-8 pb-16 animate-fadeIn">
      {/* ========================================================================= */}
      {/* VIEW 1: MEETING ROOMS DIRECTORY & ALL BOOKINGS LEDGER                     */}
      {/* ========================================================================= */}
      {!selectedRoom ? (
        <div className="space-y-8">
          {/* Header Banner */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00adef] to-[#0081b5] text-white flex items-center justify-center shadow-md shrink-0">
                <DoorOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-heading font-black text-2xl text-slate-900 tracking-tight">
                    Booking Management
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-[#00adef] border border-sky-200 text-xs font-bold">
                    {totalElements} Total Bookings
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspect meeting rooms, view detailed calendar schedules, and audit who booked each facility.
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={fetchBookings}
              disabled={isLoadingBookings}
              icon={RotateCcw}
            >
              Refresh Data
            </Button>
          </div>

          {/* SECTION 1: MEETING ROOMS DIRECTORY */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
                  <DoorOpen className="w-5 h-5 text-[#e38524]" />
                  <span>Meeting Rooms & Boardrooms</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Click on any room to inspect its live booking calendar and see who booked it per date.
                </p>
              </div>

              {/* Room Search & Capacity Filter */}
              <div className="flex items-center gap-2">
                <div className="relative w-48 sm:w-60">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search rooms..."
                    value={roomSearch}
                    onChange={(e) => setRoomSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#00adef]"
                  />
                </div>

                <select
                  value={roomCapacityFilter}
                  onChange={(e) => setRoomCapacityFilter(e.target.value)}
                  className="text-xs font-medium border border-slate-200 rounded-xl px-2.5 py-1.5 bg-white focus:outline-none"
                >
                  <option value="ALL">All Sizes</option>
                  <option value="SMALL">1-10 Seats</option>
                  <option value="MEDIUM">11-18 Seats</option>
                  <option value="LARGE">19+ Seats</option>
                </select>
              </div>
            </div>

            {/* Room Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredRooms.map((room) => (
                <div
                  key={room.id}
                  onClick={() => handleSelectRoom(room)}
                  className="bg-white rounded-3xl p-3 border border-slate-200/90 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="w-full h-44 rounded-2xl overflow-hidden relative mb-3 bg-slate-100">
                      <img
                        src={
                          room.imageUrl ||
                          'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'
                        }
                        alt={room.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-2.5 right-2.5">
                        <span className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-xs text-slate-800 text-[10px] font-bold shadow-xs flex items-center gap-1">
                          <Users className="w-3 h-3 text-[#00adef]" />
                          <span>{room.capacity || 12} Seats</span>
                        </span>
                      </div>
                    </div>

                    <h3 className="text-[#00adef] font-bold text-sm leading-snug group-hover:text-blue-600 transition-colors line-clamp-1">
                      {room.name}
                    </h3>
                    <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-1">
                      Executive boardroom & meeting suite
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400 font-medium">
                      Inspect Schedule
                    </span>
                    <span className="text-xs font-bold text-[#00adef] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      <span>View Calendar</span>
                      <span>→</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: MOST RECENT BOOKINGS LEDGER */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div>
              <h2 className="font-heading font-bold text-lg text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#00adef]" />
                <span>Most Recent Bookings Ledger</span>
              </h2>
              <p className="text-xs text-slate-500">
                Central register of all recent room bookings across the bank.
              </p>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex flex-1 flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search reference, meeting title, staff name, or organization..."
                    value={ledgerSearch}
                    onChange={(e) => {
                      setLedgerSearch(e.target.value);
                      setCurrentPage(0);
                    }}
                    className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-[#00adef] transition-all"
                  />
                  {ledgerSearch && (
                    <button
                      onClick={() => setLedgerSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={ledgerRoomFilter}
                  onChange={(e) => {
                    setLedgerRoomFilter(e.target.value);
                    setCurrentPage(0);
                  }}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none text-slate-700"
                >
                  <option value="">All Rooms</option>
                  {activeRooms.map((r) => (
                    <option key={r.id || r.name} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>

                <select
                  value={ledgerStatusFilter}
                  onChange={(e) => {
                    setLedgerStatusFilter(e.target.value);
                    setCurrentPage(0);
                  }}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none text-slate-700"
                >
                  <option value="">All Statuses</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-5">Booking Reference</th>
                      <th className="py-3.5 px-4">Room & Meeting</th>
                      <th className="py-3.5 px-4">Reserved Schedule</th>
                      <th className="py-3.5 px-4">Booked By (Staff / AD)</th>
                      <th className="py-3.5 px-4">Affiliated Party</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {isLoadingBookings ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <Spinner size="lg" className="mx-auto text-[#00adef] mb-2" />
                          <p className="font-medium text-xs">Loading reservations...</p>
                        </td>
                      </tr>
                    ) : bookings.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          <DoorOpen className="w-10 h-10 mx-auto text-slate-300 mb-1.5" />
                          <p className="font-bold text-xs text-slate-700">No room bookings found</p>
                        </td>
                      </tr>
                    ) : (
                      bookings.map((booking) => {
                        const sDate = booking.scheduledStartTime
                          ? new Date(booking.scheduledStartTime).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'N/A';
                        const sTime = booking.scheduledStartTime
                          ? new Date(booking.scheduledStartTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '';
                        const eTime = booking.scheduledEndTime
                          ? new Date(booking.scheduledEndTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '';

                        const isConfirmed = booking.status === 'CONFIRMED';
                        const canCancel = isConfirmed && (isAdmin || user?.id === booking.bookedByUserId);

                        return (
                          <tr
                            key={booking.id}
                            className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                            onClick={() => setInspectingBooking(booking)}
                          >
                            <td className="py-3.5 px-5">
                              <span className="font-mono font-bold text-[#00adef] text-xs">
                                {booking.bookingCode}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 max-w-xs">
                              <div className="flex items-center gap-1.5">
                                <DoorOpen className="w-3.5 h-3.5 text-[#e38524] shrink-0" />
                                <span className="font-bold text-slate-900 truncate">
                                  {booking.roomName}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 font-medium truncate mt-0.5">
                                {booking.meetingTitle}
                              </p>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>{sDate}</span>
                              </div>
                              <div className="flex items-center gap-1 text-slate-500 text-[11px] mt-0.5">
                                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>
                                  {sTime} - {eTime}
                                </span>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-[#00adef] shrink-0" />
                                <span className="font-bold text-slate-800">
                                  {booking.bookedByName || 'Staff Member'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {booking.hostDepartment || 'CoopBank'}
                              </p>
                            </td>

                            <td className="py-3.5 px-4">
                              {booking.guestOrganizationName ? (
                                <div className="flex items-center gap-1 text-slate-800 font-semibold">
                                  <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="truncate">{booking.guestOrganizationName}</span>
                                </div>
                              ) : booking.guestName ? (
                                <span className="text-slate-700 font-medium truncate">
                                  {booking.guestName}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Internal Session</span>
                              )}
                            </td>

                            <td className="py-3.5 px-4">
                              {isConfirmed ? (
                                <Badge variant="success" size="sm">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Confirmed
                                </Badge>
                              ) : (
                                <Badge variant="danger" size="sm">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Cancelled
                                </Badge>
                              )}
                            </td>

                            <td className="py-3.5 px-5 text-right">
                              <div
                                className="flex items-center justify-end gap-1.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  onClick={() => setInspectingBooking(booking)}
                                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                                  title="View Details"
                                >
                                  <Info className="w-4 h-4" />
                                </button>

                                {canCancel && (
                                  <button
                                    onClick={() => setCancellingBooking(booking)}
                                    className="px-2 py-1 text-[11px] font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
                                    title="Cancel Reservation"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="p-3.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Page <span className="font-bold text-slate-800">{currentPage + 1}</span> of{' '}
                    <span className="font-bold text-slate-800">{totalPages}</span> ({totalElements} total)
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                      disabled={currentPage === 0 || isLoadingBookings}
                      className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={currentPage >= totalPages - 1 || isLoadingBookings}
                      className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 disabled:opacity-30 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* VIEW 2: DETAILED ROOM BOOKINGS SCHEDULE & CALENDAR (LIKE BOOKING PAGE)    */
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
                  Inspect confirmed reservations, schedules, and staff bookings for this room.
                </p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedRoom(null)}
              icon={ArrowLeft}
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
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent flex items-end p-5">
                  <div className="text-white">
                    <p className="text-xs uppercase font-bold tracking-wider text-blue-300">
                      CoopBank Meeting Facility
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
                    <CalendarDays className="w-5 h-5 text-[#00adef]" />
                    <h2 className="font-heading font-bold text-lg text-slate-800">
                      {monthNames[month]} {year}
                    </h2>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCalendarDate(new Date(year, month - 1, 1))}
                      className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCalendarDate(new Date(year, month + 1, 1))}
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
                  {Array.from({ length: firstDayIndex }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="h-14 rounded-2xl bg-slate-50/50" />
                  ))}

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
                        onClick={() => setSelectedDate(new Date(year, month, dayNumber))}
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

                {/* Locked Stable Height Availability Inspector */}
                <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50/80 p-4 rounded-2xl h-32 flex flex-col justify-between overflow-hidden">
                  <div className="flex items-center justify-between mb-1.5 shrink-0">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#00adef]" />
                      Schedule on{' '}
                      {activeHoverDateStr
                        ? new Date(activeHoverDateStr + 'T00:00:00').toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Selected Date'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      (Click date to see full staff details)
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto pr-1">
                    {activeDateSlots.length > 0 ? (
                      <div className="space-y-1.5">
                        {activeDateSlots.map((slot, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-red-50 text-red-700 border border-red-200 text-xs font-semibold"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-red-500" />
                              <span>{slot.timeFormatted || 'Reserved Hours'}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-800 text-[10px] font-bold uppercase">
                              Booked by {slot.bookedByName}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-3 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Entire day is currently open. No scheduled bookings.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* =================================================================== */}
            {/* RIGHT COLUMN: DETAILED RESERVATIONS ROSTER ON SELECTED DATE (~50%)  */}
            {/* =================================================================== */}
            <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-sky-50 text-[#00adef] border border-sky-200 text-xs font-bold uppercase tracking-wider mb-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Selected Date Schedule</span>
                  </div>
                  <h2 className="font-heading font-black text-xl text-slate-900 tracking-tight">
                    {selectedDate
                      ? selectedDate.toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'No Date Selected'}
                  </h2>
                </div>

                <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">
                  {selectedDateBookings.length} Booking(s)
                </span>
              </div>

              {/* Bookings on Selected Date */}
              {isLoadingSlots ? (
                <div className="py-12 text-center text-slate-400">
                  <Spinner size="md" className="mx-auto text-[#00adef] mb-2" />
                  <p className="text-xs">Loading schedule details...</p>
                </div>
              ) : selectedDateBookings.length === 0 ? (
                <div className="p-8 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h3 className="font-bold text-sm text-emerald-900">
                    No Bookings on this Date
                  </h3>
                  <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                    {selectedRoom.name} is completely unreserved and available for staff meetings on this day.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs font-semibold text-slate-600">
                    Confirmed staff reservations scheduled for {selectedRoom.name}:
                  </p>

                  <div className="space-y-3">
                    {selectedDateBookings.map((b) => {
                      const canCancel = isAdmin || user?.id === b.bookedByUserId;

                      return (
                        <div
                          key={b.id}
                          className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition-all space-y-3 shadow-xs"
                        >
                          {/* Header: Title & Code */}
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-[#00adef]">
                                {b.bookingCode}
                              </span>
                              <h4 className="font-bold text-sm text-slate-900 mt-1">
                                {b.meetingTitle}
                              </h4>
                            </div>

                            <Badge variant="success" size="sm">
                              Confirmed
                            </Badge>
                          </div>

                          {/* Schedule Hours & Headcount */}
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/80">
                            <div className="flex items-center gap-1.5 font-semibold text-[#00adef]">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{b.timeFormatted}</span>
                            </div>
                            <span className="text-slate-300">•</span>
                            <div className="flex items-center gap-1 text-slate-600">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              <span>{b.expectedAttendees || 1} Attendees</span>
                            </div>
                          </div>

                          {/* WHO BOOKED IT (Staff Profile from Active Directory) */}
                          <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1.5">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                              <User className="w-3 h-3 text-[#00adef]" />
                              <span>Booked By (Staff / Active Directory)</span>
                            </p>
                            <div className="text-xs">
                              <p className="font-bold text-slate-900">{b.bookedByName}</p>
                              {b.hostDepartment && (
                                <p className="text-slate-500 text-[11px]">
                                  Department: <span className="font-medium text-slate-700">{b.hostDepartment}</span>
                                </p>
                              )}
                              {b.bookedByEmail && (
                                <p className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                                  <Mail className="w-3 h-3 text-slate-400" />
                                  <span>{b.bookedByEmail}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Affiliated Guest or Org */}
                          {(b.guestOrganizationName || b.guestName) && (
                            <div className="flex items-center gap-2 text-xs text-slate-700 px-1">
                              <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="text-slate-500">Affiliated Party:</span>
                              <span className="font-bold text-slate-900">
                                {b.guestOrganizationName || b.guestName}
                              </span>
                            </div>
                          )}

                          {/* Agenda if provided */}
                          {b.meetingAgenda && (
                            <p className="text-[11px] text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100">
                              "{b.meetingAgenda}"
                            </p>
                          )}

                          {/* Cancel Action */}
                          {canCancel && (
                            <div className="flex justify-end pt-1">
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => setCancellingBooking(b)}
                              >
                                Cancel Reservation
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inspect Booking Detail Modal */}
      {inspectingBooking && (
        <Modal
          isOpen={true}
          onClose={() => setInspectingBooking(null)}
          title={`Booking Details • ${inspectingBooking.bookingCode}`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-100 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00adef] text-white flex items-center justify-center shrink-0 shadow-xs">
                <DoorOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-sm text-slate-900">
                  {inspectingBooking.roomName}
                </h3>
                <p className="font-semibold text-xs text-sky-800 mt-0.5">
                  {inspectingBooking.meetingTitle}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Status:{' '}
                  <span
                    className={`font-bold ${
                      inspectingBooking.status === 'CONFIRMED'
                        ? 'text-emerald-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {inspectingBooking.status}
                  </span>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Date & Time</p>
                <p className="font-bold text-slate-800 mt-0.5">
                  {inspectingBooking.scheduledStartTime
                    ? new Date(inspectingBooking.scheduledStartTime).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'N/A'}
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  {inspectingBooking.scheduledStartTime
                    ? new Date(inspectingBooking.scheduledStartTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}{' '}
                  -{' '}
                  {inspectingBooking.scheduledEndTime
                    ? new Date(inspectingBooking.scheduledEndTime).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Expected Headcount</p>
                <p className="font-bold text-slate-800 mt-0.5">
                  {inspectingBooking.expectedAttendees || 1} Attendees
                </p>
              </div>
            </div>

            {/* Booked By Details from Active Directory */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[#00adef]" />
                Booked By (Staff / Active Directory)
              </p>
              <div className="space-y-1">
                <p className="font-bold text-slate-800 text-sm">
                  {inspectingBooking.bookedByName}
                </p>
                <p className="text-slate-600">
                  <span className="font-medium text-slate-400">Department:</span>{' '}
                  {inspectingBooking.hostDepartment || 'N/A'}
                </p>
                <p className="text-slate-600">
                  <span className="font-medium text-slate-400">Email:</span>{' '}
                  {inspectingBooking.bookedByEmail || 'N/A'}
                </p>
                {inspectingBooking.bookedByUsername && (
                  <p className="text-slate-600">
                    <span className="font-medium text-slate-400">Username:</span>{' '}
                    <span className="font-mono">{inspectingBooking.bookedByUsername}</span>
                  </p>
                )}
              </div>
            </div>

            {inspectingBooking.meetingAgenda && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">
                  Meeting Objective / Agenda
                </p>
                <p className="text-slate-700 leading-relaxed">
                  {inspectingBooking.meetingAgenda}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setInspectingBooking(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Confirmation Modal */}
      {cancellingBooking && (
        <Modal
          isOpen={true}
          onClose={() => setCancellingBooking(null)}
          title="Cancel Room Reservation"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs">Are you sure you want to cancel this booking?</p>
                <p className="text-[11px] text-rose-700 mt-1">
                  Room: <span className="font-bold">{cancellingBooking.roomName}</span>
                  <br />
                  Reference: <span className="font-mono font-bold">{cancellingBooking.bookingCode}</span>
                </p>
              </div>
            </div>

            <p className="text-slate-600 text-xs">
              Cancelling will immediately release the room slot on the calendar for other staff members.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCancellingBooking(null)}
                disabled={isCancelling}
              >
                Keep Booking
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleCancelConfirm}
                isLoading={isCancelling}
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default BookingManagementPage;
