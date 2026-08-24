import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Calendar,
  Building2,
  Users,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import useVisitStore from '../store/visitStore';
import { createVisitSchema } from '../schemas/visitSchemas';
import Modal from '@/shared/components/ui/Modal';
import Input from '@/shared/components/ui/Input';
import Button from '@/shared/components/ui/Button';

const MEETING_ROOMS = [
  'DxValley Executive Boardroom (4th Floor)',
  'DxValley FinTech Innovation Room A',
  'DxValley Strategic Peering Room B',
  'CoopBank HQ VIP Lounge (Ground Floor)',
  'Digital Transformation Studio',
];

const DEPARTMENTS = [
  'Digital Banking & Payments',
  'Corporate Banking',
  'FinTech PE & Open Banking',
  'Retail Banking',
  'Executive Office',
  'Information Security & Risk',
];

export const CreateVisitModal = () => {
  const {
    isCreateModalOpen,
    closeCreateModal,
    createVisit,
    organizations = [],
    individualGuests = [],
  } = useVisitStore();

  const [step, setStep] = useState(1); // 1 | 2 | 3
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createVisitSchema),
    defaultValues: {
      title: '',
      requestingDepartment: 'Digital Banking & Payments',
      visitType: 'EXTERNAL',
      priorityLevel: 'HIGH',
      guestCategory: 'ORGANIZATION',
      guestOrganizationId: '',
      individualGuestId: '',
      locationRoom: MEETING_ROOMS[0],
      visitorCount: 3,
      scheduledStartTime: '',
      scheduledEndTime: '',
      visitObjective: '',
      expectedOutcome: '',
      presentationTheme: '',
      opportunityValue: null,
      currency: 'USD',
      isDraft: false,
    },
  });

  const guestCategory = watch('guestCategory', 'ORGANIZATION');

  const handleClose = () => {
    setStep(1);
    setServerError(null);
    reset();
    closeCreateModal();
  };

  const onSubmit = async (data) => {
    setServerError(null);
    // Clean up empty UUIDs to null
    const payload = {
      ...data,
      guestOrganizationId:
        data.guestCategory === 'ORGANIZATION' && data.guestOrganizationId
          ? data.guestOrganizationId
          : null,
      individualGuestId:
        data.guestCategory === 'INDIVIDUAL' && data.individualGuestId
          ? data.individualGuestId
          : null,
      opportunityValue: data.opportunityValue ? Number(data.opportunityValue) : 0,
      visitorCount: Number(data.visitorCount) || 1,
    };

    const res = await createVisit(payload);
    if (!res.success) {
      setServerError(res.error || 'Failed to submit visit request.');
    }
  };

  return (
    <Modal
      isOpen={isCreateModalOpen}
      onClose={handleClose}
      title="Book Executive Visit Request"
      subtitle={`Step ${step} of 3 • ${
        step === 1
          ? 'Delegation & Partner Details'
          : step === 2
          ? 'Room Location & Smart Scheduling'
          : 'Strategic Objectives & Commercials'
      }`}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-left">
        {serverError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Step Indicator Progress Pills */}
        <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-100/90 rounded-2xl">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
              step === 1 ? 'bg-white text-[#000000] shadow-xs' : 'text-slate-500'
            }`}
          >
            1. Delegation
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
              step === 2 ? 'bg-white text-[#000000] shadow-xs' : 'text-slate-500'
            }`}
          >
            2. Schedule & Room
          </button>
          <button
            type="button"
            onClick={() => setStep(3)}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
              step === 3 ? 'bg-white text-[#000000] shadow-xs' : 'text-slate-500'
            }`}
          >
            3. Objectives
          </button>
        </div>

        {/* STEP 1: Delegation Basics */}
        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <Input
              label="Visit Title / Meeting Purpose"
              placeholder="e.g. Strategic API Peering Review with Ethio Telecom"
              error={errors.title?.message}
              required
              {...register('title')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Department */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                  Requesting Department <span className="text-rose-500">*</span>
                </label>
                <select
                  className="w-full text-xs font-semibold py-2.5 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#00adef]"
                  {...register('requestingDepartment')}
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                  Priority Level <span className="text-rose-500">*</span>
                </label>
                <select
                  className="w-full text-xs font-semibold py-2.5 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#00adef]"
                  {...register('priorityLevel')}
                >
                  <option value="CRITICAL">🔴 Critical (Executive VIP)</option>
                  <option value="HIGH">🟠 High Priority</option>
                  <option value="MEDIUM">🟡 Medium Priority</option>
                  <option value="LOW">⚪ Standard / Low</option>
                </select>
              </div>
            </div>

            {/* Guest Category Selector */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                Guest Delegation Category
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    guestCategory === 'ORGANIZATION'
                      ? 'bg-white border-[#00adef] text-[#000000] shadow-xs'
                      : 'bg-white/60 border-slate-200 text-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    value="ORGANIZATION"
                    className="text-[#00adef]"
                    {...register('guestCategory')}
                  />
                  <Building2 className="w-4 h-4 text-[#00adef]" />
                  <span className="text-xs font-bold">Partner Organization</span>
                </label>

                <label
                  className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                    guestCategory === 'INDIVIDUAL'
                      ? 'bg-white border-[#e38524] text-[#000000] shadow-xs'
                      : 'bg-white/60 border-slate-200 text-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    value="INDIVIDUAL"
                    className="text-[#e38524]"
                    {...register('guestCategory')}
                  />
                  <Users className="w-4 h-4 text-[#e38524]" />
                  <span className="text-xs font-bold">VIP Individual Delegate</span>
                </label>
              </div>

              {/* Dynamic Selector based on category */}
              {guestCategory === 'ORGANIZATION' ? (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Select Registered Corporate Partner
                  </label>
                  <select
                    className="w-full text-xs font-semibold py-2 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#00adef]"
                    {...register('guestOrganizationId')}
                  >
                    <option value="">-- Choose Corporate Organization --</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.industrySector || 'Enterprise'})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Select Registered VIP Individual Guest
                  </label>
                  <select
                    className="w-full text-xs font-semibold py-2 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#e38524]"
                    {...register('individualGuestId')}
                  >
                    <option value="">-- Choose Registered VIP Guest --</option>
                    {individualGuests.map((guest) => (
                      <option key={guest.id} value={guest.id}>
                        {guest.fullName} ({guest.titlePosition || 'VIP'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="orange"
                onClick={() => setStep(2)}
                icon={ArrowRight}
                iconPosition="right"
              >
                Continue to Scheduling
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Scheduling & Room */}
        {step === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Meeting Room */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                  Meeting Location Room <span className="text-rose-500">*</span>
                </label>
                <select
                  className="w-full text-xs font-semibold py-2.5 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#00adef]"
                  {...register('locationRoom')}
                >
                  {MEETING_ROOMS.map((room) => (
                    <option key={room} value={room}>
                      {room}
                    </option>
                  ))}
                </select>
              </div>

              {/* Visitor Count */}
              <div>
                <Input
                  label="Delegation Visitor Count"
                  type="number"
                  placeholder="3"
                  min="1"
                  error={errors.visitorCount?.message}
                  required
                  {...register('visitorCount', { valueAsNumber: true })}
                />
              </div>

              {/* Visit Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                  Visit Classification <span className="text-rose-500">*</span>
                </label>
                <select
                  className="w-full text-xs font-semibold py-2.5 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#00adef]"
                  {...register('visitType')}
                >
                  <option value="EXTERNAL">External Client Delegation</option>
                  <option value="VIP_DELEGATION">VIP / Executive Delegation</option>
                  <option value="INTERNAL">Internal Bank Review</option>
                </select>
              </div>

              {/* Start Date & Time */}
              <div>
                <Input
                  label="Scheduled Start Date & Time"
                  type="datetime-local"
                  error={errors.scheduledStartTime?.message}
                  required
                  {...register('scheduledStartTime')}
                />
              </div>

              {/* End Date & Time */}
              <div>
                <Input
                  label="Scheduled End Date & Time"
                  type="datetime-local"
                  error={errors.scheduledEndTime?.message}
                  required
                  {...register('scheduledEndTime')}
                />
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(1)}
                icon={ArrowLeft}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="orange"
                onClick={() => setStep(3)}
                icon={ArrowRight}
                iconPosition="right"
              >
                Continue to Objectives
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Strategic Outcomes & Commercials */}
        {step === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                Strategic Visit Objective <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows="3"
                placeholder="e.g. Strategic evaluation of Open Banking API endpoints, revenue share model, and regulatory compliance peering..."
                className="w-full text-xs rounded-xl border border-slate-300 p-3 text-slate-900 focus:outline-none focus:border-[#00adef]"
                {...register('visitObjective')}
              />
              {errors.visitObjective && (
                <p className="text-xs text-rose-500 mt-1">{errors.visitObjective.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Expected Outcome"
                placeholder="e.g. Signed MoU / API Access Agreement"
                error={errors.expectedOutcome?.message}
                {...register('expectedOutcome')}
              />

              <Input
                label="Presentation Theme"
                placeholder="e.g. Omnichannel Merchant Settlement Rails"
                error={errors.presentationTheme?.message}
                {...register('presentationTheme')}
              />
            </div>

            {/* Optional Opportunity Value */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-800">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Commercial Opportunity Value (Optional)</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Input
                    placeholder="e.g. 2500000"
                    type="number"
                    error={errors.opportunityValue?.message}
                    {...register('opportunityValue', { valueAsNumber: true })}
                  />
                </div>
                <div>
                  <select
                    className="w-full text-xs font-bold py-2.5 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#00adef]"
                    {...register('currency')}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="ETB">ETB (Br)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(2)}
                icon={ArrowLeft}
                disabled={isSubmitting}
              >
                Back
              </Button>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  variant="outline-orange"
                  onClick={() => setValue('isDraft', true)}
                  isLoading={isSubmitting}
                >
                  Save as Draft
                </Button>
                <Button
                  type="submit"
                  variant="orange"
                  onClick={() => setValue('isDraft', false)}
                  isLoading={isSubmitting}
                >
                  Submit for Approval
                </Button>
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

export default CreateVisitModal;
