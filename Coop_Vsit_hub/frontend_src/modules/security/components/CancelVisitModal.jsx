import React, { useState } from 'react';
import { AlertTriangle, XCircle, Calendar, User, Building2, MapPin } from 'lucide-react';
import useSecurityStore from '../store/securityStore';
import useVisitStore from '@/modules/visits/store/visitStore';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';

const QUICK_CANCEL_REASONS = [
  'Visitor did not show up (No-show)',
  'Visitor requested cancellation / Rescheduled',
  'Host unavailable / Meeting cancelled',
  'Duplicate or erroneous registration',
];

export const CancelVisitModal = () => {
  const { cancelTarget, isCancelModalOpen, closeCancelModal, cancelVisit } = useSecurityStore();
  const { transitionStatus, fetchVisits } = useVisitStore();

  const [selectedReason, setSelectedReason] = useState(QUICK_CANCEL_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!cancelTarget) return null;

  const handleClose = () => {
    setSelectedReason(QUICK_CANCEL_REASONS[0]);
    setCustomReason('');
    closeCancelModal();
  };

  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    const finalReason = customReason.trim() || selectedReason;
    setIsSubmitting(true);
    try {
      if (cancelVisit) {
        await cancelVisit(cancelTarget.id, finalReason);
      } else {
        await transitionStatus(cancelTarget.id, 'CANCELLED', finalReason);
      }
      if (fetchVisits) {
        fetchVisits();
      }
      handleClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isCancelModalOpen}
      onClose={handleClose}
      title="Cancel Visit Reservation"
      subtitle="Record visit cancellation and free up allocated facilities."
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleConfirmCancel} className="space-y-4 text-left">
        {/* Visit Details Card */}
        <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-xs text-rose-700">
              {cancelTarget.visitCode || 'VIS-XXXX'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 uppercase">
              {cancelTarget.status || 'SCHEDULED'}
            </span>
          </div>

          <h4 className="font-heading font-black text-sm text-slate-900">
            {cancelTarget.title || 'Corporate Meeting'}
          </h4>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-rose-200/50">
            <div className="flex items-center gap-1.5 text-slate-700">
              <User className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span className="truncate font-semibold">{cancelTarget.guestDisplayName || 'Guest'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              <span className="truncate">{cancelTarget.locationRoom || '—'}</span>
            </div>
          </div>
        </div>

        {/* Warning Alert */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            This visit will be marked as <strong>CANCELLED</strong> and recorded permanently in reports and analytics.
          </p>
        </div>

        {/* Cancellation Reason */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
            Select Cancellation Reason
          </label>
          <div className="space-y-1.5">
            {QUICK_CANCEL_REASONS.map((r) => (
              <label
                key={r}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                  selectedReason === r
                    ? 'border-rose-300 bg-rose-50/50 font-semibold text-rose-900'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="cancelReason"
                  value={r}
                  checked={selectedReason === r}
                  onChange={() => setSelectedReason(r)}
                  className="text-rose-600 focus:ring-rose-500"
                />
                <span>{r}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
            Additional Remarks (Optional)
          </label>
          <textarea
            rows="2"
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="Add any specific context or remarks for the audit record..."
            className="w-full text-xs rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Go Back
          </Button>

          <Button
            type="submit"
            variant="danger"
            icon={XCircle}
            isLoading={isSubmitting}
          >
            Confirm Visit Cancellation
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CancelVisitModal;
