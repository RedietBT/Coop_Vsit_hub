import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  ArrowLeft,
  Users,
  User,
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
  XCircle,
  Trash2,
  Edit2,
  Phone,
} from 'lucide-react';
import { toast } from 'sonner';
import useAuthStore from '@/modules/auth/store/authStore';
import useMasterDataStore from '@/modules/master_data/store/masterDataStore';
import visitApi from '../api/visitApi';
import roomBookingApi from '@/modules/booking/api/roomBookingApi';
import soundPlayer from '@/core/utils/soundPlayer';
import Button from '@/shared/components/ui/Button';
import Badge from '@/shared/components/ui/Badge';
import Modal from '@/shared/components/ui/Modal';
import AdminRoomBookingsModal from '../components/AdminRoomBookingsModal';
import MasterDataManagementModal from '@/modules/master_data/components/MasterDataManagementModal';
import { resolveImageUrl } from '@/core/utils/imageUtils';

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

  // Date & Time Helpers (Accurate East Africa Time - UTC+3)
  const getLocalDateString = (d = new Date()) => {
    const dateObj = typeof d === 'string' ? new Date(d) : d;
    if (!dateObj || isNaN(dateObj.getTime())) return '';
    try {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Africa/Addis_Ababa',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      return formatter.format(dateObj); // "YYYY-MM-DD"
    } catch {
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    }
  };

  const parseTimeTo12Hr = (time24) => {
    if (!time24) return { hour: '09', minute: '00', period: 'AM' };
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr ? mStr.padStart(2, '0') : '00';
    const period = h >= 12 ? 'PM' : 'AM';
    if (h === 0) {
      h = 12;
    } else if (h > 12) {
      h -= 12;
    }
    return {
      hour: String(h).padStart(2, '0'),
      minute: m,
      period,
    };
  };

  const format12To24 = (hour, minute, period) => {
    let h = parseInt(hour, 10) || 12;
    const m = String(minute).padStart(2, '0');
    if (period === 'AM') {
      if (h === 12) h = 0;
    } else {
      if (h < 12) h += 12;
    }
    return `${String(h).padStart(2, '0')}:${m}`;
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return 'Selected Date';
    const parts = dateStr.split('-').map(Number);
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return new Date(y, m - 1, d).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    return dateStr;
  };

  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '';
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    const diff = endMins - startMins;
    if (diff <= 0) return 'Invalid range';
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hours > 0 && mins > 0) return `${hours} hr ${mins} mins`;
    if (hours > 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
    return `${mins} mins`;
  };

  // Calendar & Booking State (for detailed view)
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [hoveredDate, setHoveredDate] = useState(null);
  const [roomSlots, setRoomSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cancellation State (for cancelling one's own reservation directly from the schedule)
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Edit / Reschedule Reservation State
  const [editingBooking, setEditingBooking] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    date: '',
    startTime: '09:00',
    endTime: '10:30',
    expectedAttendees: 2,
    meetingAgenda: '',
  });

  // Booking Form State
  const [formData, setFormData] = useState({
    title: '',
    date: getLocalDateString(new Date()),
    startTime: '09:00',
    endTime: '10:30',
    requestingDepartment: user?.department || 'Growth and Operations',
    guestName: '',
    visitorCount: 2,
    visitObjective: '',
  });

  // Fetch meeting rooms on mount (fetches all master data like Booking Management page)
  useEffect(() => {
    fetchAllMasterData();
  }, [fetchAllMasterData]);

  // Authentic CoopBank facility rooms fallback matching Migration V18
  const defaultRooms = [
    {
      id: 'default-1',
      name: 'Executive Boardroom',
      capacity: 18,
      department: 'Executive Office',
      imageUrl: '/rooms/executive-boardroom.jpg',
    },
    {
      id: 'default-2',
      name: 'FinTech Innovation Room A',
      capacity: 12,
      department: 'Digital Banking & MSME',
      imageUrl: '/rooms/fintech-bar-counter.jpg',
    },
    {
      id: 'default-3',
      name: 'Strategic Peering Room B',
      capacity: 10,
      department: 'Retail Banking & MSME',
      imageUrl: '/rooms/africa-table.jpg',
    },
    {
      id: 'default-4',
      name: 'CoopBank HQ VIP Lounge',
      capacity: 25,
      department: 'Operations & Front Desk',
      imageUrl: '/rooms/creative-lounge-stools.jpg',
    },
    {
      id: 'default-5',
      name: 'Executive Hospitality & Dining Facility',
      capacity: 16,
      department: 'Operations & Front Desk',
      imageUrl: '/rooms/cafeteria-collaboration-table.jpg',
    },
  ];

  const activeRooms = meetingRooms.length > 0 ? meetingRooms : defaultRooms;

  // Keep selectedRoom updated with latest photo/details if master data changes
  useEffect(() => {
    if (selectedRoom && meetingRooms.length > 0) {
      const updated = meetingRooms.find(
        (r) => (r.id && r.id === selectedRoom.id) || r.name?.toLowerCase() === selectedRoom.name?.toLowerCase()
      );
      if (updated && updated.imageUrl !== selectedRoom.imageUrl) {
        setSelectedRoom((prev) => ({ ...prev, ...updated }));
      }
    }
  }, [meetingRooms, selectedRoom]);

  // Strictly enforce authorization: Only the person who booked it, the person in charge of that space, or super admin only!
  const checkCanModifyBooking = (booking) => {
    if (!booking) return false;
    if (booking.status && booking.status !== 'CONFIRMED') return false;

    // 1. Super Admin
    if (isAdmin) return true;

    // 2. The Person who booked it
    if (user?.id && booking.bookedByUserId && user.id === booking.bookedByUserId) return true;
    if (user?.email && booking.bookedByEmail && user.email.trim().toLowerCase() === booking.bookedByEmail.trim().toLowerCase()) return true;
    if (user?.username && booking.bookedByUsername && user.username.trim().toLowerCase() === booking.bookedByUsername.trim().toLowerCase()) return true;
    if (user?.fullName && booking.bookedByName && user.fullName.trim().toLowerCase() === booking.bookedByName.trim().toLowerCase()) return true;

    // 3. The Person who is in charge of that space
    if (selectedRoom) {
      if (selectedRoom.assignedUserId && user?.id && selectedRoom.assignedUserId === user.id) return true;
      if (selectedRoom.contactEmail && user?.email && selectedRoom.contactEmail.trim().toLowerCase() === user.email.trim().toLowerCase()) return true;
      if (selectedRoom.assignedUserName && user?.fullName && selectedRoom.assignedUserName.trim().toLowerCase() === user.fullName.trim().toLowerCase()) return true;
      if (selectedRoom.assignedUserName && user?.username && selectedRoom.assignedUserName.trim().toLowerCase() === user.username.trim().toLowerCase()) return true;
    }

    return false;
  };

  const checkCanCancel = checkCanModifyBooking;

  // Open Edit / Reschedule Modal
  const handleOpenEditBooking = (booking) => {
    let bookingDate = booking.date || getLocalDateString(new Date());
    let st = '09:00';
    let et = '10:30';

    if (booking.scheduledStartTime) {
      const sDate = new Date(booking.scheduledStartTime);
      bookingDate = getLocalDateString(sDate);
      try {
        const parts = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Africa/Addis_Ababa',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(sDate).split(':');
        if (parts.length === 2) {
          st = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
        }
      } catch (err) {
        console.warn('Time format error:', err);
      }
    }

    if (booking.scheduledEndTime) {
      const eDate = new Date(booking.scheduledEndTime);
      try {
        const parts = new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Africa/Addis_Ababa',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(eDate).split(':');
        if (parts.length === 2) {
          et = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
        }
      } catch (err) {
        console.warn('Time format error:', err);
      }
    }

    setEditFormData({
      title: booking.meetingTitle || '',
      date: bookingDate,
      startTime: st,
      endTime: et,
      expectedAttendees: booking.expectedAttendees || 2,
      meetingAgenda: booking.meetingAgenda || '',
    });
    setEditingBooking(booking);
  };

  // Confirm and execute edit/rescheduling
  const handleUpdateBookingSubmit = async (e) => {
    e.preventDefault();
    if (!editingBooking) return;
    if (isPastDateKey(editFormData.date)) {
      toast.error('Past dates cannot be rescheduled. Please choose today or a future date.');
      return;
    }
    if (!editFormData.title.trim()) {
      toast.error('Please enter a meeting title.');
      return;
    }
    if (!editFormData.startTime || !editFormData.endTime) {
      toast.error('Please specify start and end times.');
      return;
    }

    const [sh, sm] = (editFormData.startTime || '').split(':').map(Number);
    const [eh, em] = (editFormData.endTime || '').split(':').map(Number);
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) {
      toast.error('Please specify valid start and end times.');
      return;
    }
    if ((sh * 60 + sm) >= (eh * 60 + em)) {
      toast.error('End time must be after start time.');
      return;
    }

    // Explicit East Africa Time (UTC+3)
    const newStartIso = `${editFormData.date}T${editFormData.startTime}:00+03:00`;
    const newEndIso = `${editFormData.date}T${editFormData.endTime}:00+03:00`;
    const newStartMs = new Date(newStartIso).getTime();
    const newEndMs = new Date(newEndIso).getTime();

    // Check if slot is already reserved by another confirmed booking in this room
    const conflict = roomSlots.find((s) => {
      if (s.id === editingBooking.id || s.bookingCode === editingBooking.bookingCode) {
        return false; // Skip the booking being edited
      }
      if (s.status && s.status !== 'CONFIRMED') {
        return false;
      }
      if (!s.scheduledStartTime || !s.scheduledEndTime) return false;
      const sStart = new Date(s.scheduledStartTime).getTime();
      const sEnd = new Date(s.scheduledEndTime).getTime();
      // Overlap: newStart < sEnd && newEnd > sStart
      return newStartMs < sEnd && newEndMs > sStart;
    });

    if (conflict) {
      toast.error(
        `Cannot reschedule: Slot is already reserved by "${conflict.meetingTitle || 'Another Meeting'}" (${conflict.timeFormatted || 'Reserved'}). Please choose a different time.`
      );
      return;
    }

    setIsUpdating(true);
    try {
      const payload = {
        meetingTitle: editFormData.title.trim(),
        scheduledStartTime: newStartIso,
        scheduledEndTime: newEndIso,
        expectedAttendees: parseInt(editFormData.expectedAttendees, 10) || 1,
        meetingAgenda: editFormData.meetingAgenda.trim() || 'Internal boardroom session',
      };

      await roomBookingApi.updateBooking(editingBooking.id, payload);
      soundPlayer.playNotificationChime();
      toast.success(`Booking ${editingBooking.bookingCode} updated and rescheduled successfully!`);
      setEditingBooking(null);
      if (selectedRoom) {
        loadRoomSlots(selectedRoom.name);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update reservation.';
      toast.error(errMsg);
    } finally {
      setIsUpdating(false);
    }
  };

  // Confirm and execute cancellation
  const handleCancelBookingConfirm = async () => {
    if (!cancellingBooking) return;
    setIsCancelling(true);
    try {
      await roomBookingApi.cancelBooking(cancellingBooking.id);
      soundPlayer.playNotificationChime();
      toast.success(`Booking ${cancellingBooking.bookingCode} cancelled and released.`);
      setCancellingBooking(null);
      if (selectedRoom) {
        loadRoomSlots(selectedRoom.name);
      }
    } catch (e) {
      const errMsg = e.response?.data?.message || 'Failed to cancel reservation.';
      toast.error(errMsg);
    } finally {
      setIsCancelling(false);
    }
  };

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
        let d = '';
        let sTime = '';
        let eTime = '';
        if (s.scheduledStartTime) {
          const startDate = new Date(s.scheduledStartTime);
          d = getLocalDateString(startDate);
          sTime = startDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Africa/Addis_Ababa',
          });
        }
        if (s.scheduledEndTime) {
          const endDate = new Date(s.scheduledEndTime);
          eTime = endDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Africa/Addis_Ababa',
          });
        }
        return {
          ...s,
          date: d,
          timeFormatted: sTime && eTime ? `${sTime} - ${eTime}` : sTime || 'Reserved',
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
      date: getLocalDateString(new Date()),
      visitorCount: Math.min(room.capacity || 10, 4),
    }));
    loadRoomSlots(room.name);
  };

  // Calendar Helpers
  const todayKey = getLocalDateString(new Date());
  const isPastDateKey = (dateKey) => Boolean(dateKey && dateKey < todayKey);
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
  const isBookingDatePast = isPastDateKey(formData.date);

  // Form Submit: Instant direct booking without approvals!
  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (isBookingDatePast) {
      toast.error('Past dates are read-only. Please choose today or a future date to make a booking.');
      return;
    }
    if (!formData.title.trim()) {
      toast.error('Please enter a meeting or visit title.');
      return;
    }
    if (!formData.startTime || !formData.endTime) {
      toast.error('Please specify meeting start and end times in AM/PM.');
      return;
    }

    const [sh, sm] = (formData.startTime || '').split(':').map(Number);
    const [eh, em] = (formData.endTime || '').split(':').map(Number);
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) {
      toast.error('Please specify valid start and end times.');
      return;
    }
    if ((sh * 60 + sm) >= (eh * 60 + em)) {
      toast.error('End time must be after start time.');
      return;
    }

    setIsSubmitting(true);
    try {
      // East Africa Time is UTC+3 (Africa/Addis_Ababa).
      // Explicitly formatting with the +03:00 offset ensures the backend parses the exact intended time
      // without any client browser timezone drift (e.g., 2:30 PM staying strictly 2:30 PM).
      const startIso = `${formData.date}T${formData.startTime}:00+03:00`;
      const endIso = `${formData.date}T${formData.endTime}:00+03:00`;

      const payload = {
        roomName: selectedRoom.name,
        meetingTitle: formData.title.trim(),
        hostDepartment: selectedRoom.department || user?.department || 'Executive Office',
        bookedByName: user?.fullName || '',
        bookedByEmail: user?.email || '',
        bookedByPhone: user?.phoneNumber || user?.phone || '',
        scheduledStartTime: startIso,
        scheduledEndTime: endIso,
        expectedAttendees: parseInt(formData.visitorCount, 10) || 1,
        meetingAgenda: formData.visitObjective.trim() || 'Internal boardroom session',
        guestOrganizationName: formData.guestName?.trim() || null,
        guestName: formData.guestName?.trim() || null,
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
                      src={resolveImageUrl(room.imageUrl)}
                      alt={room.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/rooms/executive-boardroom.jpg';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
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
                  src={resolveImageUrl(selectedRoom.imageUrl)}
                  alt={selectedRoom.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/rooms/executive-boardroom.jpg';
                  }}
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
                          if (!isPastDateKey(dateKey)) {
                            setFormData((prev) => ({ ...prev, date: dateKey }));
                          }
                        }}
                        onMouseEnter={() => setHoveredDate(dayNumber)}
                        onMouseLeave={() => setHoveredDate(null)}
                        className={`h-14 p-1.5 rounded-2xl border transition-colors duration-150 flex flex-col justify-between select-none relative ${isPastDateKey(dateKey) ? 'bg-slate-100/80 border-slate-200 text-slate-400 cursor-default' : 'cursor-pointer'} ${
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
                          <span className={`text-[9px] font-medium pointer-events-none ${isPastDateKey(dateKey) ? 'text-slate-400' : 'text-emerald-600'}`}>
                            {isPastDateKey(dateKey) ? 'Past date' : 'Available'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Interactive Hourly Schedule & In-Place Cancellation Section */}
                <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/80 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#00adef]" />
                      <span className="text-xs font-bold text-slate-800">
                        Schedule on {formatDisplayDate(activeHoverDateStr)}
                      </span>
                    </div>
                    {activeDateSlots.length > 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider">
                        {activeDateSlots.length} Booked {activeDateSlots.length === 1 ? 'Slot' : 'Slots'}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                        Open All Day
                      </span>
                    )}
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {activeDateSlots.length > 0 ? (
                      activeDateSlots.map((slot) => {
                        const canModify = checkCanModifyBooking(slot);
                        return (
                          <div
                            key={slot.id || slot.bookingCode}
                            className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all hover:border-slate-300"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 rounded-md bg-sky-50 text-[#00adef] border border-sky-200 text-[11px] font-bold font-mono">
                                  {slot.timeFormatted || 'Reserved'}
                                </span>
                                <span className="text-xs font-bold text-slate-800">
                                  {slot.meetingTitle || 'Scheduled Meeting'}
                                </span>
                                {slot.bookingCode && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                    Ref: {slot.bookingCode}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3 text-slate-400" />
                                  <span>{slot.bookedByName || 'Staff Member'}</span>
                                  {slot.hostDepartment && (
                                    <span className="text-slate-400">({slot.hostDepartment})</span>
                                  )}
                                </span>
                                {slot.bookedByPhone && (
                                  <a
                                    href={`tel:${slot.bookedByPhone}`}
                                    className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 hover:underline font-medium"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Phone className="w-3 h-3" />
                                    <span>{slot.bookedByPhone}</span>
                                  </a>
                                )}
                                {slot.expectedAttendees && (
                                  <span className="flex items-center gap-1 text-slate-400">
                                    <Users className="w-3 h-3" />
                                    <span>{slot.expectedAttendees} attendees</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* In-Place Actions: Edit & Cancel (Strictly authorized) */}
                            <div className="shrink-0 flex items-center gap-1.5">
                              {canModify ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEditBooking(slot);
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                                    title="Edit or reschedule this reservation if slot is available"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-[#00adef]" />
                                    <span>Edit</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCancellingBooking(slot);
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                                    title="Cancel reservation directly from this schedule"
                                  >
                                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Cancel</span>
                                  </button>
                                </>
                              ) : (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 rounded-lg bg-slate-100">
                                  Reserved
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-800 flex items-center gap-2.5 text-xs font-medium">
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>This room has no bookings on this date. Full schedule is open for booking.</span>
                      </div>
                    )}
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

                {/* Quick Meeting Slot Presets */}
                <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#00adef]" />
                      Quick Slot Presets (AM / PM)
                    </span>
                    <span className="text-[10px] text-slate-400">One-click populate</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: '09:00 AM - 10:30 AM', start: '09:00', end: '10:30' },
                      { label: '11:00 AM - 12:30 PM', start: '11:00', end: '12:30' },
                      { label: '02:00 PM - 03:30 PM', start: '14:00', end: '15:30' },
                      { label: '02:30 PM - 04:00 PM', start: '14:30', end: '16:00' },
                      { label: '04:00 PM - 05:30 PM', start: '16:00', end: '17:30' },
                    ].map((preset) => {
                      const isSelected =
                        formData.startTime === preset.start && formData.endTime === preset.end;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              startTime: preset.start,
                              endTime: preset.end,
                            }))
                          }
                          className={`px-2.5 py-1 text-xs rounded-xl font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#00adef] text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/50'
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Date & 12-Hour AM/PM Times */}
                <div className="space-y-3">
                  {/* Reservation Date */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Reservation Date
                      </label>
                      <span className="text-[11px] font-semibold text-[#00adef]">
                        {formatDisplayDate(formData.date)}
                      </span>
                    </div>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      min={todayKey}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (isPastDateKey(val)) {
                          toast.error('Past dates are read-only. Choose today or a future date.');
                          return;
                        }
                        setFormData((prev) => ({ ...prev, date: val }));
                        const parts = val.split('-').map(Number);
                        if (parts.length === 3) {
                          setSelectedDate(new Date(parts[0], parts[1] - 1, parts[2]));
                        }
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none cursor-pointer"
                    />
                  </div>

                  {/* 12-Hour AM/PM Time Pickers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* START TIME */}
                    {(() => {
                      const t = parseTimeTo12Hr(formData.startTime);
                      const hours = ['01','02','03','04','05','06','07','08','09','10','11','12'];
                      const minutes = ['00','05','10','15','20','25','30','35','40','45','50','55'];
                      return (
                        <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700">
                              Start Time
                            </label>
                            <span className="px-2 py-0.5 rounded-lg bg-sky-50 text-[#00adef] border border-sky-200 text-xs font-bold font-mono">
                              {t.hour}:{t.minute} {t.period}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Hour Select */}
                            <select
                              value={t.hour}
                              onChange={(e) => {
                                const new24 = format12To24(e.target.value, t.minute, t.period);
                                setFormData((prev) => ({ ...prev, startTime: new24 }));
                              }}
                              className="flex-1 min-w-[50px] px-2 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#00adef] text-slate-800"
                            >
                              {hours.map((h) => (
                                <option key={`start-h-${h}`} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>

                            <span className="font-bold text-slate-400">:</span>

                            {/* Minute Select */}
                            <select
                              value={t.minute}
                              onChange={(e) => {
                                const new24 = format12To24(t.hour, e.target.value, t.period);
                                setFormData((prev) => ({ ...prev, startTime: new24 }));
                              }}
                              className="flex-1 min-w-[50px] px-2 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#00adef] text-slate-800"
                            >
                              {minutes.map((m) => (
                                <option key={`start-m-${m}`} value={m}>
                                  {m}
                                </option>
                              ))}
                            </select>

                            {/* AM/PM Toggle */}
                            <div className="flex shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-white p-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const new24 = format12To24(t.hour, t.minute, 'AM');
                                  setFormData((prev) => ({ ...prev, startTime: new24 }));
                                }}
                                className={`px-2.5 py-1 text-xs font-extrabold rounded-lg transition-colors cursor-pointer ${
                                  t.period === 'AM'
                                    ? 'bg-[#00adef] text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                AM
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const new24 = format12To24(t.hour, t.minute, 'PM');
                                  setFormData((prev) => ({ ...prev, startTime: new24 }));
                                }}
                                className={`px-2.5 py-1 text-xs font-extrabold rounded-lg transition-colors cursor-pointer ${
                                  t.period === 'PM'
                                    ? 'bg-[#00adef] text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                PM
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* END TIME */}
                    {(() => {
                      const t = parseTimeTo12Hr(formData.endTime);
                      const hours = ['01','02','03','04','05','06','07','08','09','10','11','12'];
                      const minutes = ['00','05','10','15','20','25','30','35','40','45','50','55'];
                      return (
                        <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700">
                              End Time
                            </label>
                            <span className="px-2 py-0.5 rounded-lg bg-sky-50 text-[#00adef] border border-sky-200 text-xs font-bold font-mono">
                              {t.hour}:{t.minute} {t.period}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Hour Select */}
                            <select
                              value={t.hour}
                              onChange={(e) => {
                                const new24 = format12To24(e.target.value, t.minute, t.period);
                                setFormData((prev) => ({ ...prev, endTime: new24 }));
                              }}
                              className="flex-1 min-w-[50px] px-2 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#00adef] text-slate-800"
                            >
                              {hours.map((h) => (
                                <option key={`end-h-${h}`} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>

                            <span className="font-bold text-slate-400">:</span>

                            {/* Minute Select */}
                            <select
                              value={t.minute}
                              onChange={(e) => {
                                const new24 = format12To24(t.hour, e.target.value, t.period);
                                setFormData((prev) => ({ ...prev, endTime: new24 }));
                              }}
                              className="flex-1 min-w-[50px] px-2 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#00adef] text-slate-800"
                            >
                              {minutes.map((m) => (
                                <option key={`end-m-${m}`} value={m}>
                                  {m}
                                </option>
                              ))}
                            </select>

                            {/* AM/PM Toggle */}
                            <div className="flex shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-white p-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const new24 = format12To24(t.hour, t.minute, 'AM');
                                  setFormData((prev) => ({ ...prev, endTime: new24 }));
                                }}
                                className={`px-2.5 py-1 text-xs font-extrabold rounded-lg transition-colors cursor-pointer ${
                                  t.period === 'AM'
                                    ? 'bg-[#00adef] text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                AM
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const new24 = format12To24(t.hour, t.minute, 'PM');
                                  setFormData((prev) => ({ ...prev, endTime: new24 }));
                                }}
                                className={`px-2.5 py-1 text-xs font-extrabold rounded-lg transition-colors cursor-pointer ${
                                  t.period === 'PM'
                                    ? 'bg-[#00adef] text-white shadow-xs'
                                    : 'text-slate-600 hover:text-slate-900'
                                }`}
                              >
                                PM
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Selected Slot Summary Bar */}
                  {(() => {
                    const st = parseTimeTo12Hr(formData.startTime);
                    const et = parseTimeTo12Hr(formData.endTime);
                    const dur = calculateDuration(formData.startTime, formData.endTime);
                    return (
                      <div className="px-3.5 py-2 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between text-xs text-slate-700">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-[#00adef]" />
                          <span className="font-semibold">Selected Window:</span>
                          <span className="font-bold text-[#00adef] font-mono">
                            {st.hour}:{st.minute} {st.period} – {et.hour}:{et.minute} {et.period}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-500">
                          {dur}
                        </span>
                      </div>
                    );
                  })()}
                </div>

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
                    variant="orange"
                    size="lg"
                    disabled={isSubmitting || isBookingDatePast}
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

      {/* Edit & Reschedule Reservation Modal (Allowed only if slot is not already reserved) */}
      {editingBooking && (
        <Modal
          isOpen={!!editingBooking}
          onClose={() => !isUpdating && setEditingBooking(null)}
          title="Edit & Reschedule Reservation"
          maxWidth="max-w-2xl"
        >
          {(() => {
            // Live overlap detection against other confirmed slots
            const [sh, sm] = (editFormData.startTime || '').split(':').map(Number);
            const [eh, em] = (editFormData.endTime || '').split(':').map(Number);
            const isValidRange = !isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em) && (sh * 60 + sm) < (eh * 60 + em);
            
            let slotConflict = null;
            if (isValidRange && editFormData.date) {
              const startMs = new Date(`${editFormData.date}T${editFormData.startTime}:00+03:00`).getTime();
              const endMs = new Date(`${editFormData.date}T${editFormData.endTime}:00+03:00`).getTime();
              slotConflict = roomSlots.find((s) => {
                if (s.id === editingBooking.id || s.bookingCode === editingBooking.bookingCode) return false;
                if (s.status && s.status !== 'CONFIRMED') return false;
                if (!s.scheduledStartTime || !s.scheduledEndTime) return false;
                const sStart = new Date(s.scheduledStartTime).getTime();
                const sEnd = new Date(s.scheduledEndTime).getTime();
                return startMs < sEnd && endMs > sStart;
              });
            }

            return (
              <form onSubmit={handleUpdateBookingSubmit} className="space-y-4 text-left">
                {/* Reference Banner */}
                <div className="flex items-center justify-between p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">
                      Editing Reservation Reference
                    </span>
                    <span className="font-mono font-bold text-sm text-slate-800">
                      {editingBooking.bookingCode}
                    </span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-[#00adef]">
                    {selectedRoom?.name}
                  </span>
                </div>

                {/* Overlap Conflict Notice */}
                {slotConflict && (
                  <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-2xl text-xs font-medium">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-800">Slot Conflict Detected</p>
                      <p className="text-amber-700 leading-relaxed mt-0.5">
                        This slot is already reserved by <strong>{slotConflict.meetingTitle || 'Another Meeting'}</strong> ({slotConflict.timeFormatted}). Please choose an open date or time window.
                      </p>
                    </div>
                  </div>
                )}

                {/* Meeting Title */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Meeting Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#00adef] text-slate-800"
                    placeholder="e.g. Q3 Financial Review"
                  />
                </div>

                {/* Reservation Date */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={editFormData.date}
                    min={todayKey}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!isPastDateKey(val)) setEditFormData({ ...editFormData, date: val });
                    }}
                    className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#00adef] text-slate-800"
                  />
                </div>

                {/* 12-Hour Time Pickers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Start Time */}
                  {(() => {
                    const t = parseTimeTo12Hr(editFormData.startTime);
                    const hours = ['01','02','03','04','05','06','07','08','09','10','11','12'];
                    const minutes = ['00','05','10','15','20','25','30','35','40','45','50','55'];
                    return (
                      <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700">Start Time</label>
                          <span className="px-2.5 py-0.5 rounded-lg bg-sky-50 text-[#00adef] border border-sky-200 text-xs font-bold font-mono">
                            {t.hour}:{t.minute} {t.period}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={t.hour}
                            onChange={(e) => {
                              const new24 = format12To24(e.target.value, t.minute, t.period);
                              setEditFormData((prev) => ({ ...prev, startTime: new24 }));
                            }}
                            className="flex-1 min-w-[54px] px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#00adef] text-slate-800"
                          >
                            {hours.map((h) => (
                              <option key={`edit-start-h-${h}`} value={h}>{h}</option>
                            ))}
                          </select>
                          <span className="font-bold text-slate-400">:</span>
                          <select
                            value={t.minute}
                            onChange={(e) => {
                              const new24 = format12To24(t.hour, e.target.value, t.period);
                              setEditFormData((prev) => ({ ...prev, startTime: new24 }));
                            }}
                            className="flex-1 min-w-[54px] px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#00adef] text-slate-800"
                          >
                            {minutes.map((m) => (
                              <option key={`edit-start-m-${m}`} value={m}>{m}</option>
                            ))}
                          </select>
                          <div className="flex shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-white p-0.5 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => {
                                const new24 = format12To24(t.hour, t.minute, 'AM');
                                setEditFormData((prev) => ({ ...prev, startTime: new24 }));
                              }}
                              className={`px-3 py-1 text-xs font-black rounded-lg cursor-pointer transition-colors ${
                                t.period === 'AM' ? 'bg-[#00adef] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              AM
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const new24 = format12To24(t.hour, t.minute, 'PM');
                                setEditFormData((prev) => ({ ...prev, startTime: new24 }));
                              }}
                              className={`px-3 py-1 text-xs font-black rounded-lg cursor-pointer transition-colors ${
                                t.period === 'PM' ? 'bg-[#00adef] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              PM
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* End Time */}
                  {(() => {
                    const t = parseTimeTo12Hr(editFormData.endTime);
                    const hours = ['01','02','03','04','05','06','07','08','09','10','11','12'];
                    const minutes = ['00','05','10','15','20','25','30','35','40','45','50','55'];
                    return (
                      <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700">End Time</label>
                          <span className="px-2.5 py-0.5 rounded-lg bg-sky-50 text-[#00adef] border border-sky-200 text-xs font-bold font-mono">
                            {t.hour}:{t.minute} {t.period}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={t.hour}
                            onChange={(e) => {
                              const new24 = format12To24(e.target.value, t.minute, t.period);
                              setEditFormData((prev) => ({ ...prev, endTime: new24 }));
                            }}
                            className="flex-1 min-w-[54px] px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#00adef] text-slate-800"
                          >
                            {hours.map((h) => (
                              <option key={`edit-end-h-${h}`} value={h}>{h}</option>
                            ))}
                          </select>
                          <span className="font-bold text-slate-400">:</span>
                          <select
                            value={t.minute}
                            onChange={(e) => {
                              const new24 = format12To24(t.hour, e.target.value, t.period);
                              setEditFormData((prev) => ({ ...prev, endTime: new24 }));
                            }}
                            className="flex-1 min-w-[54px] px-2.5 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#00adef] text-slate-800"
                          >
                            {minutes.map((m) => (
                              <option key={`edit-end-m-${m}`} value={m}>{m}</option>
                            ))}
                          </select>
                          <div className="flex shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-white p-0.5 shadow-2xs">
                            <button
                              type="button"
                              onClick={() => {
                                const new24 = format12To24(t.hour, t.minute, 'AM');
                                setEditFormData((prev) => ({ ...prev, endTime: new24 }));
                              }}
                              className={`px-3 py-1 text-xs font-black rounded-lg cursor-pointer transition-colors ${
                                t.period === 'AM' ? 'bg-[#00adef] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              AM
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const new24 = format12To24(t.hour, t.minute, 'PM');
                                setEditFormData((prev) => ({ ...prev, endTime: new24 }));
                              }}
                              className={`px-3 py-1 text-xs font-black rounded-lg cursor-pointer transition-colors ${
                                t.period === 'PM' ? 'bg-[#00adef] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              PM
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Attendees */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Expected Attendees
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedRoom?.capacity || 50}
                    value={editFormData.expectedAttendees}
                    onChange={(e) => setEditFormData({ ...editFormData, expectedAttendees: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#00adef] text-slate-800"
                  />
                </div>

                {/* Agenda / Notes */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Meeting Objective / Agenda
                  </label>
                  <textarea
                    rows={2}
                    value={editFormData.meetingAgenda}
                    onChange={(e) => setEditFormData({ ...editFormData, meetingAgenda: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#00adef] text-slate-800"
                    placeholder="Discussion topics, equipment required..."
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => setEditingBooking(null)}
                    disabled={isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUpdating || !!slotConflict}
                    className="bg-[#00adef] hover:bg-[#0095ce] text-white"
                  >
                    {isUpdating ? 'Saving Changes...' : 'Save & Reschedule'}
                  </Button>
                </div>
              </form>
            );
          })()}
        </Modal>
      )}

      {/* Schedule In-Place Cancellation Confirmation Modal */}
      {cancellingBooking && (
        <Modal
          isOpen={!!cancellingBooking}
          onClose={() => !isCancelling && setCancellingBooking(null)}
          title="Cancel Room Reservation"
        >
          <div className="p-6 space-y-4 text-left">
            <div className="flex items-start gap-3 p-4 bg-red-50 text-red-800 border border-red-200 rounded-2xl">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-sm text-red-900">Release this meeting room reservation?</p>
                <p className="text-red-700 leading-relaxed">
                  Cancelling will immediately release <strong>{selectedRoom?.name}</strong> for reference{' '}
                  <span className="font-mono font-bold bg-red-100 px-1 py-0.5 rounded">{cancellingBooking.bookingCode}</span> and make the slot available for other colleagues.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Meeting Room:</span>
                <span className="font-bold text-slate-800">{selectedRoom?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Meeting Title:</span>
                <span className="font-bold text-slate-800">{cancellingBooking.meetingTitle}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 font-medium">Schedule Window (12-hr EAT):</span>
                <span className="font-bold text-[#00adef] font-mono">{cancellingBooking.timeFormatted}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Reserved By:</span>
                <span className="font-bold text-slate-800">
                  {cancellingBooking.bookedByName || 'Staff'} ({cancellingBooking.hostDepartment || 'Staff'})
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setCancellingBooking(null)}
                disabled={isCancelling}
              >
                Keep Reservation
              </Button>
              <Button
                variant="danger"
                onClick={handleCancelBookingConfirm}
                disabled={isCancelling}
                icon={AlertTriangle}
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default VisitCalendarPage;
