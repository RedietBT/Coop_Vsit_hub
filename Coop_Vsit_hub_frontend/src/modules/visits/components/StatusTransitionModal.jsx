import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import useVisitStore from '../store/visitStore';
import { statusTransitionSchema } from '../schemas/visitSchemas';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';

export const StatusTransitionModal = () => {
  const {
    isStatusModalOpen,
    closeStatusModal,
    statusTransitionTarget,
    transitionStatus,
  } = useVisitStore();

  const visit = statusTransitionTarget?.visit;
  const initialAction = statusTransitionTarget?.action || 'APPROVED';

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(statusTransitionSchema),
    defaultValues: {
      targetStatus: initialAction,
      approverComments: '',
    },
  });

  React.useEffect(() => {
    if (statusTransitionTarget?.action) {
      setValue('targetStatus', statusTransitionTarget.action);
    }
  }, [statusTransitionTarget, setValue]);

  const targetStatus = watch('targetStatus', initialAction);

  const handleClose = () => {
    reset();
    closeStatusModal();
  };

  const onSubmit = async (data) => {
    if (!visit) return;
    await transitionStatus(visit.id, data.targetStatus, data.approverComments);
  };

  return (
    <Modal
      isOpen={isStatusModalOpen}
      onClose={handleClose}
      title="Executive Approver Decision"
      subtitle={`Visit Reference: ${visit?.visitCode || ''} • ${visit?.title || ''}`}
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        {/* Status Selection Buttons */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
            Target Decision Status <span className="text-rose-500">*</span>
          </label>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setValue('targetStatus', 'APPROVED')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                targetStatus === 'APPROVED'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20 font-bold'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span className="text-[11px]">Approve</span>
            </button>

            <button
              type="button"
              onClick={() => setValue('targetStatus', 'UNDER_REVIEW')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                targetStatus === 'UNDER_REVIEW'
                  ? 'bg-sky-50 border-[#00adef] text-[#00adef] ring-2 ring-sky-500/20 font-bold'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <Clock className="w-5 h-5 text-[#00adef]" />
              <span className="text-[11px]">Under Review</span>
            </button>

            <button
              type="button"
              onClick={() => setValue('targetStatus', 'REJECTED')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                targetStatus === 'REJECTED'
                  ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20 font-bold'
                  : 'bg-white border-slate-200 text-slate-600'
              }`}
            >
              <XCircle className="w-5 h-5 text-rose-600" />
              <span className="text-[11px]">Reject</span>
            </button>
          </div>
        </div>

        {/* Mandatory Approver Decision Feedback */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
            Approver Decision Feedback / Notes <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows="3"
            placeholder={
              targetStatus === 'APPROVED'
                ? 'e.g. Approved for Executive Boardroom presentation. Room setup and catering dispatched.'
                : 'e.g. Rejected due to scheduling conflict with board meeting. Please resubmit for next Tuesday.'
            }
            className="w-full text-xs rounded-xl border border-slate-300 p-3 text-slate-900 focus:outline-none focus:border-[#00adef]"
            {...register('approverComments')}
          />
          {errors.approverComments && (
            <p className="text-xs text-rose-500 mt-1">{errors.approverComments.message}</p>
          )}
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
            variant={targetStatus === 'APPROVED' ? 'orange' : targetStatus === 'REJECTED' ? 'danger' : 'cyan'}
            className="w-1/2"
            isLoading={isSubmitting}
          >
            Confirm Decision
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default StatusTransitionModal;
