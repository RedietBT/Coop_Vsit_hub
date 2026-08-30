import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Building2,
  Globe,
  Mail,
  Phone,
  User,
  CalendarPlus,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
  Award,
  Layers,
} from 'lucide-react';
import useOrganizationStore from '../store/organizationStore';
import useVisitStore from '@/modules/visits/store/visitStore';
import useAuthStore from '@/modules/auth/store/authStore';
import Button from '@/shared/components/ui/Button';

export const OrganizationProfileDrawer = () => {
  const { selectedOrg, isProfileDrawerOpen, closeProfileDrawer, openEditModal, deleteOrganization } =
    useOrganizationStore();
  const { visits, openCreateModal: openVisitModal } = useVisitStore();
  const { hasRole } = useAuthStore();
  const isAdmin = hasRole('ROLE_ADMIN');

  // Find recent visits associated with this organization
  const orgVisits = useMemo(() => {
    if (!selectedOrg) return [];
    return (visits || []).filter(
      (v) =>
        v.guestOrganizationId === selectedOrg.id ||
        (v.organizationName &&
          v.organizationName.toLowerCase() === selectedOrg.name.toLowerCase())
    );
  }, [selectedOrg, visits]);

  if (!selectedOrg) return null;

  const score = selectedOrg.relationshipScore || selectedOrg.relationshipHealthScore || 85;
  const contactPerson = selectedOrg.primaryContactPerson || selectedOrg.contactPersonName;

  const getScoreRating = (s) => {
    if (s >= 80) return { label: 'Strategic Tier 1', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    if (s >= 60) return { label: 'Active Commercial Tier', color: 'text-sky-600 bg-sky-50 border-sky-200' };
    return { label: 'Emerging Alliance', color: 'text-amber-600 bg-amber-50 border-amber-200' };
  };

  const rating = getScoreRating(score);

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
              {/* Top Header */}
              <div className="p-6 border-b border-slate-100 bg-linear-to-r from-sky-50/60 via-white to-orange-50/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#00adef] flex items-center justify-center font-bold border border-sky-200 shadow-xs shrink-0">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-lg sm:text-xl text-[#000000] leading-tight">
                        {selectedOrg.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          <span>{selectedOrg.marketCountry || 'Ethiopia'}</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${rating.color}`}>
                          {rating.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(selectedOrg)}
                      className="p-2 rounded-2xl text-slate-400 hover:text-[#00adef] hover:bg-sky-50 transition-colors cursor-pointer"
                      title="Edit Organization"
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
                      <span>Relationship Health Score</span>
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
                {/* 1. Corporate Contact Intelligence Card */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#00adef]" />
                      <span>Corporate Contact Intelligence</span>
                    </span>
                    {selectedOrg.industrySector && (
                      <span className="px-2.5 py-1 rounded-xl bg-sky-100/70 text-[#00adef] font-bold text-[10px]">
                        {selectedOrg.industrySector}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs">
                      <p className="text-slate-400 text-[10px] uppercase font-bold">Primary Contact Person</p>
                      <p className="font-bold text-[#000000] text-xs mt-1">
                        {contactPerson || <span className="text-slate-400 font-normal italic">—</span>}
                      </p>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs">
                      <p className="text-slate-400 text-[10px] uppercase font-bold">Industry Sector</p>
                      <p className="font-bold text-slate-800 text-xs mt-1">
                        {selectedOrg.industrySector || <span className="text-slate-400 font-normal italic">—</span>}
                      </p>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs">
                      <p className="text-slate-400 text-[10px] uppercase font-bold">Email Address</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Mail className="w-3.5 h-3.5 text-[#00adef] shrink-0" />
                        <span className="font-semibold text-slate-800 truncate">
                          {selectedOrg.contactEmail || <span className="text-slate-400 font-normal italic">—</span>}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/70 shadow-2xs">
                      <p className="text-slate-400 text-[10px] uppercase font-bold">Phone Number</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Phone className="w-3.5 h-3.5 text-[#e38524] shrink-0" />
                        <span className="font-mono font-semibold text-slate-800">
                          {selectedOrg.contactPhone || <span className="text-slate-400 font-normal italic font-sans">—</span>}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Portfolio Stats Card */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center">
                    <p className="text-slate-400 text-[10px] uppercase font-bold">Total Delegations</p>
                    <p className="font-heading font-black text-xl text-[#000000] mt-1">
                      {selectedOrg.totalVisitsCompleted ?? selectedOrg.totalVisits ?? orgVisits.length}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Completed & Scheduled</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs text-center">
                    <p className="text-slate-400 text-[10px] uppercase font-bold">Country of Origin</p>
                    <p className="font-heading font-black text-base text-slate-800 mt-1 truncate px-2">
                      {selectedOrg.marketCountry || 'Ethiopia'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Corporate HQ / Market</p>
                  </div>
                </div>

                {/* 3. Strategic Notes & Relationship Context */}
                {(selectedOrg.overviewNotes || selectedOrg.notes) && (
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-1.5">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Strategic Overview & Alignment
                    </span>
                    <p className="text-slate-700 leading-relaxed italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                      "{selectedOrg.overviewNotes || selectedOrg.notes}"
                    </p>
                  </div>
                )}

                {/* 4. Recent Delegations List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#e38524]" />
                      <span>Recent Visit Delegations ({orgVisits.length})</span>
                    </span>
                  </div>

                  {orgVisits.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/70 text-center text-slate-400">
                      <p className="font-medium text-xs">No visit records registered under this partner yet.</p>
                      <p className="text-[10px] text-slate-400 mt-1">Book a visit below to initiate relationship records.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {orgVisits.slice(0, 5).map((v) => (
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
                                {v.guestDisplayName || v.individualGuestFirstName || 'Guest'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {v.scheduledStartTime ? new Date(v.scheduledStartTime).toLocaleDateString() : 'Scheduled'}{' '}
                              • {v.locationRoom || 'Executive Suite'}
                            </p>
                          </div>

                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            {v.status || 'SCHEDULED'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(selectedOrg)}
                    className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-[#00adef] hover:border-sky-300 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-xs"
                    title="Edit Partner Information"
                  >
                    <Edit2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Edit Details</span>
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => deleteOrganization(selectedOrg.id, selectedOrg.name)}
                      className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                      title="Delete Partner Organization"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <Button
                  variant="orange"
                  size="md"
                  onClick={() => {
                    closeProfileDrawer();
                    openVisitModal({
                      organizationName: selectedOrg.name,
                      guestOrganizationId: selectedOrg.id,
                      purpose: `Corporate Alliance Review with ${selectedOrg.name}`,
                    });
                  }}
                  icon={CalendarPlus}
                  className="flex-1 sm:flex-initial"
                >
                  Book New Visit for {selectedOrg.name}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default OrganizationProfileDrawer;
