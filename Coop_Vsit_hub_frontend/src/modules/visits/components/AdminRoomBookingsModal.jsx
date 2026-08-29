import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  Calendar,
  Clock,
  User,
  Search,
  Trash2,
  AlertCircle,
  Filter,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import visitApi from '../api/visitApi';
import soundPlayer from '@/core/utils/soundPlayer';
import Button from '@/shared/components/ui/Button';
import Badge from '@/shared/components/ui/Badge';

export const AdminRoomBookingsModal = ({ isOpen, onClose }) => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('ALL');
  const [cancelingId, setCancelingId] = useState(null);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const data = await visitApi.getAdminRoomBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load admin room bookings:', err);
      toast.error('Failed to retrieve room bookings roster.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBookings();
    }
  }, [isOpen]);

  const handleCancelBooking = async (visitId, roomName, visitCode) => {
    if (!window.confirm(`Are you sure you want to cancel and release reservation '${visitCode}' for '${roomName}'?`)) {
      return;
    }
    setCancelingId(visitId);
    try {
      await visitApi.deleteVisit(visitId);
      soundPlayer.playNotificationChime();
      toast.success(`Booking ${visitCode} for ${roomName} successfully released.`);
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to release room booking.');
    } finally {
      setCancelingId(null);
    }
  };

  if (!isOpen) return null;

  // Extract unique room names for filter dropdown
  const roomNames = ['ALL', ...new Set(bookings.map((b) => b.roomName).filter(Boolean))];

  // Filtered roster
  const filteredBookings = bookings.filter((b) => {
    const matchRoom = selectedRoom === 'ALL' || b.roomName === selectedRoom;
    const q = search.toLowerCase().trim();
    const matchSearch =
      !q ||
      b.roomName?.toLowerCase().includes(q) ||
      b.visitCode?.toLowerCase().includes(q) ||
      b.title?.toLowerCase().includes(q) ||
      b.bookedByName?.toLowerCase().includes(q) ||
      b.bookedByEmail?.toLowerCase().includes(q) ||
      b.bookedByDepartment?.toLowerCase().includes(q);
    return matchRoom && matchSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn text-left">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-black text-xl text-slate-900 tracking-tight">
                  Super Admin • Meeting Rooms Audit Roster
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#00adef] text-xs font-bold uppercase tracking-wider">
                  Live Reservations
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete overview of who booked each boardroom, staff contacts, scheduled hours, and agendas.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by staff, email, room, or visit code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#00adef] focus:outline-none transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="text-xs font-medium border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none"
              >
                {roomNames.map((r) => (
                  <option key={r} value={r}>
                    {r === 'ALL' ? 'All Meeting Rooms' : r}
                  </option>
                ))}
              </select>
            </div>

            <Button variant="ghost" size="sm" onClick={fetchBookings}>
              Refresh
            </Button>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm font-medium">Loading room reservations...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-50 text-[#00adef] flex items-center justify-center">
                <Building2 className="w-7 h-7" />
              </div>
              <h3 className="font-heading font-bold text-base text-slate-800">No Room Bookings Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No active or scheduled room reservations match your selected criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                    <th className="py-3 px-4">Room & Location</th>
                    <th className="py-3 px-4">Date & Time Range</th>
                    <th className="py-3 px-4">Booked By (Staff Member)</th>
                    <th className="py-3 px-4">Meeting Title & Guest</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBookings.map((b) => (
                    <tr key={b.visitId} className="hover:bg-blue-50/30 transition-colors">
                      {/* Room */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#00adef] flex items-center justify-center font-bold shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-xs">{b.roomName}</p>
                            <span className="text-[10px] text-slate-400 font-mono">{b.visitCode}</span>
                          </div>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-medium text-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{b.date || 'Scheduled'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#00adef]">
                            <Clock className="w-3 h-3 text-[#00adef]" />
                            <span>{b.timeRange || 'Full Day'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Staff Requester */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-bold text-slate-900">
                            <User className="w-3.5 h-3.5 text-amber-500" />
                            <span>{b.bookedByName || 'Bank Staff'}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono">{b.bookedByEmail}</p>
                          <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-medium">
                            {b.bookedByDepartment || 'CoopBank Staff'}
                          </span>
                        </div>
                      </td>

                      {/* Title & Purpose */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-semibold text-slate-800 line-clamp-1">{b.title}</p>
                        {b.guestDisplayName && (
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Users className="w-3 h-3 text-slate-400" />
                            <span className="line-clamp-1">{b.guestDisplayName}</span>
                          </p>
                        )}
                        {b.purpose && (
                          <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 italic">
                            "{b.purpose}"
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <Badge variant="success">CONFIRMED</Badge>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleCancelBooking(b.visitId, b.roomName, b.visitCode)}
                          disabled={cancelingId === b.visitId}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Release Room Booking"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Cancel</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
          <p>
            Showing <strong>{filteredBookings.length}</strong> of <strong>{bookings.length}</strong> total room reservations.
          </p>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close Window
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminRoomBookingsModal;
