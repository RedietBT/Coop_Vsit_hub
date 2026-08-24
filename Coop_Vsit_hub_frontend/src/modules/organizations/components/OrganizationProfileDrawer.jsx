import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Building2,
  Award,
  Globe,
  Mail,
  Phone,
  CalendarPlus,
  Trash2,
  ShieldCheck,
  Calendar,
  Sparkles,
} from 'lucide-react';
import useOrganizationStore from '../store/organizationStore';
import useVisitStore from '@/modules/visits/store/visitStore';
import useAuthStore from '@/modules/auth/store/authStore';
import Button from '@/shared/components/ui/Button';

export const OrganizationProfileDrawer = () => {
  const { selectedOrg, isProfileDrawerOpen, closeProfileDrawer, deleteOrganization } =
    useOrganizationStore();
  const { openCreateModal: openVisitModal } = useVisitStore();
  const { hasRole } = useAuthStore();
  const isAdmin = hasRole('ROLE_ADMIN');

  if (!selectedOrg) return null;

  const score = selectedOrg.relationshipScore || selectedOrg.relationshipHealthScore || 85;

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

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
            <motion.div
              initial={{ x: '100%', opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.8 }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="w-screen max-w-lg my-3 mr-3 h-[calc(100vh-24px)] bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 shadow-2xl flex flex-col overflow-hidden text-left"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 bg-linear-to-r from-sky-50/60 via-white to-orange-50/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#00adef] flex items-center justify-center font-bold border border-sky-200 shadow-xs">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-heading font-black text-lg text-[#000000]">
                        {selectedOrg.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedOrg.category || 'Strategic Partner'} • {selectedOrg.marketCountry || 'Ethiopia'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={closeProfileDrawer}
                    className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Score Banner */}
                <div className="mt-5 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-[#e38524] uppercase tracking-wider">
                      Relationship Health Score
                    </span>
                    <span className="font-mono text-sm text-[#000000]">{score}/100</span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-[#00adef] via-[#00adef] to-[#e38524] rounded-full"
                      style={{ width: `${Math.min(100, score)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
                {/* Contact & Sector Details */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <span className="text-[10px] font-black uppercase text-slate-400">
                    Corporate Contact Intelligence
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-slate-400 text-[10px] uppercase font-bold">Primary Contact</p>
                      <p className="font-bold text-[#000000] mt-0.5">
                        {selectedOrg.primaryContactPerson || 'Executive Contact'}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400 text-[10px] uppercase font-bold">Industry Sector</p>
                      <p className="font-bold text-[#000000] mt-0.5">
                        {selectedOrg.industrySector || 'Enterprise'}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400 text-[10px] uppercase font-bold">Email</p>
                      <p className="font-mono text-slate-700 mt-0.5 truncate">
                        {selectedOrg.contactEmail || 'contact@partner.et'}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400 text-[10px] uppercase font-bold">Total Delegations</p>
                      <p className="font-bold text-[#000000] mt-0.5">
                        {selectedOrg.totalVisitsCompleted || selectedOrg.totalVisits || 1} Visits Completed
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrg.overviewNotes && (
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
                    <span className="text-[10px] font-black uppercase text-slate-400">
                      Strategic Overview & Alignment
                    </span>
                    <p className="text-slate-700 leading-relaxed italic">
                      "{selectedOrg.overviewNotes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                {isAdmin && (
                  <button
                    onClick={() => deleteOrganization(selectedOrg.id, selectedOrg.name)}
                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold transition-colors cursor-pointer"
                    title="Delete Organization"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <Button
                  variant="orange"
                  size="md"
                  className="flex-1"
                  onClick={() => {
                    closeProfileDrawer();
                    openVisitModal();
                  }}
                  icon={CalendarPlus}
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
