import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  DoorOpen,
  Clock,
  User,
  Building2,
  Search,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  Eye,
  Trash2,
  Plus,
  Mail,
  ShieldCheck,
  Tag,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import roomBookingApi from '@/modules/booking/api/roomBookingApi';
import useAuthStore from '@/modules/auth/store/authStore';
import useMasterDataStore from '@/modules/master_data/store/masterDataStore';
import Button from '@/shared/components/ui/Button';
import Badge from '@/shared/components/ui/Badge';
import Spinner from '@/shared/components/ui/Spinner';
import Modal from '@/shared/components/ui/Modal';
import Pagination from '@/shared/components/ui/Pagination';
import soundPlayer from '@/core/utils/soundPlayer';

export const RoomBookingsTable = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuthStore();
  const { meetingRooms, fetchAllMasterData } = useMasterDataStore();

  const isAdmin = hasRole('ROLE_ADMIN');
  const isSecretary = hasRole('ROLE_SECRETARY');
  const isRelationshipManager = hasRole('ROLE_RELATIONSHIP_MANAGER');

  // Allow switching between personal bookings and departmental/all bookings
  const [scope, setScope] = useState('MY'); // 'MY' | 'ALL'
  const [bookings, setBookings] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roomFilter, setRoomFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [inspectingBooking, setInspectingBooking] = useState(null);

  useEffect(() => {
    fetchAllMasterData();
  }, [fetchAllMasterData]);

  // Fetch bookings based on active scope
  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        search: searchTerm.trim() || undefined,
        roomName: roomFilter || undefined,
        status: statusFilter || undefined,
        page: currentPage,
        size: pageSize,
        sortBy: 'scheduledStartTime',
        sortDirection: 'desc',
      };

      let data;
      if (scope === 'MY') {
        data = await roomBookingApi.getMyBookings(params);
      } else {
        data = await roomBookingApi.getBookings(params);
      }

      setBookings(data?.content || []);
      setTotalElements(data?.totalElements || 0);
      setTotalPages(data?.totalPages || 1);
    } catch (err) {
      console.error('Failed to load room bookings:', err);
      toast.error('Failed to retrieve room reservations.');
    } finally {
      setIsLoading(false);
    }
  }, [scope, searchTerm, roomFilter, statusFilter, currentPage, pageSize]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Reset page when search or filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [scope, searchTerm, roomFilter, statusFilter]);

  // Check if current user is owner or has elevated cancellation permission
  const canCancelBooking = (b) => {
    if (!b || b.status === 'CANCELLED') return false;
    if (isAdmin || isSecretary || isRelationshipManager) return true;
    if (!user) return false;

    const isOwner =
      (b.bookedByUserId && user.id && String(b.bookedByUserId).toLowerCase() === String(user.id).toLowerCase()) ||
      (b.bookedByEmail && user.email && b.bookedByEmail.trim().toLowerCase() === user.email.trim().toLowerCase()) ||
      (b.bookedByUsername && user.username && b.bookedByUsername.trim().toLowerCase() === user.username.trim().toLowerCase()) ||
      (b.bookedByName && user.fullName && b.bookedByName.trim().toLowerCase() === user.fullName.trim().toLowerCase());

    return Boolean(isOwner);
  };

  const isUserOwner = (b) => {
    if (!b || !user) return false;
    return Boolean(
      (b.bookedByUserId && user.id && String(b.bookedByUserId).toLowerCase() === String(user.id).toLowerCase()) ||
      (b.bookedByEmail && user.email && b.bookedByEmail.trim().toLowerCase() === user.email.trim().toLowerCase()) ||
      (b.bookedByUsername && user.username && b.bookedByUsername.trim().toLowerCase() === user.username.trim().toLowerCase())
    );
  };

  // Execute cancellation
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
        `Reservation ${cancellingBooking.bookingCode} for "${cancellingBooking.roomName}" successfully cancelled.`
      );
      setCancellingBooking(null);
      setCancelReason('');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel room reservation.');
    } finally {
      setIsCancelling(false);
    }
  };

  const formatScheduleDateTime = (startIso, endIso) => {
    if (!startIso) return 'Not scheduled';
    const startDate = new Date(startIso);
    const dateStr = startDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const startTimeStr = startDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const endTimeStr = endIso
      ? new Date(endIso).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';
    return { dateStr, timeStr: `${startTimeStr} - ${endTimeStr}` };
  };

  return (
    <div className="space-y-4">
      {/* Scope Switcher & Filter Toolbar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl w-fit">
            <button
              onClick={() => setScope('MY')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                scope === 'MY'
                  ? 'bg-white text-[#00adef] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>My Room Bookings</span>
            </button>

            {(isAdmin || isSecretary || isRelationshipManager) && (
              <button
                onClick={() => setScope('ALL')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  scope === 'ALL'
                    ? 'bg-white text-[#00adef] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>All Department Bookings</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline-cyan"
              size="sm"
              onClick={() => navigate('/visits/calendar')}
              icon={CalendarDays}
            >
              Book a Room on Calendar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchBookings}
              disabled={isLoading}
              icon={RotateCcw}
              title="Refresh roster"
            />
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by code, meeting title, staff, or room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#00adef] focus:outline-none transition-all"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#00adef] focus:outline-none transition-all text-slate-700"
            >
              <option value="">All Boardrooms & Spaces</option>
              {meetingRooms?.map((r) => (
                <option key={r.id || r.name} value={r.name}>
                  {r.name} ({r.capacity || 10} seats)
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#00adef] focus:outline-none transition-all text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="CONFIRMED">Active / Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Spinner size="lg" className="text-[#00adef]" />
            <p className="text-xs font-semibold">Loading room reservations...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-16 px-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-[#00adef] flex items-center justify-center mx-auto">
              <DoorOpen className="w-7 h-7" />
            </div>
            <h3 className="font-heading font-bold text-base text-slate-800">
              No Room Reservations Found
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {scope === 'MY'
                ? "You haven't booked any boardrooms yet. Reserve a room on the interactive calendar to manage it here."
                : 'No bookings match your current filter parameters.'}
            </p>
            <div className="pt-2">
              <Button
                variant="orange"
                size="sm"
                onClick={() => navigate('/visits/calendar')}
                icon={Plus}
              >
                Schedule Room Reservation
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Booking Ref</th>
                  <th className="py-3.5 px-4">Meeting Room</th>
                  <th className="py-3.5 px-4">Meeting Title</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Booked By</th>
                  <th className="py-3.5 px-4">Attendees</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => {
                  const schedule = formatScheduleDateTime(b.scheduledStartTime, b.scheduledEndTime);
                  const isOwner = isUserOwner(b);
                  const canCancel = canCancelBooking(b);
                  const isCancelled = b.status === 'CANCELLED';

                  return (
                    <tr
                      key={b.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCancelled ? 'opacity-60 bg-slate-50/30' : ''
                      }`}
                    >
                      {/* Booking Code */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-[#00adef] border border-sky-200">
                          {b.bookingCode}
                        </span>
                      </td>

                      {/* Room Name */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <DoorOpen className="w-3.5 h-3.5 text-[#00adef] shrink-0" />
                          <span>{b.roomName}</span>
                        </div>
                        {b.hostDepartment && (
                          <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                            {b.hostDepartment}
                          </div>
                        )}
                      </td>

                      {/* Meeting Title & Objective */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <p className="font-bold text-slate-800 truncate" title={b.meetingTitle}>
                          {b.meetingTitle}
                        </p>
                        {b.guestOrganizationName && (
                          <p className="text-[10px] text-emerald-600 font-medium truncate mt-0.5">
                            Org: {b.guestOrganizationName}
                          </p>
                        )}
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <p className="font-semibold text-slate-800">{schedule.dateStr}</p>
                        <p className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-[#00adef]" />
                          <span>{schedule.timeStr}</span>
                        </p>
                      </td>

                      {/* Booked By */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800">
                            {b.bookedByName || 'Staff Member'}
                          </span>
                          {isOwner && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-blue-100 text-[#00adef]">
                              You
                            </span>
                          )}
                        </div>
                        {b.bookedByEmail && (
                          <p className="text-[10px] text-slate-400 truncate max-w-[160px]">
                            {b.bookedByEmail}
                          </p>
                        )}
                      </td>

                      {/* Attendees */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        <span className="inline-flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>{b.expectedAttendees || 1}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isCancelled ? (
                          <Badge variant="danger" size="sm">
                            Cancelled
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm">
                            Confirmed
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectingBooking(b)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                            title="Inspect Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canCancel && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setCancellingBooking(b)}
                              className="px-2.5 py-1 text-[11px] font-bold gap-1 shadow-xs"
                              title="Cancel this reservation"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>Cancel</span>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {bookings.length > 0 && (
          <div className="p-4 border-t border-slate-100">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={pageSize}
              onPageChange={(p) => setCurrentPage(p)}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setCurrentPage(0);
              }}
              itemName="reservations"
            />
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {cancellingBooking && (
        <Modal
          isOpen={true}
          onClose={() => !isCancelling && setCancellingBooking(null)}
          title={`Cancel Reservation • ${cancellingBooking.bookingCode}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-rose-900 text-sm">
                  Release Boardroom Reservation?
                </p>
                <p className="text-[11px] text-rose-700 leading-relaxed">
                  Are you sure you want to cancel this booking? The room will immediately become available for other staff meetings and automated notifications will be dispatched.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex justify-between items-center text-slate-700">
                <span className="text-slate-400 font-medium">Room Name:</span>
                <span className="font-bold text-slate-900">{cancellingBooking.roomName}</span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span className="text-slate-400 font-medium">Meeting Title:</span>
                <span className="font-bold text-slate-900 truncate max-w-50">
                  {cancellingBooking.meetingTitle}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-700">
                <span className="text-slate-400 font-medium">Scheduled Time:</span>
                <span className="font-mono text-slate-900">
                  {formatScheduleDateTime(cancellingBooking.scheduledStartTime, cancellingBooking.scheduledEndTime).dateStr}{' '}
                  (
                  {formatScheduleDateTime(cancellingBooking.scheduledStartTime, cancellingBooking.scheduledEndTime).timeStr}
                  )
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
                placeholder="State the reason for cancellation (e.g., meeting postponed, client rescheduled, room conflict)..."
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
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Inspect Detail Modal */}
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
                <div className="mt-1">
                  <Badge
                    variant={inspectingBooking.status === 'CONFIRMED' ? 'success' : 'danger'}
                    size="sm"
                  >
                    {inspectingBooking.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Date & Time</p>
                <p className="font-bold text-slate-800 mt-0.5">
                  {formatScheduleDateTime(inspectingBooking.scheduledStartTime, inspectingBooking.scheduledEndTime).dateStr}
                </p>
                <p className="font-mono text-slate-600 text-[11px]">
                  {formatScheduleDateTime(inspectingBooking.scheduledStartTime, inspectingBooking.scheduledEndTime).timeStr}
                </p>
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">Expected Headcount</p>
                <p className="font-bold text-slate-800 mt-0.5 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{inspectingBooking.expectedAttendees || 1} Attendees</span>
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 space-y-1.5">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3 text-[#00adef]" />
                <span>Reserved By (Staff Member)</span>
              </p>
              <div className="text-xs">
                <p className="font-bold text-slate-900">{inspectingBooking.bookedByName}</p>
                {inspectingBooking.hostDepartment && (
                  <p className="text-slate-500 text-[11px]">
                    Department: <span className="font-medium text-slate-700">{inspectingBooking.hostDepartment}</span>
                  </p>
                )}
                {inspectingBooking.bookedByEmail && (
                  <p className="text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>{inspectingBooking.bookedByEmail}</span>
                  </p>
                )}
              </div>
            </div>

            {inspectingBooking.meetingAgenda && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Meeting Agenda</p>
                <p className="text-slate-700 italic">{inspectingBooking.meetingAgenda}</p>
              </div>
            )}

            {inspectingBooking.status === 'CANCELLED' && (
              <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200 space-y-1">
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Cancellation Details</span>
                </p>
                <p className="text-xs text-rose-900 font-medium">
                  {inspectingBooking.cancellationReason || 'No reason specified'}
                </p>
                {inspectingBooking.cancelledByName && (
                  <p className="text-[10px] text-rose-600">
                    Cancelled by: <span className="font-bold">{inspectingBooking.cancelledByName}</span>
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              {canCancelBooking(inspectingBooking) && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    const target = inspectingBooking;
                    setInspectingBooking(null);
                    setCancellingBooking(target);
                  }}
                  icon={Trash2}
                >
                  Cancel Reservation
                </Button>
              )}
              <div className="ml-auto">
                <Button variant="ghost" size="sm" onClick={() => setInspectingBooking(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default RoomBookingsTable;
