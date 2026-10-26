import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DoorOpen,
  Plus,
  Search,
  Building2,
  Users,
  User,
  Mail,
  MapPin,
  Clock,
  Edit2,
  Trash2,
  Upload,
  Image as ImageIcon,
  Sparkles,
  Filter,
  CheckCircle2,
  CalendarDays,
  ExternalLink,
  RefreshCw,
  X,
  Shield,
  Info,
  Lock,
  Check,
  AlertTriangle,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import useAuthStore from '@/modules/auth/store/authStore';
import useMasterDataStore from '@/modules/master_data/store/masterDataStore';
import masterDataApi from '@/modules/master_data/api/masterDataApi';
import userApi from '@/modules/users/api/userApi';
import roomBookingApi from '@/modules/booking/api/roomBookingApi';
import Button from '@/shared/components/ui/Button';
import Modal from '@/shared/components/ui/Modal';
import Input from '@/shared/components/ui/Input';
import Spinner from '@/shared/components/ui/Spinner';
import { resolveImageUrl } from '@/core/utils/imageUtils';

export const BookingManagementPage = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuthStore();
  const isAdmin = hasRole('ROLE_ADMIN');
  const isSecretary = hasRole('ROLE_SECRETARY');
  const userDept = user?.department || '';

  const {
    meetingRooms,
    departments,
    isLoading,
    fetchAllMasterData,
    createMeetingRoom,
    updateMeetingRoom,
    deleteMeetingRoom,
  } = useMasterDataStore();

  // Active Tab: 'rooms' | 'myReservations' | 'allBookings'
  const [activeTab, setActiveTab] = useState('myReservations');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');

  // My Reservations State
  const [myBookings, setMyBookings] = useState([]);
  const [isLoadingMyBookings, setIsLoadingMyBookings] = useState(false);
  const [myBookingsPage, setMyBookingsPage] = useState(0);
  const [myBookingsTotalPages, setMyBookingsTotalPages] = useState(0);
  const [myBookingsTotalElements, setMyBookingsTotalElements] = useState(0);
  const [myBookingsSearch, setMyBookingsSearch] = useState('');
  const [myBookingsStatusFilter, setMyBookingsStatusFilter] = useState('');
  const [cancellingBookingId, setCancellingBookingId] = useState(null);
  const [isCancellingBooking, setIsCancellingBooking] = useState(false);

  // All Bookings State (Admin/Secretary)
  const [allBookings, setAllBookings] = useState([]);
  const [isLoadingAllBookings, setIsLoadingAllBookings] = useState(false);
  const [allBookingsPage, setAllBookingsPage] = useState(0);
  const [allBookingsTotalPages, setAllBookingsTotalPages] = useState(0);
  const [allBookingsTotalElements, setAllBookingsTotalElements] = useState(0);
  const [allBookingsSearch, setAllBookingsSearch] = useState('');
  const [allBookingsStatusFilter, setAllBookingsStatusFilter] = useState('');

  // Room Creation / Edit Modal State
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [isSavingRoom, setIsSavingRoom] = useState(false);
  const [roomImageFile, setRoomImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  // Available Users List for Person in Charge
  const [usersList, setUsersList] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Form State
  const initialFormState = {
    name: '',
    floorLocation: '',
    department: isSecretary ? userDept : '',
    capacity: 12,
    imageUrl: '',
    assignedUserId: null,
    assignedUserName: '',
    contactEmail: '',
    description: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  // Delete Confirmation State
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch users for Person in Charge dropdown
  const fetchUsers = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const data = await masterDataApi.getCustodians();
      if (Array.isArray(data) && data.length > 0) {
        setUsersList(data);
      } else {
        try {
          const res = await userApi.getAllUsers({ size: 100 });
          const list = res?.content || res || [];
          setUsersList(Array.isArray(list) ? list : []);
        } catch (_) {
          setUsersList([]);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch custodians from masterDataApi, trying userApi:', e);
      try {
        const res = await userApi.getAllUsers({ size: 100 });
        const list = res?.content || res || [];
        setUsersList(Array.isArray(list) ? list : []);
      } catch (err) {
        console.warn('Failed to load users:', err);
        setUsersList([]);
      }
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  // Fetch master data & users on mount
  useEffect(() => {
    fetchAllMasterData();
    fetchUsers();
  }, [fetchAllMasterData, fetchUsers]);

  // Fetch My Bookings
  const fetchMyBookings = useCallback(async (pageNum = 0) => {
    setIsLoadingMyBookings(true);
    try {
      const res = await roomBookingApi.getMyBookings({
        page: pageNum,
        size: 10,
        search: myBookingsSearch || undefined,
        status: myBookingsStatusFilter || undefined,
        sortBy: 'scheduledStartTime',
        sortDirection: 'desc',
      });
      setMyBookings(res?.content || []);
      setMyBookingsTotalPages(res?.totalPages || 0);
      setMyBookingsTotalElements(res?.totalElements || 0);
      setMyBookingsPage(pageNum);
    } catch (err) {
      console.warn('Failed to load my bookings:', err);
      setMyBookings([]);
    } finally {
      setIsLoadingMyBookings(false);
    }
  }, [myBookingsSearch, myBookingsStatusFilter]);

  // Fetch All Bookings (Admin view)
  const fetchAllBookings = useCallback(async (pageNum = 0) => {
    setIsLoadingAllBookings(true);
    try {
      const res = await roomBookingApi.getBookings({
        page: pageNum,
        size: 10,
        search: allBookingsSearch || undefined,
        status: allBookingsStatusFilter || undefined,
        sortBy: 'scheduledStartTime',
        sortDirection: 'desc',
      });
      setAllBookings(res?.content || []);
      setAllBookingsTotalPages(res?.totalPages || 0);
      setAllBookingsTotalElements(res?.totalElements || 0);
      setAllBookingsPage(pageNum);
    } catch (err) {
      console.warn('Failed to load all bookings:', err);
      setAllBookings([]);
    } finally {
      setIsLoadingAllBookings(false);
    }
  }, [allBookingsSearch, allBookingsStatusFilter]);

  useEffect(() => {
    if (activeTab === 'myReservations') {
      fetchMyBookings(0);
    } else if (activeTab === 'allBookings' && (isAdmin || isSecretary)) {
      fetchAllBookings(0);
    }
  }, [activeTab, fetchMyBookings, fetchAllBookings, isAdmin, isSecretary]);

  const handleCancelBooking = async (bookingId) => {
    setIsCancellingBooking(true);
    try {
      await roomBookingApi.cancelBooking(bookingId);
      toast.success('Reservation cancelled successfully.');
      setCancellingBookingId(null);
      fetchMyBookings(myBookingsPage);
      if (activeTab === 'allBookings') fetchAllBookings(allBookingsPage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel reservation.');
    } finally {
      setIsCancellingBooking(false);
    }
  };

  const formatBookingTime = (isoString) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleString('en-US', {
        timeZone: 'Africa/Addis_Ababa',
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoString;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return { label: 'Confirmed', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'CANCELLED':
        return { label: 'Cancelled', cls: 'bg-red-50 text-red-700 border-red-200' };
      case 'COMPLETED':
        return { label: 'Completed', cls: 'bg-slate-100 text-slate-600 border-slate-200' };
      case 'NO_SHOW':
        return { label: 'No Show', cls: 'bg-orange-50 text-orange-700 border-orange-200' };
      default:
        return { label: status || 'Unknown', cls: 'bg-blue-50 text-blue-700 border-blue-200' };
    }
  };
  const getEffectiveBookingStatus = (booking) => {
    if (booking.status === 'CONFIRMED' && booking.scheduledEndTime && new Date(booking.scheduledEndTime).getTime() <= Date.now()) return 'COMPLETED';
    return booking.status;
  };

  const renderBookingCard = (booking, canCancel = true) => {


    const effectiveStatus = getEffectiveBookingStatus(booking);
    const statusBadge = getStatusBadge(effectiveStatus);
    const isConfirmed = effectiveStatus === 'CONFIRMED';
    return (
      <div
        key={booking.id}
        className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden"
      >
        <div className="flex items-start gap-4 p-4">
          {/* Room thumbnail */}
          <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
            <img
              src={resolveImageUrl(booking.roomImageUrl) || '/rooms/executive-boardroom.jpg'}
              alt={booking.roomName}
              onError={(e) => { e.target.onerror = null; e.target.src = '/rooms/executive-boardroom.jpg'; }}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p className="font-bold text-sm text-slate-900 truncate">{booking.meetingTitle || '(No Title)'}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                  <DoorOpen className="w-3 h-3 shrink-0" />
                  {booking.roomName || '—'}
                  {booking.bookingCode && (
                    <span className="ml-1 font-mono text-[10px] text-slate-400">#{booking.bookingCode}</span>
                  )}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${statusBadge.cls}`}>
                {statusBadge.label}
              </span>
            </div>

            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                <span><span className="font-semibold">Start:</span> {formatBookingTime(booking.scheduledStartTime)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                <span><span className="font-semibold">End:</span> {formatBookingTime(booking.scheduledEndTime)}</span>
              </div>
              {booking.bookedByName && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <User className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{booking.bookedByName}</span>
                  {booking.hostDepartment && <span className="text-slate-400">· {booking.hostDepartment}</span>}
                </div>
              )}
              {booking.expectedAttendees && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <Users className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{booking.expectedAttendees} attendees expected</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        {canCancel && isConfirmed && (
          <div className="px-4 pb-4 flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={Calendar}
              onClick={() => navigate('/visits/calendar')}
              className="text-[#00adef] hover:bg-blue-50 border border-blue-100"
            >
              View Calendar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={XCircle}
              onClick={() => setCancellingBookingId(booking.id)}
              className="text-red-600 hover:bg-red-50 border border-red-100"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderBookingTable = (bookings, canCancel = true) => (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              <th className="px-4 py-3">Meeting</th><th className="px-4 py-3">Room</th><th className="px-4 py-3">Schedule</th><th className="px-4 py-3">Booker</th><th className="px-4 py-3">Attendees</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.map((booking) => {
              const effectiveStatus = getEffectiveBookingStatus(booking);
              const statusBadge = getStatusBadge(effectiveStatus);
              const canCancelBooking = canCancel && effectiveStatus === 'CONFIRMED';
              return (
                <tr key={booking.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 min-w-[190px]"><p className="font-bold text-slate-900">{booking.meetingTitle || '(No Title)'}</p><p className="font-mono text-[10px] text-slate-400 mt-1">#{booking.bookingCode || '—'}</p></td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className="inline-flex items-center gap-1.5 font-semibold text-slate-700"><DoorOpen className="w-3.5 h-3.5 text-slate-400" />{booking.roomName || '—'}</span></td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600"><div><span className="font-semibold">Start:</span> {formatBookingTime(booking.scheduledStartTime)}</div><div className="mt-1"><span className="font-semibold">End:</span> {formatBookingTime(booking.scheduledEndTime)}</div></td>
                  <td className="px-4 py-3 min-w-[150px] text-slate-600"><p>{booking.bookedByName || '—'}</p>{booking.hostDepartment && <p className="text-[10px] text-slate-400 mt-1">{booking.hostDepartment}</p>}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">{booking.expectedAttendees || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className={`px-2 py-1 rounded-full text-[10px] font-bold border ${statusBadge.cls}`}>{statusBadge.label}</span></td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">{canCancelBooking ? <Button variant="ghost" size="sm" icon={XCircle} onClick={() => setCancellingBookingId(booking.id)} className="text-red-600 hover:bg-red-50 border border-red-100">Cancel</Button> : <span className="text-[10px] text-slate-400">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
  // Authentic CoopBank default fallback rooms
  const defaultRooms = useMemo(
    () => [
      {
        id: 'default-1',
        name: 'Executive Boardroom',
        floorLocation: '5th Floor - Executive Wing',
        capacity: 18,
        department: 'Executive Office',
        assignedUserName: 'Sister Aster (Executive Secretary)',
        contactEmail: 'aster.k@coopbankoromia.com.et',
        imageUrl: '/rooms/executive-boardroom.jpg',
        description: 'Primary boardroom with 4K interactive presentation suite, 18 ergonomic executive leather seats, and high-fidelity video conferencing.',
      },
      {
        id: 'default-2',
        name: 'FinTech Innovation Room A',
        floorLocation: '3rd Floor - Digital Banking Suite',
        capacity: 12,
        department: 'Digital Banking & MSME',
        assignedUserName: 'Abebe D. (Digital Product Lead)',
        contactEmail: 'fintech.rooms@coopbankoromia.com.et',
        imageUrl: '/rooms/fintech-bar-counter.jpg',
        description: 'Collaborative high-counter workspace with acoustic soundproofing and interactive digital whiteboards.',
      },
      {
        id: 'default-3',
        name: 'Strategic Peering Room B',
        floorLocation: '3rd Floor - MSME Division',
        capacity: 10,
        department: 'Retail Banking & MSME',
        assignedUserName: 'Chaltu B. (Operations Manager)',
        contactEmail: 'strategic.rooms@coopbankoromia.com.et',
        imageUrl: '/rooms/africa-table.jpg',
        description: 'Dedicated room for strategic bilateral partner negotiations and executive delegation briefings.',
      },
      {
        id: 'default-4',
        name: 'CoopBank HQ VIP Lounge',
        floorLocation: 'Ground Floor - Main Atrium',
        capacity: 25,
        department: 'Operations & Front Desk',
        assignedUserName: 'VIP Hospitality Desk',
        contactEmail: 'vip.hospitality@coopbankoromia.com.et',
        imageUrl: '/rooms/creative-lounge-stools.jpg',
        description: 'Spacious hospitality lounge for prominent institutional guests, ministerial delegations, and board members.',
      },
      {
        id: 'default-5',
        name: 'Executive Hospitality & Dining Facility',
        floorLocation: '6th Floor - Penthouse Suite',
        capacity: 16,
        department: 'Operations & Front Desk',
        assignedUserName: 'Executive Catering Coordinator',
        contactEmail: 'dining.facility@coopbankoromia.com.et',
        imageUrl: '/rooms/cafeteria-collaboration-table.jpg',
        description: 'Formal executive dining and reception suite designed for hosting lunch meetings with corporate partners.',
      },
    ],
    []
  );

  const activeRooms = meetingRooms && meetingRooms.length > 0 ? meetingRooms : defaultRooms;

  // Filtered rooms
  const filteredRooms = useMemo(() => {
    return activeRooms.filter((room) => {
      // Secretary multi-tenancy filter: if secretary, prioritize showing department rooms
      if (isSecretary && userDept && room.department) {
        if (room.department.toLowerCase() !== userDept.toLowerCase()) {
          // Keep showing if user didn't choose a specific filter, or let them see all
        }
      }

      const matchesSearch =
        !searchQuery ||
        room.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.floorLocation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.assignedUserName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.contactEmail?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCapacity =
        capacityFilter === 'ALL' ||
        (capacityFilter === 'SMALL' && room.capacity <= 10) ||
        (capacityFilter === 'MEDIUM' && room.capacity > 10 && room.capacity <= 18) ||
        (capacityFilter === 'LARGE' && room.capacity > 18);

      const matchesDept =
        departmentFilter === 'ALL' ||
        (room.department && room.department.toLowerCase() === departmentFilter.toLowerCase());

      return matchesSearch && matchesCapacity && matchesDept;
    });
  }, [activeRooms, searchQuery, capacityFilter, departmentFilter, isSecretary, userDept]);

  // Open Room Creation Modal
  const handleOpenCreateModal = () => {
    setEditingRoomId(null);
    setFormData({
      ...initialFormState,
      department: isSecretary ? userDept : departments[0]?.name || 'Executive Office',
    });
    setRoomImageFile(null);
    setImagePreviewUrl(null);
    setIsRoomModalOpen(true);
    fetchUsers();
  };

  // Open Room Edit Modal
  const handleOpenEditModal = (room) => {
    setEditingRoomId(room.id);

    // Auto-detect assigned user from usersList if assignedUserId is missing
    let matchedUserId = room.assignedUserId || null;
    if (!matchedUserId && usersList.length > 0) {
      const match = usersList.find(
        (u) =>
          (room.contactEmail && u.email && u.email.trim().toLowerCase() === room.contactEmail.trim().toLowerCase()) ||
          (room.assignedUserName && (u.fullName === room.assignedUserName || u.username === room.assignedUserName))
      );
      if (match) matchedUserId = match.id;
    }

    setFormData({
      name: room.name || '',
      floorLocation: room.floorLocation || '',
      department: isSecretary ? userDept : room.department || '',
      capacity: room.capacity || 12,
      imageUrl: room.imageUrl || '',
      assignedUserId: matchedUserId,
      assignedUserName: room.assignedUserName || '',
      contactEmail: room.contactEmail || '',
      description: room.description || '',
    });
    setRoomImageFile(null);
    setImagePreviewUrl(null);
    setIsRoomModalOpen(true);
    fetchUsers();
  };

  // Handle Photo Selection
  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setRoomImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
    }
  };

  // Save Room (Create or Update)
  const handleSaveRoom = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Meeting room name is required.');
      return;
    }

    setIsSavingRoom(true);
    try {
      const payload = {
        name: formData.name.trim(),
        floorLocation: formData.floorLocation.trim() || null,
        department: isSecretary ? userDept : (formData.department?.trim() || null),
        capacity: parseInt(formData.capacity, 10) || 1,
        imageUrl: formData.imageUrl?.trim() || null,
        assignedUserId: formData.assignedUserId || null,
        assignedUserName: formData.assignedUserName?.trim() || null,
        contactEmail: formData.contactEmail?.trim() || null,
        description: formData.description?.trim() || null,
      };

      let savedRoomId = editingRoomId;

      if (editingRoomId) {
        // Update existing room
        const res = await updateMeetingRoom(editingRoomId, payload);
        if (!res?.success) throw new Error(res?.error || 'Failed to update meeting room');
      } else {
        // Create new room
        const res = await createMeetingRoom(payload);
        if (!res?.success) throw new Error(res?.error || 'Failed to create meeting room');
        savedRoomId = res.room?.id;
      }

      // If an image file was selected, upload it
      if (roomImageFile && savedRoomId) {
        try {
          const uploadedRoom = await masterDataApi.uploadRoomImage(savedRoomId, roomImageFile);
          toast.success('Room photo uploaded successfully.');
          // Immediately update state so UI renders the new image with zero delay
          useMasterDataStore.setState((state) => ({
            meetingRooms: state.meetingRooms.map((r) =>
              r.id === savedRoomId ? { ...r, ...uploadedRoom } : r
            ),
          }));
        } catch (uploadErr) {
          console.warn('Image upload error:', uploadErr);
          toast.warning('Room details saved, but photo upload encountered an issue.');
        }
      }

      // Refresh master data to ensure everything is strictly synchronized
      await fetchAllMasterData();
      setIsRoomModalOpen(false);
      setRoomImageFile(null);
      setImagePreviewUrl(null);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Operation failed.';
      toast.error(msg);
    } finally {
      setIsSavingRoom(false);
    }
  };

  // Delete Room Confirmation
  const handleDeleteConfirm = async () => {
    if (!roomToDelete) return;
    setIsDeleting(true);
    try {
      await deleteMeetingRoom(roomToDelete.id, roomToDelete.name);
      toast.success(`Meeting Room "${roomToDelete.name}" deleted.`);
      setRoomToDelete(null);
      await fetchAllMasterData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete room.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 text-left animate-fadeIn pb-16">
      {/* ========================================================================= */}
      {/* 1. HEADER BANNER                                                          */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#00adef] border border-blue-200 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Executive Facilities & Meeting Rooms</span>
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
            Meeting Rooms & Reservations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            View your reservations, manage meeting facilities, and configure room specifications.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {(isAdmin || isSecretary) && (
            <Button
              variant="orange"
              size="md"
              onClick={handleOpenCreateModal}
              icon={Plus}
              className="shadow-md hover:shadow-lg font-bold"
            >
              Register Meeting Room
            </Button>
          )}

          <Button
            variant="cyan"
            size="md"
            onClick={() => navigate('/visits/calendar')}
            icon={CalendarDays}
            className="shadow-md hover:shadow-lg font-bold"
          >
            Book a Room
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              fetchAllMasterData();
              if (activeTab === 'myReservations') fetchMyBookings(0);
              else if (activeTab === 'allBookings') fetchAllBookings(0);
            }}
            disabled={isLoading}
            icon={RefreshCw}
            className="text-slate-600 hover:text-slate-900"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB SWITCHER                                                              */}
      {/* ========================================================================= */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-1 w-fit">
        <button
          onClick={() => setActiveTab('myReservations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'myReservations'
              ? 'bg-[#00adef] text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          My Reservations
          {myBookingsTotalElements > 0 && (
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === 'myReservations' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {myBookingsTotalElements}
            </span>
          )}
        </button>

        {(isAdmin || isSecretary) && (
          <button
            onClick={() => setActiveTab('allBookings')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
              activeTab === 'allBookings'
                ? 'bg-[#00adef] text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            All Bookings
            {allBookingsTotalElements > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'allBookings' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {allBookingsTotalElements}
              </span>
            )}
          </button>
        )}

        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
            activeTab === 'rooms'
              ? 'bg-[#00adef] text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <DoorOpen className="w-3.5 h-3.5" />
          Manage Rooms
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MY RESERVATIONS TAB                                                       */}
      {/* ========================================================================= */}
      {activeTab === 'myReservations' && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by room or meeting title..."
                value={myBookingsSearch}
                onChange={(e) => setMyBookingsSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchMyBookings(0)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#00adef] focus:outline-none transition-all"
              />
            </div>
            <select
              value={myBookingsStatusFilter}
              onChange={(e) => { setMyBookingsStatusFilter(e.target.value); }}
              className="text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="COMPLETED">Completed</option>
              <option value="NO_SHOW">No Show</option>
            </select>
            <Button size="sm" variant="ghost" onClick={() => fetchMyBookings(0)} icon={Search} className="shrink-0">
              Search
            </Button>
          </div>

          {/* Bookings List */}
          {isLoadingMyBookings ? (
            <div className="bg-white p-16 rounded-3xl border border-dashed border-slate-200 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-10 h-10 border-2 border-[#00adef] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400 font-medium">Loading your reservations...</p>
              </div>
            </div>
          ) : myBookings.length === 0 ? (
            <div className="bg-white p-16 rounded-3xl border border-dashed border-slate-300 text-center space-y-3">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-heading font-bold text-base text-slate-800">No Reservations Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {myBookingsSearch || myBookingsStatusFilter
                  ? 'No reservations match your search criteria.'
                  : "You haven't made any room reservations yet. Book a meeting room from the Booking Calendar."}
              </p>
              <Button
                variant="cyan"
                size="sm"
                icon={CalendarDays}
                onClick={() => navigate('/visits/calendar')}
                className="mt-2"
              >
                Book a Room Now
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {renderBookingTable(myBookings, true)}

              {/* Pagination */}
              {myBookingsTotalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => fetchMyBookings(myBookingsPage - 1)}
                    disabled={myBookingsPage === 0}
                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold text-slate-600">
                    Page {myBookingsPage + 1} of {myBookingsTotalPages}
                  </span>
                  <button
                    onClick={() => fetchMyBookings(myBookingsPage + 1)}
                    disabled={myBookingsPage >= myBookingsTotalPages - 1}
                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ALL BOOKINGS TAB (Admin/Secretary)                                        */}
      {/* ========================================================================= */}
      {activeTab === 'allBookings' && (isAdmin || isSecretary) && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by room, title, or booker..."
                value={allBookingsSearch}
                onChange={(e) => setAllBookingsSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchAllBookings(0)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#00adef] focus:outline-none transition-all"
              />
            </div>
            <select
              value={allBookingsStatusFilter}
              onChange={(e) => setAllBookingsStatusFilter(e.target.value)}
              className="text-xs font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none"
            >
              <option value="">All Statuses</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="COMPLETED">Completed</option>
              <option value="NO_SHOW">No Show</option>
            </select>
            <Button size="sm" variant="ghost" onClick={() => fetchAllBookings(0)} icon={Search} className="shrink-0">
              Search
            </Button>
          </div>

          {isLoadingAllBookings ? (
            <div className="bg-white p-16 rounded-3xl border border-dashed border-slate-200 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-10 h-10 border-2 border-[#00adef] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400 font-medium">Loading all bookings...</p>
              </div>
            </div>
          ) : allBookings.length === 0 ? (
            <div className="bg-white p-16 rounded-3xl border border-dashed border-slate-300 text-center space-y-3">
              <CalendarDays className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-heading font-bold text-base text-slate-800">No Bookings Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {allBookingsSearch || allBookingsStatusFilter
                  ? 'No bookings match your search criteria.'
                  : 'No room bookings have been submitted yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {renderBookingTable(allBookings, isAdmin || isSecretary)}

              {allBookingsTotalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => fetchAllBookings(allBookingsPage - 1)}
                    disabled={allBookingsPage === 0}
                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold text-slate-600">
                    Page {allBookingsPage + 1} of {allBookingsTotalPages}
                  </span>
                  <button
                    onClick={() => fetchAllBookings(allBookingsPage + 1)}
                    disabled={allBookingsPage >= allBookingsTotalPages - 1}
                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cancel Reservation Confirmation Modal */}
      {cancellingBookingId && (
        <Modal
          isOpen={!!cancellingBookingId}
          onClose={() => !isCancellingBooking && setCancellingBookingId(null)}
          title="Cancel Reservation"
        >
          <div className="p-6 space-y-4 text-left">
            <div className="flex items-start gap-3 p-4 bg-red-50 text-red-800 border border-red-200 rounded-2xl">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-sm text-red-900">Cancel this reservation?</p>
                <p className="text-red-700 leading-relaxed">
                  The meeting room slot will be released and made available for other bookings. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => setCancellingBookingId(null)} disabled={isCancellingBooking}>
                Keep Reservation
              </Button>
              <Button
                variant="danger"
                onClick={() => handleCancelBooking(cancellingBookingId)}
                disabled={isCancellingBooking}
                icon={XCircle}
              >
                {isCancellingBooking ? 'Cancelling...' : 'Cancel Reservation'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* ROOMS TAB                                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'rooms' && (<>

      {/* ========================================================================= */}
      {/* 2. STATS OVERVIEW CARDS                                                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Rooms</p>
            <p className="font-heading font-black text-2xl text-slate-800 mt-0.5">{activeRooms.length}</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-sky-50 text-[#00adef] flex items-center justify-center border border-sky-100">
            <DoorOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assigned Custodians</p>
            <p className="font-heading font-black text-2xl text-slate-800 mt-0.5">
              {activeRooms.filter((r) => r.assignedUserName || r.contactEmail).length}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-[#e38524] flex items-center justify-center border border-amber-100">
            <User className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Seating Capacity</p>
            <p className="font-heading font-black text-2xl text-slate-800 mt-0.5">
              {activeRooms.reduce((acc, curr) => acc + (curr.capacity || 0), 0)} Seats
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SEARCH & FILTER BAR                                                    */}
      {/* ========================================================================= */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search room name, floor, or person in charge..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#00adef] focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Capacity:</span>
            <select
              value={capacityFilter}
              onChange={(e) => setCapacityFilter(e.target.value)}
              className="text-xs font-semibold border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Capacities</option>
              <option value="SMALL">Small (1 - 10 Seats)</option>
              <option value="MEDIUM">Medium (11 - 18 Seats)</option>
              <option value="LARGE">Large (19+ Seats)</option>
            </select>
          </div>

          {departments && departments.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span>Department:</span>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="text-xs font-semibold border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:outline-none max-w-[160px] truncate"
              >
                <option value="ALL">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id || d.name} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MEETING ROOMS DIRECTORY CARDS WITH PERSON IN CHARGE PROMINENTLY SHOWN   */}
      {/* ========================================================================= */}
      {filteredRooms.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-dashed border-slate-300 text-center space-y-3">
          <DoorOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-heading font-bold text-base text-slate-800">No Meeting Rooms Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `No meeting rooms match your search query "${searchQuery}".`
              : 'No meeting rooms registered yet. Click below to add your first boardroom.'}
          </p>
          {(isAdmin || isSecretary) && (
            <Button
              variant="orange"
              size="sm"
              onClick={handleOpenCreateModal}
              icon={Plus}
              className="mt-2"
            >
              Register New Meeting Room
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => {
            const hasCustodian = !!(room.assignedUserName || room.contactEmail);
            return (
              <div
                key={room.id}
                className="bg-white rounded-3xl p-4 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
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

                    {/* Department Badge */}
                    {room.department && (
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-[#e38524]" />
                          <span>{room.department}</span>
                        </span>
                      </div>
                    )}

                    {/* Capacity Badge */}
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-xs text-slate-800 text-[11px] font-bold shadow-xs flex items-center gap-1">
                        <Users className="w-3 h-3 text-[#00adef]" />
                        <span>{room.capacity || 12} Seats</span>
                      </span>
                    </div>
                  </div>

                  {/* Room Name & Floor Location */}
                  <div className="space-y-1">
                    <h3 className="font-heading font-black text-lg text-slate-900 leading-snug group-hover:text-[#00adef] transition-colors">
                      {room.name}
                    </h3>
                    {room.floorLocation && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                        <MapPin className="w-3 h-3 text-[#e38524] shrink-0" />
                        <span>{room.floorLocation}</span>
                      </p>
                    )}
                  </div>

                  {/* PERSON IN CHARGE OF THAT ROOM (PROMINENT SECTION) */}
                  <div className="mt-3.5 p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                        <Shield className="w-3 h-3 text-amber-600" />
                        <span>Person in Charge</span>
                      </span>
                      {hasCustodian ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                          Assigned
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 text-[9px] font-medium">
                          Unassigned
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <User className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className={`truncate ${!room.assignedUserName ? 'text-slate-400 font-normal italic' : ''}`}>
                          {room.assignedUserName || 'Not assigned yet'}
                        </span>
                      </div>
                      {room.contactEmail && (
                        <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-600 truncate">
                          <Mail className="w-3 h-3 text-[#00adef] shrink-0" />
                          <span className="truncate">{room.contactEmail}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Room Description / Facilities */}
                  {room.description && (
                    <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">
                      {room.description}
                    </p>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Button
                    variant="outline-cyan"
                    size="sm"
                    onClick={() => navigate(`/visits/calendar?room=${encodeURIComponent(room.name)}`)}
                    icon={CalendarDays}
                    className="text-xs font-bold"
                  >
                    View Schedule
                  </Button>

                  <div className="flex items-center gap-1.5">
                    {(isAdmin || isSecretary) && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(room)}
                        className="p-2 rounded-xl text-slate-500 hover:text-[#00adef] hover:bg-sky-50 transition-colors cursor-pointer border border-transparent hover:border-sky-200"
                        title="Edit Meeting Room & Person in Charge"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setRoomToDelete(room)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                        title="Delete Meeting Room"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. ROOM REGISTRATION & EDIT MODAL (WITH PERSON IN CHARGE PRIORITY)         */}
      {/* ========================================================================= */}
      {isRoomModalOpen && (
        <Modal
          isOpen={isRoomModalOpen}
          onClose={() => !isSavingRoom && setIsRoomModalOpen(false)}
          title={editingRoomId ? 'Edit Meeting Room Details' : 'Register New Meeting Room'}
          maxWidth="max-w-3xl"
        >
          <form onSubmit={handleSaveRoom} className="space-y-4 text-left">
            <div className="flex items-center gap-2 p-3 bg-blue-50 text-[#00adef] border border-blue-200 rounded-2xl text-xs font-medium">
              <DoorOpen className="w-4 h-4 shrink-0" />
              <span>
                {editingRoomId
                  ? 'Update meeting room parameters, specifications, and designated in-charge contact.'
                  : 'Register an executive boardroom or collaborative facility for bank meetings.'}
              </span>
            </div>

            {/* Room Name & Floor Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Room Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Executive Boardroom"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#00adef] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Floor Location / Wing
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5th Floor - Executive Wing"
                  value={formData.floorLocation}
                  onChange={(e) => setFormData({ ...formData, floorLocation: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#00adef] focus:outline-none"
                />
              </div>
            </div>

            {/* Managing Department & Seating Capacity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Managing Department <span className="text-red-500">*</span>
                </label>
                {isSecretary ? (
                  <div className="w-full px-3.5 py-2 text-xs rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 font-bold flex items-center justify-between h-[38px]">
                    <span className="truncate">{userDept || 'Assigned Department'}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Department Scoped</span>
                    </span>
                  </div>
                ) : (
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                  >
                    <option value="">-- Select Managing Department --</option>
                    {departments.map((d) => (
                      <option key={d.id || d.name} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Seating Capacity (Seats) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 18"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* =================================================================== */}
            {/* PERSON IN CHARGE OF THAT ROOM (FETCHED FROM USERS)                  */}
            {/* =================================================================== */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-xs text-amber-900">
                  <Shield className="w-4 h-4 text-amber-600" />
                  <span>Person in Charge of Room (Custodian)</span>
                </div>
                <span className="text-[10px] text-amber-700 font-medium">Designated Staff Contact</span>
              </div>

              {/* Users Dropdown */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Select Staff Member <span className="text-slate-400 font-normal">(Fetched from bank users)</span>
                </label>
                <select
                  value={formData.assignedUserId || ''}
                  onChange={(e) => {
                    const selId = e.target.value;
                    if (!selId) {
                      setFormData((prev) => ({
                        ...prev,
                        assignedUserId: null,
                        assignedUserName: '',
                        contactEmail: '',
                      }));
                      return;
                    }
                    const selected = usersList.find((u) => String(u.id) === String(selId));
                    if (selected) {
                      const name = selected.fullName || selected.username;
                      setFormData((prev) => ({
                        ...prev,
                        assignedUserId: selected.id,
                        assignedUserName: name,
                        contactEmail: selected.email || '',
                      }));
                    }
                  }}
                  disabled={isLoadingUsers}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-amber-200 bg-white focus:outline-none focus:border-amber-400 font-medium text-slate-800"
                >
                  <option value="">-- Select Person in Charge (or leave unassigned) --</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName ? `${u.fullName} (${u.username})` : u.username} {u.department ? `• ${u.department}` : ''} — {u.email}
                    </option>
                  ))}
                </select>
                {isLoadingUsers && (
                  <p className="text-[10px] text-slate-400 mt-1">Loading users...</p>
                )}
              </div>

              {/* Custodian Name and Email Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    In-Charge Staff Member / Custodian Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sister Aster (Executive Secretary)"
                    value={formData.assignedUserName}
                    onChange={(e) => setFormData({ ...formData, assignedUserName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-amber-200 bg-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Contact Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. aster.k@coopbankoromia.com.et"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-amber-200 bg-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-100/60 text-[11px] text-amber-900 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  The person in charge oversees room access, receives automated reservation &amp; cancellation notices, and is authorized to release or cancel bookings for this facility.
                </span>
              </div>
            </div>

            {/* Room Cover Photo (URL or Direct Upload) */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <label className="block text-xs font-bold text-slate-700">
                Room Cover Photo
              </label>

              <div className="flex items-center gap-3">
                {imagePreviewUrl || formData.imageUrl ? (
                  <img
                    src={imagePreviewUrl || resolveImageUrl(formData.imageUrl)}
                    alt="Preview"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/rooms/executive-boardroom.jpg';
                    }}
                    className="w-16 h-12 object-cover rounded-xl border border-slate-300 shadow-xs"
                  />
                ) : (
                  <div className="w-16 h-12 rounded-xl bg-slate-200 border border-dashed border-slate-300 flex items-center justify-center text-slate-400">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                )}

                <div className="flex-1 space-y-1.5">
                  <input
                    type="text"
                    placeholder="Paste Image URL (or upload file below)"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none"
                  />
                  {roomImageFile && (
                    <p className="text-[10px] text-emerald-600 font-bold truncate">
                      ✓ Ready to upload: {roomImageFile.name}
                    </p>
                  )}
                </div>

                <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-black text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs transition-all shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{roomImageFile ? 'Change Photo' : 'Upload Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFileChange}
                  />
                </label>
              </div>
            </div>

            {/* Description & Equipment */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description & Equipment / Amenities
              </label>
              <textarea
                rows={3}
                placeholder="e.g. 4K presentation screen, video conference bar, 18 ergonomic leather seats..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setIsRoomModalOpen(false)}
                disabled={isSavingRoom}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="orange"
                disabled={isSavingRoom}
                icon={editingRoomId ? CheckCircle2 : Plus}
              >
                {isSavingRoom
                  ? 'Saving Room...'
                  : editingRoomId
                  ? 'Update Meeting Room'
                  : 'Register Meeting Room'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 6. ROOM DELETION CONFIRMATION MODAL                                       */}
      {/* ========================================================================= */}
      {roomToDelete && (
        <Modal
          isOpen={!!roomToDelete}
          onClose={() => !isDeleting && setRoomToDelete(null)}
          title="Delete Meeting Room"
        >
          <div className="p-6 space-y-4 text-left">
            <div className="flex items-start gap-3 p-4 bg-red-50 text-red-800 border border-red-200 rounded-2xl">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-sm text-red-900">
                  Permanently delete &quot;{roomToDelete.name}&quot;?
                </p>
                <p className="text-red-700 leading-relaxed">
                  This action will remove the meeting room from active master data and directory listings.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                onClick={() => setRoomToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                icon={Trash2}
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>)}
    </div>
  );
};

export default BookingManagementPage;
