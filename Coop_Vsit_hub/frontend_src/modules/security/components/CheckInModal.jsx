import React from 'react';
import { useForm } from 'react-hook-form';
import { ShieldCheck, IdCard, LogIn, Building2, User, MapPin } from 'lucide-react';
import useSecurityStore from '../store/securityStore';
import Modal from '@/shared/components/ui/Modal';
import Input from '@/shared/components/ui/Input';
import Button from '@/shared/components/ui/Button';

export const CheckInModal = () => {
  const { checkInTarget, isCheckInModalOpen, closeCheckInModal, submitCheckIn } =
    useSecurityStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      verifiedIdNumber: '',
      customBadgeNumber: '',
      checkInNotes: 'Visitor passed security screening and issued building access badge.',
    },
  });

  const handleClose = () => {
    reset();
    closeCheckInModal();
  };

  const onSubmit = async (data) => {
    if (!checkInTarget) return;
    await submitCheckIn(checkInTarget.id, data);
  };

  if (!checkInTarget) return null;

  return (
    <Modal
      isOpen={isCheckInModalOpen}
      onClose={handleClose}
      title="Front Desk Visitor Check-In"
      subtitle={`Visit Reference: ${checkInTarget.visitCode || 'VIS-2026'} • ${checkInTarget.title}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        {/* Delegation Summary Card */}
        <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <div className="flex items-center gap-1.5">
              {checkInTarget.guestCategory === 'ORGANIZATION' ? (
                <Building2 className="w-4 h-4 text-[#00adef]" />
              ) : (
                <User className="w-4 h-4 text-[#e38524]" />
              )}
              <span className="text-[#000000]">{checkInTarget.guestDisplayName || 'Guest Delegation'}</span>
            </div>
            <span className="font-mono text-[#00adef]">{checkInTarget.visitorCount || 1} Guest(s)</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-[#e38524] shrink-0" />
            <span>Assigned Room: <strong>{checkInTarget.locationRoom || 'Lobby / Floor Visit'}</strong></span>
          </div>
        </div>

        {/* Verified National ID / Passport */}
        <Input
          label="Government ID / Passport / Driver's License #"
          placeholder="e.g. EP2948194 or ET-ID-992144"
          icon={IdCard}
          helperText="Verified against physical ID at the security desk"
          {...register('verifiedIdNumber')}
        />

        {/* Custom / Auto Sequential Badge Number */}
        <Input
          label="Security Badge Code (Optional)"
          placeholder="Leave blank for auto-generated: COOPVYYYYMM0001"
          icon={ShieldCheck}
          helperText="System automatically generates sequential badge if left empty."
          {...register('customBadgeNumber')}
        />

        {/* Check-In Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
            Security Desk Screening Notes
          </label>
          <textarea
            rows="2"
            className="w-full text-xs rounded-xl border border-slate-300 p-3 text-slate-900 focus:outline-none focus:border-[#00adef]"
            {...register('checkInNotes')}
          />
        </div>

        {/* Buttons */}
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
            variant="cyan"
            className="w-1/2"
            icon={LogIn}
            isLoading={isSubmitting}
          >
            Confirm & Issue Badge
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CheckInModal;
