import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  Building2,
  Eye,
  CalendarPlus,
  Trash2,
  Globe,
  Mail,
  Phone,
  Edit2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useOrganizationStore from '../store/organizationStore';
import useVisitStore from '@/modules/visits/store/visitStore';
import useAuthStore from '@/modules/auth/store/authStore';
import Badge from '@/shared/components/ui/Badge';
import Spinner from '@/shared/components/ui/Spinner';

export const OrganizationTable = () => {
  const navigate = useNavigate();
  const {
    organizations,
    totalElements,
    totalPages,
    currentPage,
    isLoading,
    setPage,
    openProfileDrawer,
    openEditModal,
    deleteOrganization,
  } = useOrganizationStore();

  const { openCreateModal: openVisitModal } = useVisitStore();
  const { hasRole } = useAuthStore();
  const isAdmin = hasRole('ROLE_ADMIN');

  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (id, e) => {
    e.stopPropagation();
    setOpenDropdownId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden text-left">
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-bold uppercase text-[10px]">
              <th className="py-3.5 pl-6">Partner Organization</th>
              <th className="py-3.5 px-4">Industry Sector</th>
              <th className="py-3.5 px-4">Contact Person</th>
              <th className="py-3.5 px-4">Email & Phone</th>
              <th className="py-3.5 px-4">Relationship Health</th>
              <th className="py-3.5 px-4 text-center">Visits</th>
              <th className="py-3.5 pr-6 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Spinner size="lg" color="navy" />
                    <p className="text-xs font-bold text-slate-500">Loading corporate partners...</p>
                  </div>
                </td>
              </tr>
            ) : organizations.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-24 text-center">
                  <div className="w-14 h-14 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Building2 className="w-7 h-7" />
                  </div>
                  <h4 className="font-heading font-bold text-sm text-[#000000]">No Organizations Found</h4>
                  <p className="text-xs text-slate-500 mt-1">Try searching by partner name or contact person.</p>
                </td>
              </tr>
            ) : (
              organizations.map((org) => {
                const score = org.relationshipScore || org.relationshipHealthScore || 85;
                const contactPerson = org.primaryContactPerson || org.contactPersonName;

                return (
                  <tr
                    key={org.id}
                    onClick={() => openProfileDrawer(org)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Name & Origin */}
                    <td className="py-4 pl-6 font-medium">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-2xl bg-sky-50 text-[#00adef] flex items-center justify-center font-bold text-xs shrink-0 border border-sky-200">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="truncate max-w-[200px]">
                          <p className="font-bold text-[#000000] truncate group-hover:text-[#00adef] transition-colors">
                            {org.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-normal truncate mt-0.5">
                            {org.marketCountry || 'Ethiopia'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Sector */}
                    <td className="py-4 px-4 font-semibold text-slate-800">
                      {org.industrySector ? (
                        <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 font-bold text-[10px]">
                          {org.industrySector}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic font-normal">—</span>
                      )}
                    </td>

                    {/* Contact Person */}
                    <td className="py-4 px-4 font-semibold text-slate-800">
                      {contactPerson ? (
                        <span className="text-slate-900 font-bold">{contactPerson}</span>
                      ) : (
                        <span className="text-slate-400 italic font-normal">—</span>
                      )}
                    </td>

                    {/* Email & Phone */}
                    <td className="py-4 px-4 text-slate-600">
                      {org.contactEmail ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 truncate max-w-[190px]">
                          <Mail className="w-3.5 h-3.5 text-[#00adef] shrink-0" />
                          <span className="truncate">{org.contactEmail}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic font-normal text-xs">—</span>
                      )}
                      {org.contactPhone && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{org.contactPhone}</span>
                        </div>
                      )}
                    </td>

                    {/* Relationship Health Score Gauge */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 max-w-[140px]">
                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-[#00adef] via-[#00adef] to-[#e38524] rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, score)}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-800 text-[11px]">
                          {score}/100
                        </span>
                      </div>
                    </td>

                    {/* Total Visits Completed */}
                    <td className="py-4 px-4 text-center">
                      <span className="font-heading font-black text-sm text-[#000000]">
                        {org.totalVisits ?? org.totalVisitsCompleted ?? 0}
                      </span>
                    </td>

                    {/* Actions Dropdown */}
                    <td
                      className="py-4 pr-6 text-right relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative inline-block text-left" ref={openDropdownId === org.id ? dropdownRef : null}>
                        <button
                          type="button"
                          onClick={(e) => toggleDropdown(org.id, e)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            openDropdownId === org.id
                              ? 'bg-[#00adef] text-white border-[#00adef] shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-xs'
                          }`}
                        >
                          <span>Actions</span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            openDropdownId === org.id ? 'rotate-180 text-white' : 'text-slate-400'
                          }`} />
                        </button>

                        {openDropdownId === org.id && (
                          <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-40 animate-fadeIn text-left">
                            {/* 1. View Dossier */}
                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdownId(null);
                                openProfileDrawer(org);
                              }}
                              className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-[#00adef] flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4 text-slate-400" />
                              <span>View Partner Dossier</span>
                            </button>

                            {/* 2. Edit Organization */}
                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdownId(null);
                                openEditModal(org);
                              }}
                              className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-[#00adef] flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4 text-slate-400" />
                              <span>Edit Organization</span>
                            </button>

                            {/* 3. Book Visit for Partner */}
                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdownId(null);
                                openVisitModal({
                                  organizationName: org.name,
                                  guestOrganizationId: org.id,
                                  purpose: `Corporate Alliance Review with ${org.name}`,
                                });
                              }}
                              className="w-full px-3.5 py-2 text-xs font-semibold text-[#e38524] hover:bg-orange-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <CalendarPlus className="w-4 h-4 text-[#e38524]" />
                              <span>Book Visit for Partner</span>
                            </button>

                            {/* 4. Delete Record (Admin) */}
                            {isAdmin && (
                              <div className="pt-1 mt-1 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    if (
                                      window.confirm(
                                        `Are you sure you want to delete organization "${org.name}"?`
                                      )
                                    ) {
                                      deleteOrganization(org.id, org.name);
                                    }
                                  }}
                                  className="w-full px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 text-rose-500" />
                                  <span>Delete Partner Record</span>
                                </button>
                              </div>
                            )}
                          </div>
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

      {/* Pagination */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing page <span className="font-bold text-[#000000]">{currentPage + 1}</span> of{' '}
          <span className="font-bold text-[#000000]">{totalPages || 1}</span> ({totalElements} organizations)
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

export default OrganizationTable;
