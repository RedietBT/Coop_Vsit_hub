import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  User,
  Crown,
  IdCard,
  Mail,
  Phone,
  CalendarPlus,
  Trash2,
  Building2,
  Globe,
  Award,
  Edit2,
  Sparkles,
  Calendar,
} from 'lucide-react';
import useGuestStore from '../store/guestStore';
import useVisitStore from '@/modules/visits/store/visitStore';
import useAuthStore from '@/modules/auth/store/authStore';
import Button from '@/shared/components/ui/Button';

export const GuestProfileDrawer = () => {
  const { selectedGuest, isProfileDrawerOpen, closeProfileDrawer, openEditModal, deleteGuest } =
    useGuestStore();
  const { visits, openCreateModal: openVisitModal } = useVisitStore();
  const { hasRole } = useAuthStore();
  const isAdmin = hasRole('ROLE_ADMIN');

  // Filter real visits associated with this guest
  const guestVisits = useMemo(() => {
    if (!selectedGuest) return [];
    return (visits || []).filter(
      (v) =>
        v.masterIndividualGuestId === selectedGuest.id ||
        (v.guestDisplayName &&
          v.guestDisplayName.toLowerCase() === selectedGuest.fullName?.toLowerCase())
    );
  }, [selectedGuest, visits]);

  if (!selectedGuest) return null;

  const score = selectedGuest.relationshipScore || 85;
  const isTier1 = selectedGuest.vipTier === 'VIP_TIER_1' || selectedGuest.vipTier === 'TIER_1';

  const formatTierLabel = (tier) => {
    if (!tier) return 'Standard';
    if (tier === 'VIP_TIER_1' || tier === 'TIER_1') return 'Tier 1';
    if (tier === 'VIP_TIER_2' || tier === 'TIER_2') return 'Tier 2';
    if (tier === 'DIPLOMAT') return 'Diplomat';
    return 'Standard';
  };

  const getScoreRating = (s) => {
    if (s >= 80) return { label: 'Strategic Tier 1', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    if (s >= 60) return { label: 'Active Dignitary', color: 'text-sky-600 bg-sky-50 border-sky-200' };
    return { label: 'Standard Guest', color: 'text-amber-600 bg-amber-50 border-amber-200' };
  };

  const rating = getScoreRating(score);

  const getInitials = (name) => {
    if (!name) return 'VG';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <AnimatePresence>
      {isProfileDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeProfileDrawer}
            className="fixed inset-0 bg-slate-950/30 backdrop-blur-xs transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
            <motion.div
              initial={{ x: '100%', opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.8 }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="w-screen max-w-xl my-3 mr-3 h-[calc(100vh-24px)] bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 shadow-2xl flex flex-col overflow-hidden text-left"
            >
              {/* Top Header Card */}
              <div className="p-6 border-b border-slate-100 bg-linear-to-r from-amber-50/60 via-white to-sky-50/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border shadow-xs shrink-0 ${
                        isTier1
                          ? 'bg-amber-50 text-[#e38524] border-amber-300'
                          : 'bg-sky-50 text-[#00adef] border-sky-200'
                      }`}
                    >
                      {getInitials(selectedGuest.fullName)}
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-lg sm:text-xl text-[#000000] leading-tight">
                        {selectedGuest.fullName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          <span>{selectedGuest.countryOfResidence || selectedGuest.nationalityCountry || 'Ethiopia'}</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${rating.color}`}>
                          {formatTierLabel(selectedGuest.vipTier)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(selectedGuest)}
                      className="p-2 rounded-2xl text-slate-400 hover:text-[#00adef] hover:bg-sky-50 transition-colors cursor-pointer"
                      title="Edit Individual Guest"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={closeProfileDrawer}
                      className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Close Drawer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Score Banner */}
                <div className="mt-5 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-[#e38524] uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#e38524]" />
                      <span>Guest Relationship Health</span>
                    </span>
                    <span className="font-mono text-sm font-black text-[#000000]">{score}/100</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-[#00adef] via-[#00adef] to-[#e38524] rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, score)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                {/* 1. Contact & Identity Intelligence Card */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#00adef]" />
                      <span>Contact & Identity Intelligence</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-amber-100/70 text-[#e38524] font-bold text-[10px]">
                      {formatTierLabel(selectedGuest.vipTier)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Email */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs">
                      <p className="text-slate-400 text-[10px] uppercase font-bold">Email Address</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Mail className="w-3.5 h-3.5 text-[#00adef] shrink-0" />
                        <span className="font-semibold text-slate-800 truncate">
                          {selectedGuest.email || <span className="text-slate-400 font-normal italic">—</span>}
                        </span>
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs">
                      <p className="text-slate-400 text-[10px] uppercase font-bold">Phone Number</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Phone className="w-3.5 h-3.5 text-[#e38524] shrink-0" />
                        <span className="font-mono font-semibold text-slate-800">
                          {selectedGuest.phoneNumber || <span className="text-slate-400 font-normal italic font-sans">—</span>}
                        </span>
                      </div>
                    </div>

                    {/* Identity Document Type */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs">
                      <p className="text-slate-400 text-[10px] uppercase font-bold">Document Type</p>
                      <p className="font-bold text-[#000000] text-xs mt-1">
                        {selectedGuest.idType || selectedGuest.identityDocumentType || <span className="text-slate-400 font-normal italic">—</span>}
                      </p>
                    </div>

                    {/* Identity Document Number */}
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs">
                      <p className="text-slate-400 text-[10px] uppercase font-bold">Document Number</p>
                      <p className="font-mono font-bold text-slate-800 text-xs mt-1">
                        {selectedGuest.idNumber || <span className="text-slate-400 font-normal italic font-sans">—</span>}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Portfolio Stats Card */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center">
                    <p className="text-slate-400 text-[10px] uppercase font-bold">Total Visits</p>
                    <p className="font-heading font-black text-xl text-[#000000] mt-1">
                      {selectedGuest.totalVisitsCompleted ?? selectedGuest.totalVisits ?? guestVisits.length}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Completed & Scheduled</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center">
                    <p className="text-slate-400 text-[10px] uppercase font-bold">Country of Residence</p>
                    <p className="font-heading font-black text-base text-slate-800 mt-1 truncate px-2">
                      {selectedGuest.countryOfResidence || selectedGuest.nationalityCountry || 'Ethiopia'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Citizenship / Residence</p>
                  </div>
                </div>

                {/* 3. Notes & Protocol Context */}
                {(selectedGuest.notes || selectedGuest.profileNotes) && (
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Protocol & Profile Notes
                    </span>
                    <p className="text-slate-700 leading-relaxed italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                      "{selectedGuest.notes || selectedGuest.profileNotes}"
                    </p>
                  </div>
                )}

                {/* 4. Recent Visits List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#e38524]" />
                      <span>Recent Visits ({guestVisits.length})</span>
                    </span>
                  </div>

                  {guestVisits.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 text-center text-slate-400">
                      <p className="font-medium text-xs">No visit records registered for this guest yet.</p>
                      <p className="text-[10px] text-slate-400 mt-1">Schedule a visit below to initiate relationship records.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {guestVisits.slice(0, 5).map((v) => (
                        <div
                          key={v.id || v.visitCode}
                          className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between hover:border-sky-300 transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-[#00adef]">
                                {v.visitCode || 'VIS-XXXX'}
                              </span>
                              <span className="font-semibold text-slate-800 text-xs">
                                {v.title || 'Executive Meeting'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {v.scheduledStartTime ? new Date(v.scheduledStartTime).toLocaleDateString() : 'Scheduled'} • {v.locationRoom || 'Headquarters'}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                            {v.status || 'SCHEDULED'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Footer Actions */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(selectedGuest)}
                    icon={Edit2}
                    className="font-bold text-xs"
                  >
                    Edit Guest Details
                  </Button>

                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteGuest(selectedGuest.id, selectedGuest.fullName)}
                      icon={Trash2}
                      className="text-rose-600 hover:bg-rose-50"
                    >
                      Delete
                    </Button>
                  )}
                </div>

                <Button
                  variant="orange"
                  size="sm"
                  onClick={() => {
                    closeProfileDrawer();
                    openVisitModal({
                      guestCategory: 'INDIVIDUAL',
                      individualGuestId: selectedGuest.id,
                      guestDisplayName: selectedGuest.fullName,
                    });
                  }}
                  icon={CalendarPlus}
                  className="font-bold text-xs shadow-xs"
                >
                  Schedule Visit
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default GuestProfileDrawer;
