import React, { useState, useEffect, useRef } from 'react';
import {
  MoreVertical,
  ChevronDown,
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
  Edit3,
} from 'lucide-react';
import useVisitStore from '../store/visitStore';
import useAuthStore from '@/modules/auth/store/authStore';
import EditVisitorModal from './EditVisitorModal';
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
    fetchVisits,
    openDetailDrawer,
    openStatusModal,
    checkIn,
    checkOut,
    deleteVisit,
  } = useVisitStore();

  const { hasRole, hasAnyRole } = useAuthStore();
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [editingVisitor, setEditingVisitor] = useState(null);
  const dropdownRef = useRef(null);

  const isApprover = hasAnyRole(['ROLE_APPROVER', 'ROLE_ADMIN', 'ROLE_BUSINESS_SPONSOR']);
  const isSecurity = hasAnyRole(['ROLE_SECURITY_DESK', 'ROLE_ADMIN']);
  const isAdmin = hasRole('ROLE_ADMIN');

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const toggleDropdown = (id, e) => {
    e.stopPropagation();
    setOpenDropdownId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden text-left">
      {/* Table Content */}
      <div className="overflow-x-auto min-h-[300px]">
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
                  {/* Visit Code */}
                  <td className="py-4 pl-6 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-[#00adef] group-hover:underline">
                        {visit.visitCode || 'VIS-2026'}
                      </span>
                    </div>
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
                        {visit.locationRoom || '—'}
                      </span>
                    </div>
                  </td>

                  {/* Actions Dropdown Button */}
                  <td
                    className="py-4 pr-6 text-right relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative inline-block text-left" ref={openDropdownId === visit.id ? dropdownRef : null}>
                      <button
                        type="button"
                        onClick={(e) => toggleDropdown(visit.id, e)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          openDropdownId === visit.id
                            ? 'bg-[#00adef] text-white border-[#00adef] shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-xs'
                        }`}
                      >
                        <span>Actions</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          openDropdownId === visit.id ? 'rotate-180 text-white' : 'text-slate-400'
                        }`} />
                      </button>

                      {/* Dropdown Menu Popover */}
                      {openDropdownId === visit.id && (
                        <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-40 animate-fadeIn text-left">
                          {/* 1. View Details */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenDropdownId(null);
                              openDetailDrawer(visit);
                            }}
                            className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#00adef] flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4 text-slate-400" />
                            <span>View Full Details</span>
                          </button>

                          {/* 2. Edit Visitor Demographics */}
                          <button
                            type="button"
                            onClick={() => {
                              setOpenDropdownId(null);
                              setEditingVisitor(visit);
                            }}
                            className="w-full px-3.5 py-2 text-xs font-semibold text-[#e38524] hover:bg-orange-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4 text-[#e38524]" />
                            <span>Edit Visitor Demographics</span>
                          </button>

                          {/* 3. Approver: Approve Visit */}
                          {isApprover && visit.status === 'SUBMITTED' && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdownId(null);
                                openStatusModal(visit, 'APPROVED');
                              }}
                              className="w-full px-3.5 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Approve Visit</span>
                            </button>
                          )}

                          {/* 4. Approver: Reject Visit */}
                          {isApprover && visit.status === 'SUBMITTED' && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdownId(null);
                                openStatusModal(visit, 'REJECTED');
                              }}
                              className="w-full px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <XCircle className="w-4 h-4 text-rose-600" />
                              <span>Reject Visit</span>
                            </button>
                          )}

                          {/* 5. Security Desk: Check-In */}
                          {isSecurity && visit.status === 'APPROVED' && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdownId(null);
                                checkIn(visit.id);
                              }}
                              className="w-full px-3.5 py-2 text-xs font-semibold text-[#00adef] hover:bg-sky-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <LogIn className="w-4 h-4 text-[#00adef]" />
                              <span>Check-In Guest & Badge</span>
                            </button>
                          )}

                          {/* 6. Security Desk: Check-Out */}
                          {isSecurity && visit.status === 'IN_PROGRESS' && (
                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdownId(null);
                                checkOut(visit.id);
                              }}
                              className="w-full px-3.5 py-2 text-xs font-semibold text-[#e38524] hover:bg-orange-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <LogOut className="w-4 h-4 text-[#e38524]" />
                              <span>Check-Out Guest & Survey</span>
                            </button>
                          )}

                          {/* 7. Admin Delete Request */}
                          {(visit.status === 'DRAFT' || visit.status === 'SUBMITTED') && isAdmin && (
                            <div className="pt-1 mt-1 border-t border-slate-100">
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenDropdownId(null);
                                  deleteVisit(visit.id);
                                }}
                                className="w-full px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 text-rose-500" />
                                <span>Delete Visit Request</span>
                              </button>
                            </div>
                          )}
                        </div>
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

      {/* Edit Visitor Demographic Modal */}
      <EditVisitorModal
        isOpen={Boolean(editingVisitor)}
        onClose={() => setEditingVisitor(null)}
        visit={editingVisitor}
        onSaveSuccess={() => fetchVisits()}
      />
    </div>
  );
};

export default VisitTable;
