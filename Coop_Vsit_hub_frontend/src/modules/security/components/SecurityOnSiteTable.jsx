import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  LogOut,
  Eye,
  ShieldCheck,
  Building2,
  User,
  Clock,
  MapPin,
  Timer,
  Phone,
} from 'lucide-react';
import useSecurityStore from '../store/securityStore';
import useVisitStore from '@/modules/visits/store/visitStore';
import Badge from '@/shared/components/ui/Badge';
import Spinner from '@/shared/components/ui/Spinner';

export const SecurityOnSiteTable = () => {
  const { activeOnSite, isLoading, openCheckOutModal } = useSecurityStore();
  const { openDetailDrawer } = useVisitStore();

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

  const formatCheckInTime = (isoString) => {
    if (!isoString) return 'Active';
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateElapsedMinutes = (checkInTime) => {
    if (!checkInTime) return '0m';
    const diffMs = Date.now() - new Date(checkInTime).getTime();
    const mins = Math.max(0, Math.floor(diffMs / 60000));
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      return `${hrs}h ${remainingMins}m on-site`;
    }
    return `${mins}m on-site`;
  };

  const toggleDropdown = (id, e) => {
    e.stopPropagation();
    setOpenDropdownId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden text-left">
      <div className="overflow-x-auto min-h-[260px]">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-bold uppercase text-[10px]">
              <th className="py-3.5 pl-6">Active Security Badge</th>
              <th className="py-3.5 px-4">Visitor / Organization</th>
              <th className="py-3.5 px-4">Visitor Phone</th>
              <th className="py-3.5 px-4">Arrival Check-In</th>
              <th className="py-3.5 px-4">Room Location</th>
              <th className="py-3.5 px-4">Elapsed Duration</th>
              <th className="py-3.5 pr-6 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Spinner size="lg" color="navy" />
                    <p className="text-xs font-bold text-slate-500">Checking on-site delegations...</p>
                  </div>
                </td>
              </tr>
            ) : activeOnSite.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-20 text-center">
                  <div className="w-14 h-14 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <h4 className="font-heading font-bold text-sm text-[#000000]">No Visitors On-Premises</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    There are currently no active visitor badges assigned inside the building.
                  </p>
                </td>
              </tr>
            ) : (
              activeOnSite.map((visit) => (
                <tr
                  key={visit.id}
                  onClick={() => openDetailDrawer(visit)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  {/* Badge Number */}
                  <td className="py-4 pl-6 font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#e38524] animate-ping" />
                      <span className="font-mono text-xs font-black text-[#e38524] group-hover:underline">
                        {visit.visitorBadgeNumber || 'COOPV-ACTIVE'}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[130px]">
                      Ref: {visit.visitCode || 'VIS-2026'}
                    </p>
                  </td>

                  {/* Title & Guest */}
                  <td className="py-4 px-4 font-bold text-[#000000]">
                    <p className="truncate max-w-[200px] group-hover:text-[#00adef] transition-colors">
                      {visit.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] font-normal text-slate-500">
                      {visit.guestCategory === 'ORGANIZATION' ? (
                        <Building2 className="w-3.5 h-3.5 text-[#00adef] shrink-0" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-[#e38524] shrink-0" />
                      )}
                      <span className="truncate max-w-[180px] font-medium text-slate-700">
                        {visit.guestDisplayName || 'Guest Partner'}
                      </span>
                    </div>
                  </td>

                  {/* Visitor Phone */}
                  <td className="py-4 px-4 font-mono text-xs text-slate-700 font-medium">
                    {visit.visitorPhone ? (
                      <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                        <Phone className="w-3.5 h-3.5 text-[#00adef] shrink-0" />
                        <span>{visit.visitorPhone}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">—</span>
                    )}
                  </td>

                  {/* Arrival Time */}
                  <td className="py-4 px-4 font-semibold text-slate-800">
                    <div className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatCheckInTime(visit.actualCheckInTime)}</span>
                    </div>
                  </td>

                  {/* Room */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1 text-[11px] text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-[#e38524] shrink-0" />
                      <span className="truncate max-w-[160px] font-medium">
                        {visit.locationRoom || '—'}
                      </span>
                    </div>
                  </td>

                  {/* Elapsed Timer Chip */}
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 font-bold text-[11px]">
                      <Timer className="w-3 h-3 text-[#e38524]" />
                      <span>{calculateElapsedMinutes(visit.actualCheckInTime)}</span>
                    </span>
                  </td>

                  {/* Actions Column: Dedicated Check Out Button + Actions Dropdown */}
                  <td
                    className="py-4 pr-6 text-right relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-end gap-2">
                      {/* 1. Dedicated Direct Check Out Button */}
                      <button
                        type="button"
                        onClick={() => openCheckOutModal(visit)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                        title="Check-Out Visitor & Return Badge"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Check Out</span>
                      </button>

                      {/* 2. Actions Dropdown */}
                      <div className="relative inline-block text-left" ref={openDropdownId === visit.id ? dropdownRef : null}>
                        <button
                          type="button"
                          onClick={(e) => toggleDropdown(visit.id, e)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            openDropdownId === visit.id
                              ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-xs'
                          }`}
                        >
                          <span>Actions</span>
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${
                            openDropdownId === visit.id ? 'rotate-180 text-white' : 'text-slate-400'
                          }`} />
                        </button>

                        {openDropdownId === visit.id && (
                          <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-40 animate-fadeIn text-left">
                            <button
                              type="button"
                              onClick={() => {
                                setOpenDropdownId(null);
                                openDetailDrawer(visit);
                              }}
                              className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4 text-slate-400" />
                              <span>View Full Details</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SecurityOnSiteTable;
