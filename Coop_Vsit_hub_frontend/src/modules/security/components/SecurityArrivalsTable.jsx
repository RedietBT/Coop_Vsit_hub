import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown,
  LogIn,
  Eye,
  Building2,
  User,
  Clock,
  MapPin,
  CalendarCheck,
  Edit3,
  Phone,
} from 'lucide-react';
import useSecurityStore from '../store/securityStore';
import useVisitStore from '@/modules/visits/store/visitStore';
import Badge from '@/shared/components/ui/Badge';
import Spinner from '@/shared/components/ui/Spinner';

export const SecurityArrivalsTable = () => {
  const { expectedArrivals, isLoading, openCheckInModal, openEditVisitorModal } = useSecurityStore();
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

  const formatTime = (isoString) => {
    if (!isoString) return 'TBD';
    return new Date(isoString).toLocaleTimeString('en-US', {
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
      <div className="overflow-x-auto min-h-[260px]">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-400 font-bold uppercase text-[10px]">
              <th className="py-3.5 pl-6">Visit Reference</th>
              <th className="py-3.5 px-4">Visitor / Organization</th>
              <th className="py-3.5 px-4">Phone Number</th>
              <th className="py-3.5 px-4">Scheduled Arrival</th>
              <th className="py-3.5 px-4">Assigned Room</th>
              <th className="py-3.5 px-4">Headcount</th>
              <th className="py-3.5 pr-6 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-20 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <Spinner size="lg" color="navy" />
                    <p className="text-xs font-bold text-slate-500">Checking expected arrivals...</p>
                  </div>
                </td>
              </tr>
            ) : expectedArrivals.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-20 text-center">
                  <div className="w-14 h-14 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <CalendarCheck className="w-7 h-7" />
                  </div>
                  <h4 className="font-heading font-bold text-sm text-[#000000]">No Pending Arrivals</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    All approved delegations for today have checked in or no new arrivals scheduled.
                  </p>
                </td>
              </tr>
            ) : (
              expectedArrivals.map((visit) => (
                <tr
                  key={visit.id}
                  onClick={() => openDetailDrawer(visit)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  {/* Visit Code */}
                  <td className="py-4 pl-6 font-medium">
                    <span className="font-mono text-xs font-black text-[#00adef] group-hover:underline">
                      {visit.visitCode || 'VIS-2026'}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[130px]">
                      {visit.requestingDepartment || 'Banking Dept'}
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

                  {/* Phone Number */}
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

                  {/* Scheduled Time */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-[#000000]">
                      <Clock className="w-3.5 h-3.5 text-[#00adef]" />
                      <span>{formatTime(visit.scheduledStartTime)}</span>
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

                  {/* Headcount */}
                  <td className="py-4 px-4">
                    <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 font-bold text-[11px]">
                      {visit.visitorCount || 1} Person(s)
                    </span>
                  </td>

                  {/* Actions Dropdown */}
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

                      {openDropdownId === visit.id && (
                        <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-40 animate-fadeIn text-left">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenDropdownId(null);
                              openCheckInModal(visit);
                            }}
                            className="w-full px-3.5 py-2 text-xs font-semibold text-[#00adef] hover:bg-sky-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <LogIn className="w-4 h-4 text-[#00adef]" />
                            <span>Check-In Guest & Issue Badge</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setOpenDropdownId(null);
                              openEditVisitorModal(visit);
                            }}
                            className="w-full px-3.5 py-2 text-xs font-semibold text-[#e38524] hover:bg-orange-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4 text-[#e38524]" />
                            <span>Edit Visitor Demographics</span>
                          </button>

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

export default SecurityArrivalsTable;
