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
} from 'lucide-react';
import useStaffTrackingStore from '../store/staffTrackingStore';
import useAuthStore from '@/modules/auth/store/authStore';
import Button from '@/shared/components/ui/Button';
import OrganizationProfileDrawer from '@/modules/organizations/components/OrganizationProfileDrawer';
import GuestProfileDrawer from '@/modules/guests/components/GuestProfileDrawer';
import useOrganizationStore from '@/modules/organizations/store/organizationStore';
import useGuestStore from '@/modules/guests/store/guestStore';

export const StaffTrackerPage = () => {
  const { user } = useAuthStore();
  const {
    overview,
    trackedVisits,
    trackedOrganizations,
    trackedGuests,
    isLoading,
    fetchOverview,
  } = useStaffTrackingStore();

  const { openProfileDrawer: openOrgDrawer } = useOrganizationStore();
  const { openProfileDrawer: openGuestDrawer } = useGuestStore();

  const [activeTab, setActiveTab] = useState('visits'); // 'visits' | 'organizations' | 'guests'
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredOrgs = trackedOrganizations.filter((o) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      o.name?.toLowerCase().includes(term) ||
      o.category?.toLowerCase().includes(term) ||
      o.industrySector?.toLowerCase().includes(term)
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
            variant="ghost"
            size="sm"
            onClick={fetchOverview}
            disabled={isLoading}
            className="border border-slate-200 hover:bg-slate-50 text-slate-700"
          >
            <RotateCcw className={`w-4 h-4 mr-1.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
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

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
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

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
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

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <DoorOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">
              {overview?.activeReservationsCount ?? 0}
            </div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Room Bookings
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('visits')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'visits'
                ? 'bg-white text-[#00adef] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Visits ({trackedVisits.length})
          </button>
          <button
            onClick={() => setActiveTab('organizations')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'organizations'
                ? 'bg-white text-[#00adef] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Organizations ({trackedOrganizations.length})
          </button>
          <button
            onClick={() => setActiveTab('guests')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
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

      {/* Tab 1: Matched Visits */}
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
                  <th className="py-3.5 px-4">Feedback Rating</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVisits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400">
                      No tracked visits matching your room bookings found.
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
                      <td className="py-3.5 px-4">
                        {v.feedbackSubmitted ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-xs">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{v.guestRating ? Number(v.guestRating).toFixed(1) : '5.0'} / 5.0</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium text-xs">
                            In Progress
                          </span>
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

      {/* Tab 2: Matched Organizations */}
      {activeTab === 'organizations' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrgs.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-200/80 text-slate-400">
              No partner organizations linked to your meetings yet.
            </div>
          ) : (
            filteredOrgs.map((org) => (
              <div
                key={org.id}
                onClick={() => openOrgDrawer(org)}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#00adef] hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded-md bg-sky-50 text-[#00adef] border border-sky-100 text-[10px] font-bold uppercase mb-1.5">
                      {org.category || 'Partner'}
                    </span>
                    <h3 className="font-bold text-slate-900 group-hover:text-[#00adef] transition-colors text-sm">
                      {org.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{org.starRating ? Number(org.starRating).toFixed(1) : '5.0'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Total Delegations: <strong className="text-slate-800">{org.totalVisits || 1}</strong></span>
                  <span className="text-[#00adef] font-semibold flex items-center gap-1">
                    View Profile <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Matched Individual Guests */}
      {activeTab === 'guests' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGuests.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-200/80 text-slate-400">
              No individual guests linked to your meetings yet.
            </div>
          ) : (
            filteredGuests.map((guest) => (
              <div
                key={guest.id}
                onClick={() => openGuestDrawer(guest)}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-[#00adef] hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded-md bg-amber-50 text-[#e38524] border border-amber-100 text-[10px] font-bold uppercase mb-1.5">
                      {guest.vipTier || 'Guest'}
                    </span>
                    <h3 className="font-bold text-slate-900 group-hover:text-[#00adef] transition-colors text-sm">
                      {guest.fullName || `${guest.firstName} ${guest.lastName}`}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{guest.guestTitle || guest.organizationAffiliation || 'Dignitary'}</p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{guest.starRating ? Number(guest.starRating).toFixed(1) : '5.0'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>{guest.phoneNumber || guest.email || 'Contact on file'}</span>
                  <span className="text-[#00adef] font-semibold flex items-center gap-1">
                    View Guest <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reusable Profile Drawers */}
      <OrganizationProfileDrawer />
      <GuestProfileDrawer />
    </div>
  );
};

export default StaffTrackerPage;
