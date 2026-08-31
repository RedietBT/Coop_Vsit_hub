import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  User,
  Eye,
  CalendarPlus,
  Trash2,
  Mail,
  Phone,
  IdCard,
  ChevronLeft,
  ChevronRight,
  Crown,
  Edit2,
} from 'lucide-react';
import useGuestStore from '../store/guestStore';
import useVisitStore from '@/modules/visits/store/visitStore';
import useAuthStore from '@/modules/auth/store/authStore';
import Badge from '@/shared/components/ui/Badge';
import Spinner from '@/shared/components/ui/Spinner';

export const GuestTable = () => {
  const {
    guests,
    totalElements,
    totalPages,
    currentPage,
    isLoading,
    setPage,
    openProfileDrawer,
    openEditModal,
    deleteGuest,
  } = useGuestStore();

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

  const getInitials = (name) => {
    if (!name) return 'VG';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const formatTierLabel = (tier) => {
    if (!tier) return 'Standard';
    if (tier === 'VIP_TIER_1' || tier === 'TIER_1') return 'Tier 1';
    if (tier === 'VIP_TIER_2' || tier === 'TIER_2') return 'Tier 2';
    if (tier === 'DIPLOMAT') return 'Diplomat';
    return 'Standard';
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden text-left">
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-bold uppercase text-[10px]">
              <th className="py-3.5 pl-6">Guest Name</th>
              <th className="py-3.5 px-4">Email Address</th>
              <th className="py-3.5 px-4">Phone Number</th>
              <th className="py-3.5 px-4">Classification</th>
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
                    <p className="text-xs font-bold text-slate-500">Loading individual guests...</p>
                  </div>
                </td>
              </tr>
            ) : guests.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-24 text-center">
                  <div className="w-14 h-14 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <User className="w-7 h-7" />
                  </div>
                  <h4 className="font-heading font-bold text-sm text-[#000000]">No Individual Guests Found</h4>
                  <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or register a new guest.</p>
                </td>
              </tr>
            ) : (
              guests.map((g) => {
                const score = g.relationshipScore || 90;
                const isTier1 = g.vipTier === 'VIP_TIER_1' || g.vipTier === 'TIER_1';

                return (
                  <tr
                    key={g.id}
                    onClick={() => openProfileDrawer(g)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Guest Name & Avatar */}
                    <td className="py-4 pl-6 font-medium">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 border ${
                            isTier1
                              ? 'bg-amber-50 text-[#e38524] border-amber-300 shadow-xs'
                              : 'bg-sky-50 text-[#00adef] border-sky-200 shadow-xs'
                          }`}
                        >
                          {getInitials(g.fullName)}
                        </div>
                        <div className="truncate max-w-[200px]">
                          <p className="font-bold text-[#000000] truncate group-hover:text-[#00adef] transition-colors">
                            {g.fullName}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {g.nationalityCountry || 'Ethiopia'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email Address Column */}
                    <td className="py-4 px-4 font-medium text-slate-800">
                      {g.email ? (
                        <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                          <Mail className="w-3.5 h-3.5 text-[#00adef] shrink-0" />
                          <span className="truncate max-w-[180px]">{g.email}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>

                    {/* Phone Number Column */}
                    <td className="py-4 px-4 font-mono text-xs text-slate-700 font-medium">
                      {g.phoneNumber ? (
                        <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                          <Phone className="w-3.5 h-3.5 text-[#e38524] shrink-0" />
                          <span>{g.phoneNumber}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>

                    {/* Classification Pill */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                          isTier1
                            ? 'bg-amber-50 text-[#e38524] border-amber-300'
                            : 'bg-sky-50 text-[#00adef] border-sky-300'
                        }`}
                      >
                        <Crown className="w-3 h-3" />
                        <span>{formatTierLabel(g.vipTier)}</span>
                      </span>
                    </td>

                    {/* Relationship Health Score */}
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

                    {/* Total Visits */}
                    <td className="py-4 px-4 text-center">
                      <span className="font-heading font-black text-sm text-[#000000]">
                        {g.totalVisitsCompleted ?? g.totalVisits ?? 0}
                      </span>
                    </td>

                    {/* Actions Dropdown */}
                    <td
                      className="py-4 pr-6 text-right relative"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative inline-block text-left" ref={openDropdownId === g.id ? dropdownRef : null}>
                        <button
                          type="button"
                          onClick={(e) => toggleDropdown(g.id, e)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            openDropdownId === g.id
                              ? 'bg-[#00adef] text-white border-[#00adef] shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-xs'
                          }`}
                        >
                          <span>Actions</span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            openDropdownId === g.id ? 'rotate-180 text-white' : 'text-slate-400'
                          }`} />
                        </button>

                        {openDropdownId === g.id && (
                          <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-40 animate-fadeIn text-left">
                            {/* 1. View Dossier */}
                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdownId(null);
                                openProfileDrawer(g);
                              }}
                              className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-[#00adef] flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4 text-slate-400" />
                              <span>View Profile Dossier</span>
                            </button>

                            {/* 2. Edit Guest */}
                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdownId(null);
                                openEditModal(g);
                              }}
                              className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50 hover:text-[#00adef] flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4 text-slate-400" />
                              <span>Edit Guest Details</span>
                            </button>

                            {/* 3. Book Visit */}
                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdownId(null);
                                openVisitModal({
                                  guestCategory: 'INDIVIDUAL',
                                  individualGuestId: g.id,
                                  guestDisplayName: g.fullName,
                                });
                              }}
                              className="w-full px-3.5 py-2 text-xs font-semibold text-[#e38524] hover:bg-orange-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <CalendarPlus className="w-4 h-4 text-[#e38524]" />
                              <span>Schedule Visit</span>
                            </button>

                            {/* 3. Delete Record */}
                            {isAdmin && (
                              <div className="pt-1 mt-1 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenDropdownId(null);
                                    if (
                                      window.confirm(
                                        `Are you sure you want to delete VIP guest record "${g.fullName}"?`
                                      )
                                    ) {
                                      deleteGuest(g.id, g.fullName);
                                    }
                                  }}
                                  className="w-full px-3.5 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 text-rose-500" />
                                  <span>Delete VIP Record</span>
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
          <span className="font-bold text-[#000000]">{totalPages || 1}</span> ({totalElements} VIP guests)
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

export default GuestTable;
