import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Building2,
  User,
  Users,
  ShieldCheck,
  Award,
  CheckCircle2,
  XCircle,
  LogIn,
  LogOut,
  Trash2,
  Mail,
  Phone,
  FileText,
  DollarSign,
  Sparkles,
} from 'lucide-react';
import useVisitStore from '../store/visitStore';
import useAuthStore from '@/modules/auth/store/authStore';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';

export const VisitDetailDrawer = () => {
  const {
    selectedVisit,
    isDetailDrawerOpen,
    closeDetailDrawer,
    fetchVisitById,
    openStatusModal,
    checkIn,
    checkOut,
    deleteVisit,
  } = useVisitStore();

  const { hasRole, hasAnyRole } = useAuthStore();
  const [detail, setDetail] = useState(null);

  const isApprover = hasAnyRole(['ROLE_APPROVER', 'ROLE_ADMIN', 'ROLE_BUSINESS_SPONSOR']);
  const isSecurity = hasAnyRole(['ROLE_SECURITY_DESK', 'ROLE_ADMIN']);
  const isAdmin = hasRole('ROLE_ADMIN');

  useEffect(() => {
    if (selectedVisit?.id && isDetailDrawerOpen) {
      setDetail(selectedVisit);
      fetchVisitById(selectedVisit.id).then((d) => {
        if (d) setDetail(d);
      });
    }
  }, [selectedVisit, isDetailDrawerOpen, fetchVisitById]);

  if (!detail) return null;

  const formatDateTime = (isoString) => {
    if (!isoString) return 'Not recorded';
    return new Date(isoString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const steps = ['SUBMITTED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED'];
  const currentStepIndex = steps.indexOf(detail.status);

  return (
    <AnimatePresence>
      {isDetailDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDetailDrawer}
            className="fixed inset-0 bg-slate-950/30 backdrop-blur-xs transition-opacity"
          />

          {/* Slide-Out Drawer Card */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
            <motion.div
              initial={{ x: '100%', opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.8 }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="w-screen max-w-xl my-3 mr-3 h-[calc(100vh-24px)] bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 shadow-2xl shadow-slate-900/15 flex flex-col overflow-hidden text-left"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 bg-linear-to-r from-sky-50/60 via-white to-orange-50/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-sm font-black text-[#00adef]">
                        {detail.visitCode || 'VIS-2026'}
                      </span>
                      <Badge variant={detail.status} pulse={detail.status === 'IN_PROGRESS'}>
                        {detail.status}
                      </Badge>
                      <Badge variant={detail.priorityLevel?.toLowerCase() || 'medium'} size="sm">
                        {detail.priorityLevel || 'MEDIUM'}
                      </Badge>
                    </div>

                    <h3 className="font-heading font-black text-lg text-[#000000] leading-tight">
                      {detail.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {detail.requestingDepartment || 'Digital Banking'}
                    </p>
                  </div>

                  <button
                    onClick={closeDetailDrawer}
                    className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* State Progression Stepper */}
                {detail.status !== 'REJECTED' && detail.status !== 'CANCELLED' && (
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between relative">
                      <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-slate-200 pointer-events-none" />
                      {steps.map((st, idx) => {
                        const isDone = currentStepIndex >= idx;
                        const isCurrent = currentStepIndex === idx;
                        return (
                          <div key={st} className="relative z-10 flex flex-col items-center">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                                isDone
                                  ? 'bg-[#00adef] text-white shadow-xs'
                                  : 'bg-slate-200 text-slate-500'
                              } ${isCurrent ? 'ring-4 ring-sky-100 scale-110' : ''}`}
                            >
                              {idx + 1}
                            </div>
                            <span
                              className={`text-[9px] font-bold mt-1 uppercase tracking-wider ${
                                isDone ? 'text-[#00adef]' : 'text-slate-400'
                              }`}
                            >
                              {st.replace('_', ' ')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Body Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* 1. Delegation & Guest Details */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <div className="flex items-center gap-1.5">
                      {detail.guestCategory === 'ORGANIZATION' ? (
                        <Building2 className="w-4 h-4 text-[#00adef]" />
                      ) : (
                        <User className="w-4 h-4 text-[#e38524]" />
                      )}
                      <span>Guest Delegation Information</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      {detail.guestCategory}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Guest / Entity</p>
                      <p className="font-bold text-[#000000] text-sm">
                        {detail.guestDisplayName || detail.guestOrganizationName || 'Guest'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Visitor Headcount</p>
                      <p className="font-bold text-[#000000]">{detail.visitorCount || 1} Person(s)</p>
                    </div>

                    {detail.visitorBadgeNumber && (
                      <div className="col-span-2 p-2.5 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-[#00adef]" />
                          <span className="text-xs font-bold text-[#000000]">
                            Active Security Badge ID:
                          </span>
                        </div>
                        <span className="font-mono text-xs font-black text-[#00adef]">
                          {detail.visitorBadgeNumber}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Meeting Room & Scheduling */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <MapPin className="w-4 h-4 text-[#e38524]" />
                    <span>Meeting Location & Timetable</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Location Room:</span>
                      <span className="font-bold text-[#000000]">
                        {detail.locationRoom || 'Executive Room'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Scheduled Start:</span>
                      <span className="font-bold text-[#000000]">
                        {formatDateTime(detail.scheduledStartTime)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Scheduled End:</span>
                      <span className="font-bold text-[#000000]">
                        {formatDateTime(detail.scheduledEndTime)}
                      </span>
                    </div>

                    {detail.actualCheckInTime && (
                      <div className="flex items-center justify-between text-emerald-700 font-semibold pt-1 border-t border-slate-100">
                        <span>Actual Check-In:</span>
                        <span>{formatDateTime(detail.actualCheckInTime)}</span>
                      </div>
                    )}

                    {detail.actualCheckOutTime && (
                      <div className="flex items-center justify-between text-teal-700 font-semibold">
                        <span>Actual Check-Out:</span>
                        <span>{formatDateTime(detail.actualCheckOutTime)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Strategic Objective & Commercials */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <FileText className="w-4 h-4 text-[#00adef]" />
                    <span>Strategic Objective & Commercials</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Objective</p>
                      <p className="text-slate-700 mt-0.5 leading-relaxed">
                        {detail.visitObjective}
                      </p>
                    </div>

                    {detail.expectedOutcome && (
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Expected Outcome</p>
                        <p className="text-slate-700 mt-0.5">{detail.expectedOutcome}</p>
                      </div>
                    )}

                    {detail.opportunityValue > 0 && (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-slate-500">Commercial Pipeline:</span>
                        <span className="font-heading font-black text-sm text-emerald-700">
                          ${Number(detail.opportunityValue).toLocaleString()} {detail.currency || 'USD'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2">
                {/* Approver Actions */}
                {isApprover && detail.status === 'SUBMITTED' && (
                  <div className="flex items-center gap-2 w-full">
                    <Button
                      variant="danger"
                      size="sm"
                      className="w-1/2"
                      onClick={() => openStatusModal(detail, 'REJECTED')}
                    >
                      Reject Request
                    </Button>
                    <Button
                      variant="orange"
                      size="sm"
                      className="w-1/2"
                      onClick={() => openStatusModal(detail, 'APPROVED')}
                    >
                      Approve Visit
                    </Button>
                  </div>
                )}

                {/* Front Desk Actions */}
                {isSecurity && detail.status === 'APPROVED' && (
                  <Button
                    variant="cyan"
                    size="md"
                    className="w-full"
                    onClick={() => checkIn(detail.id)}
                    icon={LogIn}
                  >
                    Check In Visitor & Issue Badge
                  </Button>
                )}

                {isSecurity && detail.status === 'IN_PROGRESS' && (
                  <Button
                    variant="orange"
                    size="md"
                    className="w-full"
                    onClick={() => checkOut(detail.id)}
                    icon={LogOut}
                  >
                    Check Out & Trigger CSAT Survey
                  </Button>
                )}

                {/* Draft Delete Action */}
                {(detail.status === 'DRAFT' || detail.status === 'SUBMITTED') && isAdmin && (
                  <button
                    onClick={() => deleteVisit(detail.id)}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                {/* Close Button if no primary action */}
                {detail.status === 'COMPLETED' && (
                  <div className="w-full flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-emerald-600 font-bold">
                      <CheckCircle2 className="w-4 h-4" /> Completed Record
                    </span>
                    <Button variant="ghost" size="sm" onClick={closeDetailDrawer}>
                      Close
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default VisitDetailDrawer;
