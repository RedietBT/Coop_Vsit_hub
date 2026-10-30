import React, { useEffect, useState, useMemo } from 'react';
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
  Mail,
  Globe,
  Coffee,
  Shield,
  CheckCircle2,
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

const getRoomRefreshmentOptions = (room) =>
  String(room?.refreshmentOptions || '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

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
  const [selectedDateKey, setSelectedDateKey] = useState(() => getLocalDateString(new Date()));
  const [hoveredDate, setHoveredDate] = useState(null);
  const [roomSlots, setRoomSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotLoadError, setSlotLoadError] = useState('');
  const [showReserverContact, setShowReserverContact] = useState(() => {
    try { return localStorage.getItem('visitHub.showReserverContact') !== 'false'; } catch { return true; }
  });

  useEffect(() => {
    try { localStorage.setItem('visitHub.showReserverContact', String(showReserverContact)); } catch { /* ignore storage restrictions */ }
  }, [showReserverContact]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cancellation State (for cancelling one's own reservation directly from the schedule)
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

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
    requestedItems: '',
    engagementType: 'INTERNAL',
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
    requestedItems: '',
    engagementType: 'INTERNAL',
  });

  // Room Supervisor Refreshment Management Modal State
  const [refreshmentModalBooking, setRefreshmentModalBooking] = useState(null);
  const [supervisorRefreshmentItems, setSupervisorRefreshmentItems] = useState([]);
  const [supervisorRefreshmentNotes, setSupervisorRefreshmentNotes] = useState('');
  const [isSavingRefreshments, setIsSavingRefreshments] = useState(false);

  // Fetch meeting rooms on mount (fetches all master data like Booking Management page)
  useEffect(() => {
    fetchAllMasterData();
  }, [fetchAllMasterData]);

  // Authentic CoopBank facility rooms fallback matching Migration V18 & Custodian Assignments
  const defaultRooms = [
    {
      id: 'default-1',
      name: 'Executive Boardroom',
      capacity: 18,
      department: 'Executive Office',
      assignedUserName: 'Sister Aster (Executive Secretary)',
      contactEmail: 'aster.k@coopbankoromia.com.et',
      imageUrl: '/rooms/executive-boardroom.jpg',
    },
    {
      id: 'default-2',
      name: 'FinTech Innovation Room A',
      capacity: 12,
      department: 'Digital Banking & MSME',
      assignedUserName: 'Abebe D. (Digital Product Lead)',
      contactEmail: 'fintech.rooms@coopbankoromia.com.et',
      imageUrl: '/rooms/fintech-bar-counter.jpg',
    },
    {
      id: 'default-3',
      name: 'Strategic Peering Room B',
      capacity: 10,
      department: 'Retail Banking & MSME',
      assignedUserName: 'Chaltu B. (Operations Manager)',
      contactEmail: 'strategic.rooms@coopbankoromia.com.et',
      imageUrl: '/rooms/africa-table.jpg',
    },
    {
      id: 'default-4',
      name: 'CoopBank HQ VIP Lounge',
      capacity: 25,
      department: 'Operations & Front Desk',
      assignedUserName: 'VIP Hospitality Desk',
      contactEmail: 'vip.hospitality@coopbankoromia.com.et',
      imageUrl: '/rooms/creative-lounge-stools.jpg',
    },
    {
      id: 'default-5',
      name: 'Executive Hospitality & Dining Facility',
      capacity: 16,
      department: 'Operations & Front Desk',
      assignedUserName: 'Executive Catering Coordinator',
      contactEmail: 'dining.facility@coopbankoromia.com.et',
      imageUrl: '/rooms/cafeteria-collaboration-table.jpg',
    },
  ];

  const isMatchingRoom = (r1, r2) => {
    if (!r1 || !r2) return false;
    const id1 = typeof r1 === 'object' ? r1.id : null;
    const id2 = typeof r2 === 'object' ? r2.id : null;
    if (id1 && id2 && id1 === id2) return true;
    const n1 = (typeof r1 === 'string' ? r1 : r1.name || '').trim().toLowerCase();
    const n2 = (typeof r2 === 'string' ? r2 : r2.name || '').trim().toLowerCase();
    return n1 === n2 || (n1 && n2 && (n1.includes(n2) || n2.includes(n1)));
  };

  const activeRooms = meetingRooms.length > 0 ? meetingRooms : defaultRooms;

  // Keep selectedRoom updated with latest photo/details if master data changes
  useEffect(() => {
    if (selectedRoom && meetingRooms.length > 0) {
      const updated = meetingRooms.find((r) => isMatchingRoom(r, selectedRoom));
      if (updated && (updated.imageUrl !== selectedRoom.imageUrl || updated.name !== selectedRoom.name)) {
        setSelectedRoom((prev) => ({ ...prev, ...updated }));
      }
    }
  }, [meetingRooms, selectedRoom]);

  // Identify Room Supervisor / Custodian for the selected room
  const getRoomSupervisorDetails = (room = selectedRoom) => {
    if (!room) {
      return {
        isSupervisor: false,
        name: 'Room Supervisor',
        email: '',
        hasAssignedSupervisor: false,
      };
    }
    const name = room.assignedUserName || (room.department ? `${room.department} Custodian` : 'Designated Room Supervisor');
    const email = room.contactEmail || '';
    const isSupervisor =
      isAdmin ||
      isSecretary ||
      (room.assignedUserId && user?.id && String(room.assignedUserId) === String(user.id)) ||
      (email && user?.email && email.trim().toLowerCase() === user.email.trim().toLowerCase()) ||
      (room.assignedUserName && user?.fullName && room.assignedUserName.trim().toLowerCase() === user.fullName.trim().toLowerCase()) ||
      (room.assignedUserName && user?.username && room.assignedUserName.trim().toLowerCase() === user.username.trim().toLowerCase());

    return {
      isSupervisor,
      name,
      email,
      hasAssignedSupervisor: !!(room.assignedUserName || room.contactEmail || room.assignedUserId),
    };
  };

  const supervisorDetails = getRoomSupervisorDetails(selectedRoom);
  const roomRefreshmentOptions = getRoomRefreshmentOptions(selectedRoom);
  const hasRoomRefreshments = Boolean(selectedRoom?.refreshmentsAvailable && roomRefreshmentOptions.length);

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

    // 3. The Person who is in charge of that space (Room Supervisor)
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
      requestedItems: booking.requestedItems || '',
      engagementType: booking.engagementType || 'INTERNAL',
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
    if (isPastTimeToday(editFormData.date, editFormData.startTime)) {
      toast.error('The selected start time has already passed. Please choose a later time.');
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
        meetingAgenda: editFormData.meetingAgenda?.trim() || null,
        requestedItems: editFormData.requestedItems?.trim() || null,
        engagementType: editFormData.engagementType || 'INTERNAL',
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
    if (!cancellationReason.trim()) {
      toast.error('Please provide a cancellation reason.');
      return;
    }
    setIsCancelling(true);
    try {
      await roomBookingApi.cancelBooking(cancellingBooking.id, cancellationReason.trim());
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

  // Room Supervisor: Open Refreshment Management Modal for a slot
  const handleOpenSupervisorRefreshmentModal = (slot) => {
    const rawItems = (slot.requestedItems || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const refreshments = rawItems.filter((i) =>
      roomRefreshmentOptions.some(
        (sr) => i.toLowerCase().includes(sr.toLowerCase()) || sr.toLowerCase().includes(i.toLowerCase())
      )
    );

    const noteItem = rawItems.find((i) => i.toLowerCase().startsWith('note:'));
    const notes = noteItem ? noteItem.replace(/^note:\s*/i, '') : '';

    setSupervisorRefreshmentItems(refreshments);
    setSupervisorRefreshmentNotes(notes);
    setRefreshmentModalBooking(slot);
  };

  // Room Supervisor: Save Refreshments for a slot
  const handleSaveSupervisorRefreshments = async () => {
    if (!refreshmentModalBooking) return;
    setIsSavingRefreshments(true);
    try {
      const rawExisting = (refreshmentModalBooking.requestedItems || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      // Keep equipment items (projector, whiteboard, etc.)
      const equipmentOnly = rawExisting.filter(
        (i) =>
          !roomRefreshmentOptions.some(
            (sr) => i.toLowerCase().includes(sr.toLowerCase()) || sr.toLowerCase().includes(i.toLowerCase())
          ) &&
          !i.toLowerCase().startsWith('note:') &&
          !i.toLowerCase().includes('coffee') &&
          !i.toLowerCase().includes('refreshment')
      );

      const combined = [...equipmentOnly, ...supervisorRefreshmentItems];
      if (supervisorRefreshmentNotes.trim()) {
        combined.push(`Note: ${supervisorRefreshmentNotes.trim()}`);
      }

      const updatedRequestedItems = combined.join(', ');

      await roomBookingApi.updateBooking(refreshmentModalBooking.id, {
        meetingTitle: refreshmentModalBooking.meetingTitle,
        meetingAgenda: refreshmentModalBooking.meetingAgenda,
        expectedAttendees: refreshmentModalBooking.expectedAttendees,
        engagementType: refreshmentModalBooking.engagementType,
        requestedItems: updatedRequestedItems || null,
      });

      // Update slot in state immediately
      setRoomSlots((prev) =>
        prev.map((s) =>
          (s.id && s.id === refreshmentModalBooking.id) || s.bookingCode === refreshmentModalBooking.bookingCode
            ? { ...s, requestedItems: updatedRequestedItems }
            : s
        )
      );

      soundPlayer.playNotificationChime();
      toast.success(`Hospitality & refreshments set by Room Supervisor for "${refreshmentModalBooking.meetingTitle}"!`);
      setRefreshmentModalBooking(null);
    } catch (err) {
      console.error('Failed to set room supervisor refreshments:', err);
      toast.error('Failed to update refreshments.');
    } finally {
      setIsSavingRefreshments(false);
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
    setSlotLoadError('');
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
      setSlotLoadError(err?.response?.data?.message || 'Unable to load booking history. Please try again.');
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    const today = getLocalDateString(new Date());
    setSelectedDateKey(today);
    setFormData((prev) => ({
      ...prev,
      date: today,
      visitorCount: Math.min(room.capacity || 10, 4),
    }));
    loadRoomSlots(room.name);
  };

  // Calendar Helpers
  const todayKey = getLocalDateString(new Date());
  const isPastDateKey = (dateKey) => Boolean(dateKey && dateKey < todayKey);
  const getCurrentMinutesInEastAfrica = () => {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Addis_Ababa',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date());
    const hour = Number(parts.find((part) => part.type === 'hour')?.value || 0);
    const minute = Number(parts.find((part) => part.type === 'minute')?.value || 0);
    return hour * 60 + minute;
  };
  const timeToMinutes = (time) => {
    const [hour, minute] = String(time || '').split(':').map(Number);
    return Number.isFinite(hour) && Number.isFinite(minute) ? hour * 60 + minute : NaN;
  };
  const isPastTimeToday = (dateKey, time) =>
    dateKey === todayKey && timeToMinutes(time) < getCurrentMinutesInEastAfrica();
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

  // Helper to format 24h 'HH:mm' to 12h AM/PM
  const formatTimeTo12Hr = (time24) => {
    if (!time24) return '';
    const t = parseTimeTo12Hr(time24);
    return `${t.hour}:${t.minute} ${t.period}`;
  };

  // Get booked slots for a specific date with multi-format fallback
  const getSlotsForDate = (dateStr) => {
    if (!dateStr || !Array.isArray(roomSlots)) return [];
    return roomSlots.filter((slot) => {
      // 1. Direct formatted date comparison
      if (slot.date === dateStr) return true;

      // 2. Scheduled start time in East Africa timezone
      if (slot.scheduledStartTime) {
        const startDay = getLocalDateString(slot.scheduledStartTime);
        if (startDay === dateStr) return true;
        if (typeof slot.scheduledStartTime === 'string' && slot.scheduledStartTime.startsWith(dateStr)) return true;
      }

      // 3. Scheduled end time
      if (slot.scheduledEndTime) {
        const endDay = getLocalDateString(slot.scheduledEndTime);
        if (endDay === dateStr) return true;
        if (typeof slot.scheduledEndTime === 'string' && slot.scheduledEndTime.startsWith(dateStr)) return true;
      }

      return false;
    });
  };

  const activeHoverDateStr = selectedDateKey;

  const activeDateSlots = activeHoverDateStr ? getSlotsForDate(activeHoverDateStr) : [];
  const isBookingDatePast = isPastDateKey(formData.date);

  // Real-time conflict detection for the direct booking form
  const createSlotConflict = useMemo(() => {
    if (!formData.startTime || !formData.endTime || !formData.date || !roomSlots.length) return null;
    const [sh, sm] = (formData.startTime || '').split(':').map(Number);
    const [eh, em] = (formData.endTime || '').split(':').map(Number);
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em) || (sh * 60 + sm) >= (eh * 60 + em)) {
      return null;
    }
    const startMs = new Date(`${formData.date}T${formData.startTime}:00+03:00`).getTime();
    const endMs = new Date(`${formData.date}T${formData.endTime}:00+03:00`).getTime();
    return roomSlots.find((s) => {
      if (s.status && s.status !== 'CONFIRMED') return false;
      if (!s.scheduledStartTime || !s.scheduledEndTime) return false;
      const sStart = new Date(s.scheduledStartTime).getTime();
      const sEnd = new Date(s.scheduledEndTime).getTime();
      return startMs < sEnd && endMs > sStart;
    }) || null;
  }, [formData.date, formData.startTime, formData.endTime, roomSlots]);

  // Form Submit: Instant direct booking without approvals!
  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (isBookingDatePast) {
      toast.error('Past dates are read-only. Please choose today or a future date to make a booking.');
      return;
    }
    if (isPastTimeToday(formData.date, formData.startTime)) {
      toast.error('The selected start time has already passed. Please choose a later time.');
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
    if (createSlotConflict) {
      toast.error(
        `Cannot book: Slot overlaps with "${createSlotConflict.meetingTitle || 'Another Meeting'}" (${createSlotConflict.timeFormatted || 'Reserved'}). Please choose an open time window.`
      );
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
        meetingAgenda: formData.visitObjective?.trim() || null,
        guestOrganizationName: formData.guestName?.trim() || null,
        guestName: formData.guestName?.trim() || null,
        requestedItems: formData.requestedItems?.trim() || null,
        engagementType: formData.engagementType || 'INTERNAL',
      };

      const result = await roomBookingApi.createBooking(payload);
      soundPlayer.playNotificationChime();
      toast.success(
        `🎉 Room "${selectedRoom.name}" booked successfully! Booking Reference: ${result.bookingCode}`
      );

      const bookedDateStr = formData.date;
      const optimisticSlot = {
        id: result?.id || `rb-${Date.now()}`,
        bookingCode: result?.bookingCode || `RB-${Date.now().toString().slice(-6)}`,
        roomName: selectedRoom.name,
        meetingTitle: formData.title.trim(),
        hostDepartment: payload.hostDepartment,
        bookedByName: user?.fullName || 'Me',
        bookedByEmail: user?.email || '',
        bookedByPhone: user?.phoneNumber || user?.phone || '',
        scheduledStartTime: startIso,
        scheduledEndTime: endIso,
        date: bookedDateStr,
        timeFormatted: `${formatTimeTo12Hr(formData.startTime)} - ${formatTimeTo12Hr(formData.endTime)}`,
        expectedAttendees: payload.expectedAttendees,
        meetingAgenda: payload.meetingAgenda,
        guestName: payload.guestName,
        guestOrganizationName: payload.guestOrganizationName,
        requestedItems: payload.requestedItems,
        engagementType: payload.engagementType,
        status: 'CONFIRMED',
      };

      setRoomSlots((prev) => [
        optimisticSlot,
        ...prev.filter((s) => s.bookingCode !== optimisticSlot.bookingCode && s.id !== optimisticSlot.id),
      ]);
      setSelectedDateKey(bookedDateStr);

      // Refresh slots from backend
      loadRoomSlots(selectedRoom.name);

      // Reset form title/objective
      setFormData((prev) => ({
        ...prev,
        title: '',
        visitObjective: '',
        guestName: '',
        requestedItems: '',
        engagementType: 'INTERNAL',
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
                <div className="flex items-center gap-2.5 text-xs text-slate-600 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 font-semibold text-slate-800">
                    <Shield className="w-3.5 h-3.5 text-amber-600" />
                    <span>Room Supervisor: {supervisorDetails.name}</span>
                  </span>
                  {supervisorDetails.email && (
                    <a href={`mailto:${supervisorDetails.email}`} className="text-sky-600 hover:underline font-mono text-[11px]">
                      {supervisorDetails.email}
                    </a>
                  )}
                  <span className="text-slate-300">•</span>
                  <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 text-[11px] font-bold">
                    <Coffee className="w-3 h-3 text-amber-600" />
                    <span>Coffee & Refreshments: Set by Room Supervisor</span>
                  </span>
                </div>
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

                {(isLoadingSlots || slotLoadError) && (
                  <div
                    role={slotLoadError ? 'alert' : 'status'}
                    className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-xs font-medium ${
                      slotLoadError
                        ? 'border border-rose-200 bg-rose-50 text-rose-700'
                        : 'border border-sky-200 bg-sky-50 text-sky-700'
                    }`}
                  >
                    <span>{slotLoadError || 'Loading room bookings…'}</span>
                    {slotLoadError && (
                      <button
                        type="button"
                        onClick={() => loadRoomSlots(selectedRoom.name)}
                        className="shrink-0 font-bold underline"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                )}

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
                    const isSelected = selectedDateKey === dateKey;

                    return (
                      <div
                        key={`day-${dayNumber}`}
                        onClick={() => {
                          setSelectedDateKey(dateKey);
                          if (!isPastDateKey(dateKey)) {
                            setFormData((prev) => ({ ...prev, date: dateKey }));
                          }
                        }}
                        onMouseEnter={() => setHoveredDate(dayNumber)}
                        onMouseLeave={() => setHoveredDate(null)}
                        className={`h-14 p-1.5 rounded-2xl border transition-colors duration-150 flex flex-col justify-between select-none relative cursor-pointer ${
                          isPastDateKey(dateKey)
                            ? 'bg-slate-100/70 border-slate-200 text-slate-500'
                            : 'border-slate-100 hover:border-blue-300 hover:bg-slate-50'
                        } ${
                          isSelected
                            ? 'border-[#00adef] bg-blue-50/70 shadow-xs ring-1 ring-[#00adef]'
                            : ''
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
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                isPastDateKey(dateKey) ? 'bg-slate-400' : 'bg-red-500'
                              }`}
                            />
                            <span
                              className={`text-[10px] font-bold truncate ${
                                isPastDateKey(dateKey) ? 'text-slate-600' : 'text-red-600'
                              }`}
                            >
                              {slots.length} {isPastDateKey(dateKey) ? 'Held' : 'Booked'}
                            </span>
                          </div>
                        ) : (
                          <span
                            className={`text-[9px] font-medium pointer-events-none ${
                              isPastDateKey(dateKey) ? 'text-slate-400' : 'text-emerald-600'
                            }`}
                          >
                            {isPastDateKey(dateKey) ? 'No history' : 'Available'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Interactive Hourly Schedule & In-Place Cancellation Section */}
                <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/80 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">                    <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showReserverContact}
                        onChange={(e) => setShowReserverContact(e.target.checked)}
                        className="rounded border-slate-300 text-[#00adef] focus:ring-[#00adef]"
                      />
                      Show reserver contact
                    </label>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#00adef]" />
                      <span className="text-xs font-bold text-slate-800">
                        Schedule on {formatDisplayDate(activeHoverDateStr)}
                      </span>
                    </div>
                    {activeDateSlots.length > 0 ? (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isPastDateKey(activeHoverDateStr) ? 'bg-slate-200 text-slate-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {activeDateSlots.length} {isPastDateKey(activeHoverDateStr) ? 'Past ' : ''}{activeDateSlots.length === 1 ? 'Booking' : 'Bookings'}
                      </span>
                    ) : (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isPastDateKey(activeHoverDateStr) ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {isPastDateKey(activeHoverDateStr) ? 'No Past Bookings' : 'Open All Day'}
                      </span>
                    )}
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-2 pr-2 custom-scroll-thick">
                    {activeDateSlots.length > 0 ? (
                      activeDateSlots.map((slot) => {
                        const canModify = checkCanModifyBooking(slot);
                        return (
                          <div
                            key={slot.id || slot.bookingCode}
                            className={`p-3 rounded-xl border shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 transition-all ${
                              slot.status === 'COMPLETED' || isPastDateKey(slot.date)
                                ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 rounded-md bg-sky-50 text-[#00adef] border border-sky-200 text-[11px] font-bold font-mono">
                                  {slot.timeFormatted || 'Reserved'}
                                </span>
                                {slot.status === 'COMPLETED' || isPastDateKey(slot.date) ? (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold">
                                    Completed (Past)
                                  </span>
                                ) : slot.status === 'CANCELLED' ? (
                                  <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                                    Cancelled
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                    Confirmed
                                  </span>
                                )}
                                {slot.engagementType === 'EXTERNAL' ? (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                                    <Globe className="w-2.5 h-2.5" />
                                    <span>External Stakeholders</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold flex items-center gap-1">
                                    <Users className="w-2.5 h-2.5" />
                                    <span>Internal Staff</span>
                                  </span>
                                )}
                                <span className="text-xs font-bold text-slate-900">
                                  {slot.meetingTitle || 'Scheduled Meeting'}
                                </span>
                                {slot.bookingCode && (
                                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                    Ref: {slot.bookingCode}
                                  </span>
                                )}
                              </div>

                              {/* BOOKED BY & GUEST ROWS */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 pt-1 text-[11px]">
                                {/* Staff Member who Booked */}
                                {(() => {
                                  let reserverName = slot.bookedByName;
                                  const isGeneric = !reserverName ||
                                    ['Coop Staff Member', 'Staff Member', 'Bank Staff', 'staff'].includes(reserverName.trim()) ||
                                    (slot.guestName && reserverName.trim().toLowerCase() === slot.guestName.trim().toLowerCase());

                                  if (isGeneric) {
                                    if (slot.bookedByUsername && !['staff', 'user'].includes(slot.bookedByUsername.trim().toLowerCase())) {
                                      reserverName = `${slot.bookedByUsername.trim()} (Staff)`;
                                    } else if (slot.bookedByEmail) {
                                      reserverName = slot.bookedByEmail.split('@')[0];
                                    } else {
                                      reserverName = slot.hostDepartment ? `${slot.hostDepartment} Staff` : 'Coop Staff Member';
                                    }
                                  }

                                  return (
                                    <div className="flex items-center gap-1.5 text-slate-700 flex-wrap">
                                      <span className="text-slate-500 font-semibold flex items-center gap-1">
                                        <User className="w-3.5 h-3.5 text-amber-500" />
                                        <span>Booked By:</span>
                                      </span>
                                      <span className="font-bold text-slate-900 bg-amber-50/80 border border-amber-200/80 px-2 py-0.5 rounded-md text-xs">
                                        {reserverName}
                                      </span>
                                      {slot.hostDepartment && (
                                        <span className="text-slate-500 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                                          {slot.hostDepartment}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })()}

                                {/* Guest / Visitor if available */}
                                {(slot.guestName || slot.guestOrganizationName) ? (
                                  <div className="flex items-center gap-1.5 text-slate-700 flex-wrap">
                                    <span className="text-slate-500 font-semibold flex items-center gap-1">
                                      <Users className="w-3.5 h-3.5 text-[#00adef]" />
                                      <span>Guest / Visitor:</span>
                                    </span>
                                    <span className="font-bold text-slate-800 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md text-xs">
                                      {slot.guestName || slot.guestOrganizationName}
                                    </span>
                                    {slot.guestOrganizationName && slot.guestName && slot.guestName !== slot.guestOrganizationName && (
                                      <span className="text-slate-500 text-[10px]">
                                        ({slot.guestOrganizationName})
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                                    <span>Internal Attendance Only</span>
                                  </div>
                                )}
                              </div>

                              {/* CONTACTS & DETAILS */}
                              <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap pt-0.5">
                                {slot.bookedByPhone && (
                                  <a
                                    href={`tel:${slot.bookedByPhone}`}
                                    className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 hover:underline font-medium bg-emerald-50/70 border border-emerald-200/60 px-2 py-0.5 rounded-md"
                                    onClick={(e) => e.stopPropagation()}
                                    title="Call reserving staff member"
                                  >
                                    <Phone className="w-3 h-3 text-emerald-600" />
                                    <span>{slot.bookedByPhone}</span>
                                  </a>
                                )}
                                {slot.bookedByEmail && (
                                  <a
                                    href={`mailto:${slot.bookedByEmail}`}
                                    className="flex items-center gap-1 text-sky-600 hover:text-sky-700 hover:underline font-medium bg-sky-50/70 border border-sky-200/60 px-2 py-0.5 rounded-md"
                                    onClick={(e) => e.stopPropagation()}
                                    title="Email reserving staff member"
                                  >
                                    <Mail className="w-3 h-3 text-sky-600" />
                                    <span>{slot.bookedByEmail}</span>
                                  </a>
                                )}
                                {slot.expectedAttendees && (
                                  <span className="flex items-center gap-1 text-slate-500">
                                    <Users className="w-3 h-3 text-slate-400" />
                                    <span>{slot.expectedAttendees} attendees</span>
                                  </span>
                                )}
                                {slot.requestedItems && (
                                  <span className="flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200 text-[10px] font-semibold flex-wrap">
                                    {slot.requestedItems.toLowerCase().includes('coffee') || slot.requestedItems.toLowerCase().includes('refreshment') ? (
                                      <Coffee className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                    ) : null}
                                    <span>{slot.requestedItems}</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* In-Place Actions: Edit & Cancel (Strictly authorized & only for active future/present bookings) */}
                            <div className="shrink-0 flex items-center gap-1.5 self-center sm:self-auto flex-wrap">
                              {hasRoomRefreshments && supervisorDetails.isSupervisor && slot.status !== 'COMPLETED' && !isPastDateKey(slot.date) && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenSupervisorRefreshmentModal(slot);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                                  title="Room Supervisor: Set or adjust refreshments for this booking"
                                >
                                  <Coffee className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Set Refreshments</span>
                                </button>
                              )}

                              {slot.status === 'COMPLETED' || isPastDateKey(slot.date) ? (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200">
                                  Past Record
                                </span>
                              ) : canModify ? (
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
                                      setCancellationReason('');
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
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center gap-2.5 text-xs font-medium">
                        <Info className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>
                          {isPastDateKey(activeHoverDateStr)
                            ? 'No room bookings recorded for this date in history.'
                            : 'This room has no bookings on this date. Full schedule is open for booking.'}
                        </span>
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
                {/* Engagement Type Radio Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Engagement Type <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Option 1: Internal (Staff Only) */}
                    <label
                      className={`relative flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                        formData.engagementType === 'INTERNAL'
                          ? 'border-[#00adef] bg-sky-50/70 shadow-xs ring-1 ring-[#00adef]'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <input
                        type="radio"
                        name="engagementType"
                        value="INTERNAL"
                        checked={formData.engagementType === 'INTERNAL'}
                        onChange={() => setFormData((prev) => ({ ...prev, engagementType: 'INTERNAL' }))}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        formData.engagementType === 'INTERNAL'
                          ? 'border-[#00adef] bg-[#00adef]'
                          : 'border-slate-300 bg-white'
                      }`}>
                        {formData.engagementType === 'INTERNAL' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                          <Users className="w-3.5 h-3.5 text-[#00adef]" />
                          <span>Internal</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">Staff Only</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                          Internal staff, colleagues & Coop teams
                        </p>
                      </div>
                    </label>

                    {/* Option 2: External (Stakeholders) */}
                    <label
                      className={`relative flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                        formData.engagementType === 'EXTERNAL'
                          ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <input
                        type="radio"
                        name="engagementType"
                        value="EXTERNAL"
                        checked={formData.engagementType === 'EXTERNAL'}
                        onChange={() => setFormData((prev) => ({ ...prev, engagementType: 'EXTERNAL' }))}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        formData.engagementType === 'EXTERNAL'
                          ? 'border-emerald-600 bg-emerald-600'
                          : 'border-slate-300 bg-white'
                      }`}>
                        {formData.engagementType === 'EXTERNAL' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                          <Globe className="w-3.5 h-3.5 text-emerald-600" />
                          <span>External</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Stakeholders</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                          External guests, partners & clients
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

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
                        setSelectedDateKey(val);
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
                      const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));
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
                      const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));
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

                  {/* Overlap Conflict Notice for New Booking */}
                  {createSlotConflict && (
                    <div className="flex items-start gap-2.5 p-3.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-2xl text-xs font-medium animate-fadeIn">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-amber-800">Time Window Conflict Detected</p>
                        <p className="text-amber-700 leading-relaxed mt-0.5">
                          This room is already reserved for <strong>{createSlotConflict.meetingTitle || 'Another Meeting'}</strong> ({createSlotConflict.timeFormatted || 'Reserved'}). Please select an open time window.
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
                    Meeting Agenda / Purpose (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Briefly describe the purpose of this meeting or visit (leave empty if none)..."
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

                {/* 1. Facility Equipment (Available for general staff self-selection) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Facility Equipment (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Write the equipment you need, e.g. projector, video conference system, HDMI cable..."
                    value={formData.requestedItems}
                    onChange={(e) => setFormData({ ...formData, requestedItems: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  />
                </div>

                {hasRoomRefreshments && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                      <Coffee className="w-4 h-4 text-amber-600" />
                      <span>
                        {supervisorDetails.isSupervisor
                          ? 'Coffee & Hospitality (Room Supervisor)'
                          : 'Refreshments Available'}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      Choose from refreshments listed by the room supervisor. Availability is limited to this room.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {roomRefreshmentOptions.map((item) => {
                        const isSelected = (formData.requestedItems || '')
                          .split(',')
                          .map((value) => value.trim())
                          .includes(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setFormData((prev) => {
                              const items = (prev.requestedItems || '')
                                .split(',')
                                .map((value) => value.trim())
                                .filter(Boolean);
                              const updated = isSelected
                                ? items.filter((value) => value !== item)
                                : [...items, item];
                              return { ...prev, requestedItems: updated.join(', ') };
                            })}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                : 'bg-white text-amber-900 border-amber-200 hover:border-amber-400 hover:bg-amber-100/50'
                            }`}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

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
                    disabled={isSubmitting || isBookingDatePast || isPastTimeToday(formData.date, formData.startTime) || !!createSlotConflict}
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

                {/* Engagement Type Radio Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Engagement Type *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Option 1: Internal */}
                    <label
                      className={`relative flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                        editFormData.engagementType === 'INTERNAL'
                          ? 'border-[#00adef] bg-sky-50/70 shadow-xs ring-1 ring-[#00adef]'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <input
                        type="radio"
                        name="editEngagementType"
                        value="INTERNAL"
                        checked={editFormData.engagementType === 'INTERNAL'}
                        onChange={() => setEditFormData((prev) => ({ ...prev, engagementType: 'INTERNAL' }))}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        editFormData.engagementType === 'INTERNAL'
                          ? 'border-[#00adef] bg-[#00adef]'
                          : 'border-slate-300 bg-white'
                      }`}>
                        {editFormData.engagementType === 'INTERNAL' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                          <Users className="w-3.5 h-3.5 text-[#00adef]" />
                          <span>Internal</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">Staff Only</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                          Staff & internal team meetings
                        </p>
                      </div>
                    </label>

                    {/* Option 2: External */}
                    <label
                      className={`relative flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                        editFormData.engagementType === 'EXTERNAL'
                          ? 'border-emerald-500 bg-emerald-50/70 shadow-xs ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <input
                        type="radio"
                        name="editEngagementType"
                        value="EXTERNAL"
                        checked={editFormData.engagementType === 'EXTERNAL'}
                        onChange={() => setEditFormData((prev) => ({ ...prev, engagementType: 'EXTERNAL' }))}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        editFormData.engagementType === 'EXTERNAL'
                          ? 'border-emerald-600 bg-emerald-600'
                          : 'border-slate-300 bg-white'
                      }`}>
                        {editFormData.engagementType === 'EXTERNAL' && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                          <Globe className="w-3.5 h-3.5 text-emerald-600" />
                          <span>External</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Stakeholders</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                          External guests & stakeholders
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

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
                    const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));
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
                    const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));
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
                    Meeting Objective / Agenda (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={editFormData.meetingAgenda}
                    onChange={(e) => setEditFormData({ ...editFormData, meetingAgenda: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#00adef] text-slate-800"
                    placeholder="Discussion topics, leave empty if none..."
                  />
                </div>

                {/* 1. Facility Equipment (Available for staff self-selection) */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Facility Equipment (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Write the equipment you need, e.g. projector, video conference system, HDMI adapter..."
                    value={editFormData.requestedItems}
                    onChange={(e) => setEditFormData({ ...editFormData, requestedItems: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-[#00adef] text-slate-800"
                  />
                </div>

                {hasRoomRefreshments && (
                  <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                      <Coffee className="w-4 h-4 text-amber-600" />
                      <span>Refreshments Available</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {roomRefreshmentOptions.map((item) => {
                        const isSelected = (editFormData.requestedItems || '')
                          .split(',')
                          .map((value) => value.trim())
                          .includes(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setEditFormData((prev) => {
                              const items = (prev.requestedItems || '')
                                .split(',')
                                .map((value) => value.trim())
                                .filter(Boolean);
                              const updated = isSelected
                                ? items.filter((value) => value !== item)
                                : [...items, item];
                              return { ...prev, requestedItems: updated.join(', ') };
                            })}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                : 'bg-white text-amber-900 border-amber-200 hover:border-amber-400 hover:bg-amber-100/50'
                            }`}
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

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
                    disabled={isUpdating || !!slotConflict || isPastDateKey(editFormData.date) || isPastTimeToday(editFormData.date, editFormData.startTime)}
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
          onClose={() => { if (!isCancelling) { setCancellationReason(''); setCancellingBooking(null); } }}
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

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Cancellation reason <span className="text-rose-500">*</span></label>
              <textarea rows={3} value={cancellationReason} onChange={(e) => setCancellationReason(e.target.value)} placeholder="Explain why this reservation is being cancelled" className="w-full rounded-xl border border-slate-300 p-3 text-xs text-slate-900 focus:outline-none focus:border-[#00adef] resize-y" />
            </div>            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
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
                disabled={isCancelling || !cancellationReason.trim()}
                icon={AlertTriangle}
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Room Supervisor Refreshment Management Modal */}
      {refreshmentModalBooking && (
        <Modal
          isOpen={!!refreshmentModalBooking}
          onClose={() => setRefreshmentModalBooking(null)}
          title="Room Supervisor Hospitality Setup"
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 text-left p-1">
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Coffee className="w-4 h-4 text-amber-600" />
                <span>Room Supervisor Authority</span>
              </div>
              <p className="text-amber-800 leading-relaxed text-[11px]">
                As Room Supervisor ({supervisorDetails.name}), configure or update hospitality services for meeting{' '}
                <strong>{refreshmentModalBooking.meetingTitle}</strong> (Ref:{' '}
                <span className="font-mono font-bold">{refreshmentModalBooking.bookingCode}</span>).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Hospitality & Refreshments to Provide
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {roomRefreshmentOptions.map((item) => {
                  const isSelected = (supervisorRefreshmentItems || []).includes(item);
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => {
                        setSupervisorRefreshmentItems((prev) =>
                          isSelected ? prev.filter((i) => i !== item) : [...prev, item]
                        );
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50'
                      }`}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
              {!hasRoomRefreshments && (
                <p className="text-xs text-slate-500">
                  Refreshments are currently hidden or have not been configured for this room.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Custom Catering Instructions / Serving Time
              </label>
              <input
                type="text"
                placeholder="e.g. Serve hot coffee at 10:00 AM, VIP cups for 8 guests..."
                value={supervisorRefreshmentNotes}
                onChange={(e) => setSupervisorRefreshmentNotes(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRefreshmentModalBooking(null)}
                disabled={isSavingRefreshments}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="orange"
                size="sm"
                onClick={handleSaveSupervisorRefreshments}
                disabled={isSavingRefreshments}
                icon={CheckCircle}
              >
                {isSavingRefreshments ? 'Saving Refreshments...' : 'Confirm Refreshments'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default VisitCalendarPage;
