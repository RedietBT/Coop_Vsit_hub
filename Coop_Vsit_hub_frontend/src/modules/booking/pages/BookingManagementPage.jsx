import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
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

  const [bookings, setBookings] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(12);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Cancel Modal State
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Detail Modal State
  const [inspectingBooking, setInspectingBooking] = useState(null);

  const isAdmin = hasRole('ROLE_ADMIN');

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await roomBookingApi.getBookings({
        search: search.trim() || undefined,
        roomName: selectedRoom || undefined,
        status: selectedStatus || undefined,
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
      setIsLoading(false);
    }
  }, [search, selectedRoom, selectedStatus, currentPage, pageSize]);

  useEffect(() => {
    fetchAllMasterData();
  }, [fetchAllMasterData]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedRoom('');
    setSelectedStatus('');
    setCurrentPage(0);
  };

  const handleCancelConfirm = async () => {
    if (!cancellingBooking) return;
    setIsCancelling(true);
    try {
      await roomBookingApi.cancelBooking(cancellingBooking.id);
      toast.success(`Booking ${cancellingBooking.bookingCode} cancelled successfully.`);
      setCancellingBooking(null);
      fetchBookings();
    } catch (e) {
      toast.error('Failed to cancel room booking.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
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
                {totalElements} Reservations
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Administrative directory of meeting rooms and executive lounges booked across CoopBank HQ.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchBookings}
            disabled={isLoading}
            icon={RotateCcw}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search reference, meeting title, staff name, or organization..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(0);
              }}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-[#00adef] transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Room Filter */}
          <select
            value={selectedRoom}
            onChange={(e) => {
              setSelectedRoom(e.target.value);
              setCurrentPage(0);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none text-slate-700"
          >
            <option value="">All Meeting Rooms</option>
            {meetingRooms.map((r) => (
              <option key={r.id || r.name} value={r.name}>
                {r.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(0);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          {(search || selectedRoom || selectedStatus) && (
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-medium flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Bookings Table */}
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
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Spinner size="lg" className="mx-auto text-[#00adef] mb-3" />
                    <p className="font-medium text-xs">Loading room reservations...</p>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <DoorOpen className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                    <p className="font-bold text-sm text-slate-700">No room bookings found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      No matching reservations found for current filter selection.
                    </p>
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
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => setInspectingBooking(booking)}
                    >
                      {/* Booking Reference */}
                      <td className="py-3.5 px-5">
                        <span className="font-mono font-bold text-[#00adef] text-xs">
                          {booking.bookingCode}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {booking.createdAt
                            ? new Date(booking.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : ''}
                        </p>
                      </td>

                      {/* Room & Meeting */}
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

                      {/* Schedule */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{sDate}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>
                            {sTime} - {eTime}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold">
                            {booking.expectedAttendees || 1} Pax
                          </span>
                        </div>
                      </td>

                      {/* Booked By (AD / User) */}
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

                      {/* Affiliated Party */}
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

                      {/* Status */}
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

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setInspectingBooking(booking)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                            title="View Full Booking Details"
                          >
                            <Info className="w-4 h-4" />
                          </button>

                          {canCancel && (
                            <button
                              onClick={() => setCancellingBooking(booking)}
                              className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page <span className="font-bold text-slate-800">{currentPage + 1}</span> of{' '}
              <span className="font-bold text-slate-800">{totalPages}</span> ({totalElements} total bookings)
            </span>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0 || isLoading}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1 || isLoading}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

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

            {/* Agenda Notes */}
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
              Cancelling will instantly release the room slot on the calendar for other staff members.
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
