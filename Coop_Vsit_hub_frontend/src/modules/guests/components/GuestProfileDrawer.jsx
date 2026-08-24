import React from 'react';
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
} from 'lucide-react';
import useGuestStore from '../store/guestStore';
import useVisitStore from '@/modules/visits/store/visitStore';
import useAuthStore from '@/modules/auth/store/authStore';
import Button from '@/shared/components/ui/Button';

export const GuestProfileDrawer = () => {
  const { selectedGuest, isProfileDrawerOpen, closeProfileDrawer, deleteGuest } =
    useGuestStore();
  const { openCreateModal: openVisitModal } = useVisitStore();
  const { hasRole } = useAuthStore();
  const isAdmin = hasRole('ROLE_ADMIN');

  if (!selectedGuest) return null;

  const score = selectedGuest.relationshipScore || 90;
  const isTier1 = selectedGuest.vipTier === 'TIER_1';

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
              <div className="p-6 border-b border-slate-100 bg-linear-to-r from-amber-50/60 via-white to-sky-50/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm border shadow-xs ${
                        isTier1
                          ? 'bg-amber-50 text-[#e38524] border-amber-300'
                          : 'bg-sky-50 text-[#00adef] border-sky-200'
                      }`}
                    >
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-black text-lg text-[#000000]">
                          {selectedGuest.fullName}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                            isTier1
                              ? 'bg-amber-50 text-[#e38524] border-amber-300'
                              : 'bg-sky-50 text-[#00adef] border-sky-300'
                          }`}
                        >
                          {selectedGuest.vipTier?.replace('_', ' ') || 'VIP TIER 1'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {selectedGuest.titlePosition || 'Executive Delegate'} • {selectedGuest.affiliation || 'VIP'}
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
                      VIP Relationship Health
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
                {/* Identity & Credentials */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <span className="text-[10px] font-black uppercase text-slate-400">
                    Identity & Security Credentials
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-slate-400 text-[10px] uppercase font-bold">Document Type</p>
                      <p className="font-bold text-[#000000] mt-0.5">
                        {selectedGuest.identityDocumentType || 'Passport'}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400 text-[10px] uppercase font-bold">Document Number</p>
                      <p className="font-mono font-bold text-slate-800 mt-0.5">
                        {selectedGuest.identityDocumentNumber || 'EP2948194'}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400 text-[10px] uppercase font-bold">Contact Email</p>
                      <p className="font-mono text-slate-700 mt-0.5 truncate">
                        {selectedGuest.email || 'vip.guest@coop.et'}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400 text-[10px] uppercase font-bold">Phone Number</p>
                      <p className="font-mono text-slate-700 mt-0.5">
                        {selectedGuest.phone || '+251 91 122 3344'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedGuest.profileNotes && (
                  <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-2">
                    <span className="text-[10px] font-black uppercase text-slate-400">
                      Protocol & Security Preferences
                    </span>
                    <p className="text-slate-700 leading-relaxed italic">
                      "{selectedGuest.profileNotes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                {isAdmin && (
                  <button
                    onClick={() => deleteGuest(selectedGuest.id, selectedGuest.fullName)}
                    className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold transition-colors cursor-pointer"
                    title="Delete VIP Guest Record"
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
                  Book New Visit for {selectedGuest.fullName}
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
