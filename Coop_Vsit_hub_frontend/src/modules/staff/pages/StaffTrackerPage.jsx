import React, { useEffect, useState } from 'react';
import {
  Users2,
  Building2,
  Calendar,
  DoorOpen,
  Sparkles,
  CheckCircle2,
  Clock,
  Star,
  Search,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  Mail,
  Phone,
  Eye,
  Globe,
  XCircle,
  AlertTriangle,
  Info,
  CalendarDays,
  Check,
  X,
  Plus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useStaffTrackingStore from '../store/staffTrackingStore';
import useAuthStore from '@/modules/auth/store/authStore';
import Button from '@/shared/components/ui/Button';
import OrganizationProfileDrawer from '@/modules/organizations/components/OrganizationProfileDrawer';
import GuestProfileDrawer from '@/modules/guests/components/GuestProfileDrawer';
import useOrganizationStore from '@/modules/organizations/store/organizationStore';
import useGuestStore from '@/modules/guests/store/guestStore';
import Badge from '@/shared/components/ui/Badge';
import Modal from '@/shared/components/ui/Modal';
import DirectorReviewModal from '@/modules/visits/components/DirectorReviewModal';

export const StaffTrackerPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    overview,
    trackedVisits,
    trackedBookings,
    trackedOrganizations,
    trackedGuests,
    isLoading,
    fetchOverview,
    cancelBooking,
  } = useStaffTrackingStore();

  const { openProfileDrawer: openOrgDrawer } = useOrganizationStore();
  const { openProfileDrawer: openGuestDrawer } = useGuestStore();

  const [activeTab, setActiveTab] = useState('visits'); // 'visits' | 'bookings' | 'organizations' | 'guests'
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewModalVisit, setReviewModalVisit] = useState(null);

  // Cancellation modal state for room bookings
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Inspect detail modal state for room bookings
  const [inspectingBooking, setInspectingBooking] = useState(null);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const filteredVisits = trackedVisits.filter((v) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      v.guestDisplayName?.toLowerCase().includes(term) ||
      v.visitCode?.toLowerCase().includes(term) ||
      v.title?.toLowerCase().includes(term) ||
      v.locationRoom?.toLowerCase().includes(term)
    );
  });

  const filteredBookings = (trackedBookings || []).filter((b) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      b.meetingTitle?.toLowerCase().includes(term) ||
      b.roomName?.toLowerCase().includes(term) ||
      b.bookingCode?.toLowerCase().includes(term) ||
      b.hostDepartment?.toLowerCase().includes(term) ||
      b.meetingAgenda?.toLowerCase().includes(term) ||
      b.guestName?.toLowerCase().includes(term) ||
      b.guestOrganizationName?.toLowerCase().includes(term) ||
      b.status?.toLowerCase().includes(term)
    );
  });

  const filteredOrgs = trackedOrganizations.filter((o) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      o.name?.toLowerCase().includes(term) ||
      o.category?.toLowerCase().includes(term) ||
      o.industrySector?.toLowerCase().includes(term) ||
      o.contactPersonName?.toLowerCase().includes(term)
    );
  });

  const filteredGuests = trackedGuests.filter((g) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      g.fullName?.toLowerCase().includes(term) ||
      g.email?.toLowerCase().includes(term) ||
      g.phoneNumber?.toLowerCase().includes(term) ||
      g.organizationAffiliation?.toLowerCase().includes(term)
    );
  });

  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;
    setIsCancelling(true);
    try {
      await cancelBooking(cancellingBooking.id);
      setCancellingBooking(null);
    } catch (err) {
      // toast is already displayed by store
    } finally {
      setIsCancelling(false);
    }
  };

  const formatScheduleWindow = (startTime, endTime) => {
    if (!startTime) return 'N/A';
    try {
      const s = new Date(startTime);
      const dateStr = s.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const startStr = s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (!endTime) return `${dateStr} • ${startStr}`;
      const e = new Date(endTime);
      const endStr = e.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${dateStr} • ${startStr} - ${endStr}`;
    } catch {
      return `${startTime}`;
    }
  };

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#e38524]" />
            <span>Personal Host Tracking Hub</span>
          </div>

          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#000000] tracking-tight">
            My Meetings & Guest Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tracking your hosted visitors, meeting room reservations, and auto-linked guest profiles.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="cyan"
            size="sm"
            onClick={() => navigate('/bookings')}
            className="shadow-xs text-xs"
          >
            <Plus className="w-4 h-4 mr-1" />
            Book a Meeting Room
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchOverview}
            disabled={isLoading}
            className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs"
          >
            <RotateCcw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Tracked Visits */}
        <div
          onClick={() => setActiveTab('visits')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'visits'
              ? 'bg-sky-50/50 border-[#00adef] ring-2 ring-[#00adef]/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#00adef]">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">
                {overview?.totalTrackedVisits ?? trackedVisits.length}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                My Tracked Visits
              </div>
            </div>
          </div>
        </div>

        {/* KPI 2: Room Bookings */}
        <div
          onClick={() => setActiveTab('bookings')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'bookings'
              ? 'bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <DoorOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">
                {overview?.activeReservationsCount ?? trackedBookings.length}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                My Room Bookings
              </div>
            </div>
          </div>
        </div>

        {/* KPI 3: Linked Organizations */}
        <div
          onClick={() => setActiveTab('organizations')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'organizations'
              ? 'bg-amber-50/50 border-[#e38524] ring-2 ring-[#e38524]/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-[#e38524]">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">
                {overview?.totalTrackedOrganizations ?? trackedOrganizations.length}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Linked Organizations
              </div>
            </div>
          </div>
        </div>

        {/* KPI 4: Individual Guests */}
        <div
          onClick={() => setActiveTab('guests')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'guests'
              ? 'bg-indigo-50/50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Users2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900">
                {overview?.totalTrackedGuests ?? trackedGuests.length}
              </div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Individual Guests
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Review Banner */}
      {overview?.averageDirectorRating != null && (
        <div className="bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 p-4 rounded-2xl border border-amber-200/80 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-[#e38524]">
              <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Executive Director Rating: {Number(overview.averageDirectorRating).toFixed(1)} / 5.0</span>
                <span className="text-xs font-normal text-slate-500">
                  ({overview.totalDirectorReviews} reviewed, {overview.pendingDirectorReviewsCount || 0} pending)
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Peer reviews and host performance feedback for your delegation visits.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('visits')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'visits'
                ? 'bg-white text-[#00adef] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Visits ({trackedVisits.length})
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'bookings'
                ? 'bg-white text-[#00adef] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Room Bookings ({trackedBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('organizations')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'organizations'
                ? 'bg-white text-[#00adef] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Organizations ({trackedOrganizations.length})
          </button>
          <button
            onClick={() => setActiveTab('guests')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'guests'
                ? 'bg-white text-[#00adef] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Individual Guests ({trackedGuests.length})
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00adef]/20 focus:border-[#00adef]"
          />
        </div>
      </div>

      {/* Tab 1: Matched Visits Table */}
      {activeTab === 'visits' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Visit & Guest</th>
                  <th className="py-3.5 px-4">Meeting Room</th>
                  <th className="py-3.5 px-4">Scheduled Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Visitor Feedback</th>
                  <th className="py-3.5 px-4">Director Review</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVisits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      <div className="max-w-sm mx-auto space-y-3">
                        <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                        <p className="font-semibold text-slate-600">No delegation visits tracked yet</p>
                        <p className="text-[11px] text-slate-400">
                          If you booked a meeting room, switch to the "My Room Bookings" tab to view all your space reservations.
                        </p>
                        <div className="flex items-center justify-center gap-2 pt-1">
                          <Button
                            variant="cyan"
                            size="xs"
                            onClick={() => setActiveTab('bookings')}
                          >
                            <DoorOpen className="w-3.5 h-3.5 mr-1" />
                            View My Room Bookings ({trackedBookings.length})
                          </Button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredVisits.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{v.guestDisplayName || 'Guest'}</div>
                        <div className="text-[11px] text-slate-500">{v.title}</div>
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono text-slate-600">
                          {v.visitCode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{v.locationRoom || 'Main Reception'}</div>
                        {v.visitorBadgeNumber && (
                          <div className="text-[11px] text-slate-500">Badge: {v.visitorBadgeNumber}</div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {v.scheduledStartTime ? new Date(v.scheduledStartTime).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            v.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : v.status === 'IN_PROGRESS' || v.status === 'CHECKED_IN'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      {/* Visitor Feedback */}
                      <td className="py-3.5 px-4">
                        {v.feedbackSubmitted && v.guestRating ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{Number(v.guestRating).toFixed(1)} / 5.0</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-400 border border-slate-200 font-medium text-[11px]">
                            {v.status === 'COMPLETED' ? 'No Feedback' : 'Pending'}
                          </span>
                        )}
                      </td>
                      {/* Director Review */}
                      <td className="py-3.5 px-4">
                        {v.directorRating ? (
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 font-bold text-xs">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{v.directorRating}.0 / 5.0</span>
                            </div>
                            {v.directorOutcome && (
                              <div className="text-[10px] font-semibold text-slate-500">
                                {v.directorOutcome.replace(/_/g, ' ')}
                              </div>
                            )}
                          </div>
                        ) : v.status === 'COMPLETED' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                              Review Pending
                            </span>
                            <div className="text-[10px] text-slate-400">Host review not done</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        {v.status === 'COMPLETED' ? (
                          <Button
                            variant={v.directorRating ? 'ghost' : 'cyan'}
                            size="sm"
                            onClick={() => setReviewModalVisit(v)}
                            className={v.directorRating ? 'border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs' : 'text-xs'}
                          >
                            <Star className={`w-3.5 h-3.5 mr-1 ${v.directorRating ? 'text-amber-500 fill-amber-400' : 'text-white'}`} />
                            {v.directorRating ? 'Edit Review' : 'Review Visit'}
                          </Button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">In Progress</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: My Room Bookings Table */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Booking Ref & Title</th>
                  <th className="py-3.5 px-4">Meeting Room</th>
                  <th className="py-3.5 px-4">Scheduled Window</th>
                  <th className="py-3.5 px-4">Department & Host</th>
                  <th className="py-3.5 px-4">Booked On</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      <div className="max-w-sm mx-auto space-y-3">
                        <DoorOpen className="w-10 h-10 text-slate-300 mx-auto" />
                        <p className="font-semibold text-slate-600">No meeting room bookings found</p>
                        <p className="text-[11px] text-slate-400">
                          You haven't reserved any meeting spaces yet, or no bookings matched your search query.
                        </p>
                        <Button
                          variant="cyan"
                          size="xs"
                          onClick={() => navigate('/bookings')}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Reserve a Meeting Room Now
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{b.meetingTitle || 'Strategy Meeting'}</div>
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-sky-50 text-[#00adef] border border-sky-100 text-[10px] font-mono font-bold">
                          {b.bookingCode}
                        </span>
                        {b.guestOrganizationName && (
                          <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>{b.guestOrganizationName}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <DoorOpen className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{b.roomName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {b.expectedAttendees ? `${b.expectedAttendees} Attendees` : 'General Attendees'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatScheduleWindow(b.scheduledStartTime, b.scheduledEndTime)}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{b.bookedByName || 'Coop Staff'}</div>
                        <div className="text-[10px] text-slate-400">{b.hostDepartment || 'Staff Hub'}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                        {b.createdAt ? (
                          <div className="space-y-0.5">
                            <div>
                              {new Date(b.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </div>
                            <div className="text-[9px] text-slate-400">
                              {new Date(b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            b.status === 'CONFIRMED'
                              ? 'emerald'
                              : b.status === 'CANCELLED'
                              ? 'rose'
                              : 'slate'
                          }
                          size="xs"
                        >
                          {b.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => setInspectingBooking(b)}
                            className="text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100"
                            title="Inspect Booking Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          {b.status === 'CONFIRMED' && (
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => setCancellingBooking(b)}
                              className="text-rose-600 hover:bg-rose-50 border border-rose-200"
                              title="Cancel Reservation"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Matched Organizations Table */}
      {activeTab === 'organizations' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Organization Name</th>
                  <th className="py-3.5 px-4">Category / Sector</th>
                  <th className="py-3.5 px-4">Relationship Health</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Total Delegations</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrgs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      No partner organizations linked to your meetings yet.
                    </td>
                  </tr>
                ) : (
                  filteredOrgs.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#00adef] border border-sky-100 flex items-center justify-center font-bold text-sm shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 hover:text-[#00adef] cursor-pointer" onClick={() => openOrgDrawer(org)}>
                              {org.name}
                            </div>
                            <div className="text-[11px] text-slate-500">{org.industrySector || 'Corporate Partner'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-sky-50 text-[#00adef] border border-sky-100 text-[10px] font-bold uppercase">
                          {org.category || 'Partner'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1 text-amber-500 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 text-xs">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span>{org.starRating ? Number(org.starRating).toFixed(1) : '5.0'}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            ({org.relationshipScore || 95}/100)
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-medium text-slate-800">{org.contactPersonName || 'Primary Contact'}</div>
                          {org.contactEmail && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{org.contactEmail}</span>
                            </div>
                          )}
                          {org.contactPhone && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{org.contactPhone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {org.totalVisits || 1} Hosted
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => openOrgDrawer(org)}
                          className="text-[#00adef] hover:bg-sky-50 border border-sky-100"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View Profile
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Matched Individual Guests Table */}
      {activeTab === 'guests' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Guest Name & Title</th>
                  <th className="py-3.5 px-4">Organization Affiliation</th>
                  <th className="py-3.5 px-4">VIP Tier</th>
                  <th className="py-3.5 px-4">Contact Info</th>
                  <th className="py-3.5 px-4">Relationship Rating</th>
                  <th className="py-3.5 px-4">Total Visits</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredGuests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      No individual guests linked to your meetings yet.
                    </td>
                  </tr>
                ) : (
                  filteredGuests.map((guest) => (
                    <tr key={guest.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#e38524] border border-amber-100 flex items-center justify-center font-bold text-sm shrink-0">
                            <Users2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 hover:text-[#00adef] cursor-pointer" onClick={() => openGuestDrawer(guest)}>
                              {guest.fullName || `${guest.firstName} ${guest.lastName}`}
                            </div>
                            <div className="text-[11px] text-slate-500">{guest.guestTitle || 'Executive Guest'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {guest.organizationAffiliation || 'Independent Guest'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 text-[#e38524] border border-amber-100 text-[10px] font-bold uppercase">
                          {guest.vipTier || 'Guest'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          {guest.email && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{guest.email}</span>
                            </div>
                          )}
                          {guest.phoneNumber && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{guest.phoneNumber}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1 text-amber-500 font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 text-xs">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span>{guest.starRating ? Number(guest.starRating).toFixed(1) : '5.0'}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            ({guest.relationshipScore || 95}/100)
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {guest.totalVisits || 1} Hosted
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => openGuestDrawer(guest)}
                          className="text-[#00adef] hover:bg-sky-50 border border-sky-100"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1" />
                          View Guest
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect Booking Detail Modal */}
      {inspectingBooking && (
        <Modal
          isOpen={true}
          onClose={() => setInspectingBooking(null)}
          title="Meeting Room Reservation Details"
          maxWidth="max-w-xl"
        >
          <div className="space-y-4 text-left">
            <div className="p-4 bg-sky-50/70 border border-sky-100 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600">Booking Reference</span>
                <div className="text-base font-black font-mono text-slate-900">{inspectingBooking.bookingCode}</div>
              </div>
              <Badge
                variant={
                  inspectingBooking.status === 'CONFIRMED'
                    ? 'emerald'
                    : inspectingBooking.status === 'CANCELLED'
                    ? 'rose'
                    : 'slate'
                }
                size="sm"
              >
                {inspectingBooking.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Meeting Title</span>
                <span className="font-semibold text-slate-900">{inspectingBooking.meetingTitle || 'Strategy Meeting'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Meeting Room</span>
                <span className="font-semibold text-slate-900">{inspectingBooking.roomName}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Schedule Window</span>
                <span className="font-semibold text-slate-900">
                  {formatScheduleWindow(inspectingBooking.scheduledStartTime, inspectingBooking.scheduledEndTime)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Host Department</span>
                <span className="font-semibold text-slate-900">{inspectingBooking.hostDepartment || 'Staff Hub'}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Expected Attendees</span>
                <span className="font-semibold text-slate-900">{inspectingBooking.expectedAttendees || 1} people</span>
              </div>
              {inspectingBooking.guestOrganizationName && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Guest Organization</span>
                  <span className="font-semibold text-slate-900">{inspectingBooking.guestOrganizationName}</span>
                </div>
              )}
              {inspectingBooking.guestName && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Guest Contact</span>
                  <span className="font-semibold text-slate-900">{inspectingBooking.guestName}</span>
                </div>
              )}
              {inspectingBooking.createdAt && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 col-span-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Booked On</span>
                  <span className="font-mono text-slate-700">
                    {new Date(inspectingBooking.createdAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {inspectingBooking.meetingAgenda && (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Agenda & Purpose</span>
                <p className="text-xs text-slate-700 whitespace-pre-wrap">{inspectingBooking.meetingAgenda}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              {inspectingBooking.status === 'CONFIRMED' && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    const toCancel = inspectingBooking;
                    setInspectingBooking(null);
                    setCancellingBooking(toCancel);
                  }}
                  className="text-xs"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Cancel Reservation
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInspectingBooking(null)}
                className="text-xs border border-slate-200"
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Reservation Confirmation Modal */}
      {cancellingBooking && (
        <Modal
          isOpen={true}
          onClose={() => !isCancelling && setCancellingBooking(null)}
          title="Cancel Meeting Room Reservation"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-left">
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-900">
                <p className="font-bold mb-1">Are you sure you want to cancel this booking?</p>
                <p className="text-rose-700">
                  This will release the room slot in <span className="font-semibold">{cancellingBooking.roomName}</span> on{' '}
                  <span className="font-semibold">
                    {formatScheduleWindow(cancellingBooking.scheduledStartTime, cancellingBooking.scheduledEndTime)}
                  </span>
                  . A cancellation notification will be sent to the booker and department room manager.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
              <div><span className="font-bold text-slate-500">Ref:</span> <span className="font-mono text-slate-800">{cancellingBooking.bookingCode}</span></div>
              <div><span className="font-bold text-slate-500">Title:</span> <span className="text-slate-800">{cancellingBooking.meetingTitle || 'Strategy Meeting'}</span></div>
              <div><span className="font-bold text-slate-500">Room:</span> <span className="text-slate-800">{cancellingBooking.roomName}</span></div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCancellingBooking(null)}
                disabled={isCancelling}
                className="text-xs border border-slate-200"
              >
                Keep Booking
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmCancel}
                disabled={isCancelling}
                className="text-xs"
              >
                {isCancelling ? 'Cancelling...' : 'Yes, Cancel Reservation'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reusable Profile Drawers */}
      <OrganizationProfileDrawer />
      <GuestProfileDrawer />

      {/* Director Executive Review Modal */}
      <DirectorReviewModal
        isOpen={!!reviewModalVisit}
        onClose={() => setReviewModalVisit(null)}
        visit={reviewModalVisit}
        onSuccess={fetchOverview}
      />
    </div>
  );
};

export default StaffTrackerPage;
