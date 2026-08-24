import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Sparkles,
  Award,
  Crown,
  CheckCircle2,
  Layers,
  ShieldCheck,
  DoorOpen,
} from 'lucide-react';
import useVisitStore from '../store/visitStore';
import useMasterDataStore from '@/modules/master_data/store/masterDataStore';
import { createVisitSchema } from '../schemas/visitSchemas';
import Input from '@/shared/components/ui/Input';
import Button from '@/shared/components/ui/Button';

export const BookVisitPage = () => {
  const navigate = useNavigate();
  const {
    createVisit,
    organizations,
    individualGuests,
    fetchFormLookups,
  } = useVisitStore();

  const { departments, meetingRooms, fetchAllMasterData } = useMasterDataStore();

  const [step, setStep] = useState(1);
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    fetchFormLookups();
    fetchAllMasterData();
  }, [fetchFormLookups, fetchAllMasterData]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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

  const formValues = watch();
  const guestCategory = formValues.guestCategory;

  // Selected entities for live ticket preview
  const selectedOrg = organizations.find((o) => o.id === formValues.guestOrganizationId);
  const selectedGuest = individualGuests.find((g) => g.id === formValues.individualGuestId);

  const selectedGuestName =
    guestCategory === 'ORGANIZATION'
      ? selectedOrg?.name || 'Corporate Partner Entity'
      : selectedGuest?.fullName || 'VIP Individual Delegate';

  const onSubmit = async (data) => {
    setServerError(null);
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
    if (res.success) {
      navigate('/visits');
    } else {
      setServerError(res.error || 'Failed to submit visit request.');
    }
  };

  return (
    <div className="space-y-6 text-left animate-fadeIn max-w-6xl mx-auto pb-12">
      {/* Decorative Top Hero Banner */}
      <div className="relative overflow-hidden bg-linear-to-r from-[#00adef] via-[#0093cc] to-[#e38524] rounded-3xl p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Delegation Booking Studio</span>
            </div>
            <h1 className="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight">
              Schedule an Executive Visit
            </h1>
            <p className="text-xs sm:text-sm text-sky-100 mt-1 max-w-xl">
              Host strategic partners, government dignitaries, and enterprise peers with seamless front-desk coordination.
            </p>
          </div>

          <Button
            variant="black"
            size="sm"
            onClick={() => navigate('/visits')}
            icon={ArrowLeft}
            className="bg-white/15 hover:bg-white/25 text-white border-white/20"
          >
            Back to Visits
          </Button>
        </div>

        {/* Decorative background glow rings */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-orange-400/20 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Main Grid: Form wizard on left, Live Ticket preview on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: 3-Step Wizard Card */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
          {serverError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Stepper Navigation */}
          <div className="flex items-center justify-between gap-2 p-1.5 bg-slate-100/90 rounded-2xl">
            <button
              type="button"
              onClick={() => setStep(1)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
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
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                step === 2
                  ? 'bg-white text-[#000000] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              2. Schedule & Facility
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                step === 3
                  ? 'bg-white text-[#000000] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              3. Objectives
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* STEP 1: Delegation Details */}
            {step === 1 && (
              <div className="space-y-4 animate-fadeIn">
                <Input
                  label="Delegation Title / Purpose"
                  placeholder="e.g. Visa Inc. Core Peering Partnership Presentation"
                  error={errors.title?.message}
                  required
                  {...register('title')}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                      Requesting Department <span className="text-rose-500">*</span>
                    </label>
                    <select
                      className="w-full text-xs font-semibold py-2.5 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#00adef]"
                      {...register('requestingDepartment')}
                    >
                      {departments.map((dept) => (
                        <option key={dept.id || dept.name} value={dept.name}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                      Priority Level
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

                {/* Guest Category Toggle */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                    Visitor Entity Classification <span className="text-rose-500">*</span>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setValue('guestCategory', 'ORGANIZATION')}
                      className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                        guestCategory === 'ORGANIZATION'
                          ? 'bg-white border-[#00adef] text-[#00adef] shadow-xs font-bold ring-2 ring-[#00adef]/20'
                          : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-white'
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                      <div>
                        <p className="text-xs font-bold text-[#000000]">Partner Organization</p>
                        <p className="text-[10px] text-slate-400 font-normal">Corporate delegation</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setValue('guestCategory', 'INDIVIDUAL')}
                      className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                        guestCategory === 'INDIVIDUAL'
                          ? 'bg-white border-[#e38524] text-[#e38524] shadow-xs font-bold ring-2 ring-[#e38524]/20'
                          : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-white'
                      }`}
                    >
                      <User className="w-5 h-5" />
                      <div>
                        <p className="text-xs font-bold text-[#000000]">VIP Individual Guest</p>
                        <p className="text-[10px] text-slate-400 font-normal">Executive delegate</p>
                      </div>
                    </button>
                  </div>

                  {guestCategory === 'ORGANIZATION' ? (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Select Corporate Partner
                      </label>
                      <select
                        className="w-full text-xs font-semibold py-2.5 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#00adef]"
                        {...register('guestOrganizationId')}
                      >
                        <option value="">-- Choose Partner Organization --</option>
                        {organizations.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name} ({org.category || 'Strategic Partner'})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Select VIP Individual Guest
                      </label>
                      <select
                        className="w-full text-xs font-semibold py-2.5 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#e38524]"
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

            {/* STEP 2: Scheduling & Facility */}
            {step === 2 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Meeting Room (Optional) */}
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
                  </div>

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
                    Primary Visit Objective & Discussion Points <span className="text-rose-500">*</span>
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
                    label="Presentation Theme"
                    placeholder="e.g. Cross-Border Settlement Gateway"
                    {...register('presentationTheme')}
                  />

                  <Input
                    label="Pipeline Opportunity Valuation ($ USD)"
                    type="number"
                    placeholder="e.g. 750000"
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
                      Submit for Sign-Off
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* RIGHT COLUMN: Live Delegation Ticket Preview */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 space-y-5 text-left sticky top-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Live Delegation Ticket Preview
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-[#e38524] text-[10px] font-bold border border-amber-200">
              {formValues.priorityLevel || 'HIGH'} PRIORITY
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase">Delegation Title</p>
              <h3 className="font-heading font-black text-base text-[#000000] mt-0.5">
                {formValues.title || 'Untitled Delegation Visit'}
              </h3>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-2">
              <p className="text-[10px] text-[#00adef] font-bold uppercase">Guest / Organization</p>
              <p className="font-heading font-bold text-sm text-[#000000]">
                {selectedGuestName}
              </p>
              <p className="text-xs text-slate-500">
                Department: <span className="font-semibold text-slate-800">{formValues.requestingDepartment}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Facility Room</p>
                <p className="font-bold text-[#000000] mt-0.5 truncate">
                  {formValues.locationRoom || 'Unassigned (TBD)'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Headcount</p>
                <p className="font-bold text-[#000000] mt-0.5">
                  {formValues.visitorCount || 1} Delegates
                </p>
              </div>
            </div>

            {formValues.scheduledStartTime && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Scheduled Time</p>
                <p className="font-mono font-bold text-[#000000] mt-0.5">
                  {new Date(formValues.scheduledStartTime).toLocaleString()}
                </p>
              </div>
            )}

            {formValues.opportunityValue ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                <p className="text-[10px] text-emerald-800 font-bold uppercase">Pipeline Opportunity</p>
                <p className="font-heading font-black text-emerald-800 text-base mt-0.5">
                  ${Number(formValues.opportunityValue).toLocaleString()} USD
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookVisitPage;
