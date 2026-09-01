import React, { useMemo, useState, useEffect } from 'react';
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
  Star,
  MessageSquareQuote,
  Pin,
  PinOff,
} from 'lucide-react';
import useOrganizationStore from '../store/organizationStore';
import useVisitStore from '@/modules/visits/store/visitStore';
import useAuthStore from '@/modules/auth/store/authStore';
import feedbackApi from '@/modules/feedback/api/feedbackApi';
import Button from '@/shared/components/ui/Button';
import EditOrganizationModal from './EditOrganizationModal';

export const OrganizationProfileDrawer = () => {
  const { selectedOrg, isProfileDrawerOpen, closeProfileDrawer, openEditModal, deleteOrganization } =
    useOrganizationStore();
  const { visits, openCreateModal: openVisitModal } = useVisitStore();
  const { hasRole } = useAuthStore();
  const isAdmin = hasRole('ROLE_ADMIN');

  const [feedbacks, setFeedbacks] = useState([]);
  const [isLoadingFeedbacks, setIsLoadingFeedbacks] = useState(false);

  useEffect(() => {
    if (selectedOrg && selectedOrg.id && isProfileDrawerOpen) {
      setIsLoadingFeedbacks(true);
      feedbackApi.getOrgFeedbacks(selectedOrg.id)
        .then((res) => {
          setFeedbacks(res || []);
        })
        .catch(() => {
          setFeedbacks(selectedOrg.recentFeedbacks || []);
        })
        .finally(() => setIsLoadingFeedbacks(false));
    }
  }, [selectedOrg, isProfileDrawerOpen]);

  const handleTogglePin = async (feedbackId) => {
    try {
      const updated = await feedbackApi.togglePin(feedbackId);
      setFeedbacks((prev) =>
        prev.map((fb) => (fb.id === feedbackId ? { ...fb, pinned: updated.pinned } : fb))
      );
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

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

  const starScore = selectedOrg.starRating || (selectedOrg.relationshipScore ? Math.round((selectedOrg.relationshipScore / 20) * 10) / 10 : 4.8);
  const contactPerson = selectedOrg.primaryContactPerson || selectedOrg.contactPersonName;

  const getScoreRating = (s) => {
    if (s >= 4.5) return { label: 'Strategic Tier 1', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    if (s >= 3.5) return { label: 'Active Commercial Tier', color: 'text-sky-600 bg-sky-50 border-sky-200' };
    return { label: 'Emerging Alliance', color: 'text-amber-600 bg-amber-50 border-amber-200' };
  };

  const rating = getScoreRating(starScore);

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

                {/* Score Banner (1-5 Stars) */}
                <div className="mt-5 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[#e38524] uppercase tracking-wider text-[11px] font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#e38524]" />
                      <span>Relationship Health & CSAT</span>
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">Aggregated guest satisfaction index</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.floor(starScore)
                              ? 'text-amber-400 fill-amber-400'
                              : star === Math.ceil(starScore) && starScore % 1 >= 0.3
                              ? 'text-amber-400 fill-amber-400/50'
                              : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-mono text-base font-black text-[#000000]">
                      {starScore.toFixed(1)} <span className="text-xs text-slate-400 font-bold">/ 5.0</span>
                    </span>
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
                    <p className="text-slate-400 text-[10px] uppercase font-bold">Total Visits</p>
                    <p className="font-heading font-black text-xl text-[#000000] mt-1">
                      {selectedOrg.totalVisitsHosted ?? selectedOrg.totalVisits ?? orgVisits.length}
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

                {/* 4. Customer Feedback & Comments (With Admin Pin) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                      <MessageSquareQuote className="w-3.5 h-3.5 text-[#00adef]" />
                      <span>Customer Feedback & Comments ({feedbacks.length})</span>
                    </span>
                  </div>

                  {isLoadingFeedbacks ? (
                    <div className="p-4 text-center text-slate-400 text-xs font-bold">Loading guest feedback...</div>
                  ) : feedbacks.length === 0 ? (
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 text-center text-slate-400">
                      <p className="font-medium text-xs">No feedback reviews submitted yet.</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Post-visit ratings will appear here.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {feedbacks.map((fb) => {
                        const ratingVal = fb.overallRating || 5.0;
                        return (
                          <div
                            key={fb.id}
                            className={`p-3.5 rounded-2xl border transition-all ${
                              fb.pinned
                                ? 'bg-amber-50/50 border-[#e38524] shadow-xs'
                                : 'bg-white border-slate-200/80 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-1.5">
                                <div className="flex items-center">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star
                                      key={s}
                                      className={`w-3 h-3 ${
                                        s <= Math.floor(ratingVal)
                                          ? 'text-amber-400 fill-amber-400'
                                          : 'text-slate-200'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="font-bold text-slate-800 text-[11px]">
                                  {ratingVal.toFixed(1)} / 5.0
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {fb.pinned && (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                                    <Pin className="w-2.5 h-2.5" />
                                    <span>Pinned on Cockpit</span>
                                  </span>
                                )}
                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePin(fb.id)}
                                    className={`p-1 rounded-lg border text-xs transition-all cursor-pointer ${
                                      fb.pinned
                                        ? 'bg-[#e38524] text-white border-[#e38524]'
                                        : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-[#e38524]'
                                    }`}
                                    title={fb.pinned ? 'Unpin from Executive Cockpit' : 'Pin to Executive Cockpit'}
                                  >
                                    {fb.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                                  </button>
                                )}
                              </div>
                            </div>

                            {fb.comments ? (
                              <p className="text-slate-700 text-xs italic bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                                "{fb.comments}"
                              </p>
                            ) : (
                              <p className="text-slate-400 text-[11px] italic">No written comment provided.</p>
                            )}

                            <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono">
                              <span>Visit: {fb.visitCode || 'VIS-HUB'}</span>
                              <span>{fb.submittedAt ? new Date(fb.submittedAt).toLocaleDateString() : 'Recent'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 5. Recent Visits List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#e38524]" />
                      <span>Recent Visits ({orgVisits.length})</span>
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

      {/* Edit Organization Modal */}
      <EditOrganizationModal />
    </AnimatePresence>
  );
};

export default OrganizationProfileDrawer;
