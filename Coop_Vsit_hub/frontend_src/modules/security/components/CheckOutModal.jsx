import React from 'react';
import { useForm } from 'react-hook-form';
import { LogOut, ShieldAlert, CheckCircle2, Sparkles } from 'lucide-react';
import useSecurityStore from '../store/securityStore';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';

export const CheckOutModal = () => {
  const { checkOutTarget, isCheckOutModalOpen, closeCheckOutModal, submitCheckOut } =
    useSecurityStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      checkOutNotes: 'Visitor physical badge collected. Escorted to exit turnstile.',
    },
  });

  const handleClose = () => {
    reset();
    closeCheckOutModal();
  };

  const onSubmit = async (data) => {
    if (!checkOutTarget) return;
    await submitCheckOut(checkOutTarget.id, data);
  };

  if (!checkOutTarget) return null;

  return (
    <Modal
      isOpen={isCheckOutModalOpen}
      onClose={handleClose}
      title="Confirm Visitor Departure & Badge Collection"
      subtitle={`Visit Reference: ${checkOutTarget.visitCode || 'VIS-2026'} • ${checkOutTarget.title}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <ShieldAlert className="w-4 h-4 text-[#e38524]" />
            <span>Badge Deactivation & Exit Screening</span>
          </div>
          <p className="text-amber-800">
            Active Security Badge ID: <strong className="font-mono">{checkOutTarget.visitorBadgeNumber || 'COOPV-ACTIVE'}</strong>
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
            Departure & Handover Notes
          </label>
          <textarea
            rows="2"
            className="w-full text-xs rounded-xl border border-slate-300 p-3 text-slate-900 focus:outline-none focus:border-[#00adef]"
            {...register('checkOutNotes')}
          />
        </div>

        <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-xs text-sky-900 flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-[#00adef] shrink-0 mt-0.5" />
          <span>
            Upon confirmation, the system automatically logs the check-out timestamp and triggers the <strong>Customer Satisfaction Survey invitation email</strong>.
          </span>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            className="w-1/2"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="orange"
            className="w-1/2"
            icon={LogOut}
            isLoading={isSubmitting}
          >
            Complete Check-Out
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CheckOutModal;
