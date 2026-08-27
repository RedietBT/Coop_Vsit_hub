import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Calendar,
  Building2,
  User,
  Users2,
  Clock,
  MapPin,
  FileText,
  DollarSign,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import useVisitStore from '../store/visitStore';
import useMasterDataStore from '@/modules/master_data/store/masterDataStore';
import { createVisitSchema } from '../schemas/visitSchemas';
import Modal from '@/shared/components/ui/Modal';
import Input from '@/shared/components/ui/Input';
import Button from '@/shared/components/ui/Button';

export const CreateVisitModal = () => {
  const {
    isCreateModalOpen,
    closeCreateModal,
    createVisit,
    organizations,
    individualGuests,
    fetchFormLookups,
  } = useVisitStore();

  const { departments, meetingRooms, fetchAllMasterData } = useMasterDataStore();

  const [step, setStep] = useState(1);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    if (isCreateModalOpen) {
      fetchFormLookups();
      fetchAllMasterData();
    }
  }, [isCreateModalOpen, fetchFormLookups, fetchAllMasterData]);

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
      locationRoom: '',
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
    // Clean up empty UUIDs and unassigned rooms to null
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
      locationRoom: data.locationRoom || null,
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
          ? 'Scheduling & Meeting Facility'
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
              step === 1
                ? 'bg-white text-[#000000] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            1. Delegation
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
              step === 2
                ? 'bg-white text-[#000000] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            2. Schedule & Room
          </button>
          <button
            type="button"
            onClick={() => setStep(3)}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
              step === 3
                ? 'bg-white text-[#000000] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            3. Objectives
          </button>
        </div>

        {/* STEP 1: Delegation Details */}
        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            {/* Title */}
            <Input
              label="Visit Delegation Title / Purpose"
              placeholder="e.g. Visa Inc. Core Peering Partnership Presentation"
              error={errors.title?.message}
              required
              {...register('title')}
            />

            {/* Requesting Department & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                  Requesting Department <span className="text-rose-500">*</span>
                </label>
                <select
                  className="w-full text-xs font-semibold py-2.5 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#00adef]"
                  {...register('requestingDepartment')}
                >
                  {departments.length > 0 ? (
                    departments.map((dept) => (
                      <option key={dept.id || dept.name} value={dept.name}>
                        {dept.name}
                      </option>
                    ))
                  ) : (
                    <option value="Digital Banking & Payments">Digital Banking & Payments</option>
                  )}
                </select>
                {errors.requestingDepartment && (
                  <p className="text-[11px] text-rose-500 mt-1 font-medium">
                    {errors.requestingDepartment.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                  Priority Urgency
                </label>
                <select
                  className="w-full text-xs font-semibold py-2.5 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#00adef]"
                  {...register('priorityLevel')}
                >
                  <option value="HIGH">🔥 High Priority</option>
                  <option value="CRITICAL">⚡ Critical / Executive Priority</option>
                  <option value="MEDIUM">Standard Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
              </div>
            </div>

            {/* Category Toggle: Organization vs Individual */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                Visiting Guest Classification <span className="text-rose-500">*</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setValue('guestCategory', 'ORGANIZATION')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    guestCategory === 'ORGANIZATION'
                      ? 'bg-white border-[#00adef] text-[#00adef] shadow-xs font-bold ring-2 ring-[#00adef]/20'
                      : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                  <div>
                    <p className="text-xs font-bold text-[#000000]">Partner Organization</p>
                    <p className="text-[10px] text-slate-400 font-normal">Corporate delegation / Enterprise</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setValue('guestCategory', 'INDIVIDUAL')}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                    guestCategory === 'INDIVIDUAL'
                      ? 'bg-white border-[#e38524] text-[#e38524] shadow-xs font-bold ring-2 ring-[#e38524]/20'
                      : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-white'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <div>
                    <p className="text-xs font-bold text-[#000000]">VIP Individual Guest</p>
                    <p className="text-[10px] text-slate-400 font-normal">Executive consultant / Dignitary</p>
                  </div>
                </button>
              </div>

              {/* Dynamic Select Lookup based on Category */}
              {guestCategory === 'ORGANIZATION' ? (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Select Registered Partner Organization
                  </label>
                  <select
                    className="w-full text-xs font-semibold py-2 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#00adef]"
                    {...register('guestOrganizationId')}
                  >
                    <option value="">-- Choose Partner Organization --</option>
                    {organizations.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name} ({org.category || 'Partner'})
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
              {/* Meeting Room (OPTIONAL) */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                    Meeting Location Room / Space
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Optional</span>
                </div>
                <select
                  className="w-full text-xs font-semibold py-2.5 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#00adef]"
                  {...register('locationRoom')}
                >
                  <option value="">-- No Room Assigned / To Be Decided --</option>
                  {meetingRooms.map((room) => (
                    <option key={room.id || room.name} value={room.name}>
                      {room.name} {room.capacity ? `(${room.capacity} seats)` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  You can leave this unassigned or select from available CoopBank meeting spaces.
                </p>
              </div>

              {/* Visitor Headcount */}
              <div className="sm:col-span-2">
                <Input
                  label="Expected Visitor Headcount"
                  type="number"
                  placeholder="3"
                  min="1"
                  error={errors.visitorCount?.message}
                  required
                  {...register('visitorCount', { valueAsNumber: true })}
                />
              </div>

              {/* Scheduled Start & End */}
              <Input
                label="Scheduled Start Date & Time"
                type="datetime-local"
                error={errors.scheduledStartTime?.message}
                required
                {...register('scheduledStartTime')}
              />

              <Input
                label="Scheduled End Date & Time"
                type="datetime-local"
                error={errors.scheduledEndTime?.message}
                required
                {...register('scheduledEndTime')}
              />
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

        {/* STEP 3: Objectives & Commercials */}
        {step === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                Primary Visit Objective & Agenda <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows="3"
                placeholder="Describe executive discussion points, MoU alignment, or product demo..."
                className="w-full text-xs rounded-xl border border-slate-300 p-3 text-slate-900 focus:outline-none focus:border-[#00adef]"
                {...register('visitObjective')}
              />
              {errors.visitObjective && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">
                  {errors.visitObjective.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Presentation Theme / Key Topic"
                placeholder="e.g. Visa Direct & Cross-Border Rails"
                {...register('presentationTheme')}
              />

              <Input
                label="Estimated Pipeline Opportunity Value ($ USD)"
                type="number"
                placeholder="e.g. 500000"
                {...register('opportunityValue', { valueAsNumber: true })}
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep(2)}
                icon={ArrowLeft}
                disabled={isSubmitting}
              >
                Back
              </Button>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setValue('isDraft', true);
                    handleSubmit(onSubmit)();
                  }}
                  disabled={isSubmitting}
                >
                  Save as Draft
                </Button>

                <Button
                  type="submit"
                  variant="orange"
                  icon={Sparkles}
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
