import React from 'react';
import {
  MoreVertical,
  Eye,
  CheckCircle2,
  XCircle,
  LogIn,
  LogOut,
  Trash2,
  MapPin,
  Calendar,
  Building2,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import useVisitStore from '../store/visitStore';
import useAuthStore from '@/modules/auth/store/authStore';
import Badge from '@/shared/components/ui/Badge';
import Spinner from '@/shared/components/ui/Spinner';

export const VisitTable = () => {
  const {
    visits,
    totalElements,
    totalPages,
    currentPage,
    isLoading,
    setPage,
    openDetailDrawer,
    openStatusModal,
    checkIn,
    checkOut,
    deleteVisit,
  } = useVisitStore();

  const { hasRole, hasAnyRole } = useAuthStore();
  const [activeMenuId, setActiveMenuId] = React.useState(null);

  const isApprover = hasAnyRole(['ROLE_APPROVER', 'ROLE_ADMIN', 'ROLE_BUSINESS_SPONSOR']);
  const isSecurity = hasAnyRole(['ROLE_SECURITY_DESK', 'ROLE_ADMIN']);
  const isAdmin = hasRole('ROLE_ADMIN');

  const formatSchedule = (isoString) => {
    if (!isoString) return 'TBD';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden text-left">
      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-bold uppercase text-[10px]">
              <th className="py-3.5 pl-6">Visit Identifier</th>
              <th className="py-3.5 px-4">Title & Guest Category</th>
              <th className="py-3.5 px-4">Lifecycle Status</th>
              <th className="py-3.5 px-4">Priority</th>
              <th className="py-3.5 px-4">Meeting Room & Schedule</th>
              <th className="py-3.5 pr-6 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Spinner size="lg" color="navy" />
                    <p className="text-xs font-bold text-slate-500">Loading visit requests...</p>
                  </div>
                </td>
              </tr>
            ) : visits.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-24 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-8 h-8" />
                  </div>
                  <h4 className="font-heading font-bold text-sm text-[#000000]">No Visits Found</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    Try adjusting your search criteria or create a new visit request.
                  </p>
                </td>
              </tr>
            ) : (
              visits.map((visit) => (
                <tr
                  key={visit.id}
                  onClick={() => openDetailDrawer(visit)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  {/* Visit Code & Department */}
                  <td className="py-4 pl-6 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-[#00adef] group-hover:underline">
                        {visit.visitCode || 'VIS-2026'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[140px]">
                      {visit.requestingDepartment || 'Banking Dept'}
                    </p>
                  </td>

                  {/* Title & Guest Display */}
                  <td className="py-4 px-4 font-bold text-[#000000]">
                    <p className="truncate max-w-[240px] group-hover:text-[#00adef] transition-colors">
                      {visit.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] font-normal text-slate-500">
                      {visit.guestCategory === 'ORGANIZATION' ? (
                        <Building2 className="w-3.5 h-3.5 text-[#00adef] shrink-0" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-[#e38524] shrink-0" />
                      )}
                      <span className="truncate max-w-[200px] font-medium text-slate-700">
                        {visit.guestDisplayName || 'Guest Partner'}
                      </span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-4">
                    <Badge variant={visit.status} pulse={visit.status === 'IN_PROGRESS'}>
                      {visit.status}
                    </Badge>
                  </td>

                  {/* Priority Pill */}
                  <td className="py-4 px-4">
                    <Badge variant={visit.priorityLevel?.toLowerCase() || 'medium'} size="sm">
                      {visit.priorityLevel || 'MEDIUM'}
                    </Badge>
                  </td>

                  {/* Meeting Room & Schedule */}
                  <td className="py-4 px-4 text-slate-600">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-[#000000]">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatSchedule(visit.scheduledStartTime)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                      <MapPin className="w-3 h-3 text-[#e38524] shrink-0" />
                      <span className="truncate max-w-[150px]">
                        {visit.locationRoom || 'Executive Room'}
                      </span>
                    </div>
                  </td>

                  {/* Actions Dropdown */}
                  <td className="py-4 pr-6 text-right relative" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center gap-1.5">
                      {/* Quick View Button */}
                      <button
                        onClick={() => openDetailDrawer(visit)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-[#00adef] hover:bg-sky-50 transition-colors cursor-pointer"
                        title="View Full Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {/* Approver Quick Actions */}
                      {isApprover && visit.status === 'SUBMITTED' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openStatusModal(visit, 'APPROVED')}
                            className="p-1.5 rounded-xl text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title="Approve Visit"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openStatusModal(visit, 'REJECTED')}
                            className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Reject Visit"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* Front Desk Quick Check-In / Check-Out */}
                      {isSecurity && visit.status === 'APPROVED' && (
                        <button
                          onClick={() => checkIn(visit.id)}
                          className="px-2.5 py-1 rounded-xl bg-sky-50 text-[#00adef] hover:bg-[#00adef] hover:text-white font-bold text-[10px] transition-colors cursor-pointer"
                          title="Check-In Guest & Issue Badge"
                        >
                          Check In
                        </button>
                      )}

                      {isSecurity && visit.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => checkOut(visit.id)}
                          className="px-2.5 py-1 rounded-xl bg-orange-50 text-[#e38524] hover:bg-[#e38524] hover:text-white font-bold text-[10px] transition-colors cursor-pointer"
                          title="Check-Out Guest & Send Survey"
                        >
                          Check Out
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing page <span className="font-bold text-[#000000]">{currentPage + 1}</span> of{' '}
          <span className="font-bold text-[#000000]">{totalPages || 1}</span>
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(currentPage - 1)}
            disabled={currentPage === 0}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage(currentPage + 1)}
            disabled={currentPage >= totalPages - 1}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisitTable;
