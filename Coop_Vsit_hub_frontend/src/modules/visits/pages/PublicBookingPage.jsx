import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import {
  Building2,
  User,
  Calendar,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Phone,
  Mail,
  FileText,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import CoopLogo from '@/core/assets/CoopLogo';
import Input from '@/shared/components/ui/Input';
import Button from '@/shared/components/ui/Button';
import apiClient from '@/core/api/apiClient';
import masterDataApi from '@/modules/master_data/api/masterDataApi';
import soundPlayer from '@/core/utils/soundPlayer';

const publicBookingSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters'),
    guestCategory: z.enum(['ORGANIZATION', 'INDIVIDUAL']),
    organizationName: z.string().optional(),
    contactPersonFirstName: z.string().trim().min(2, 'First name is required'),
    contactPersonMiddleName: z.string().optional(),
    contactPersonLastName: z.string().trim().min(2, 'Last name is required'),
    contactEmail: z.string().trim().email('Valid contact email is required'),
    contactPhone: z.string().trim().min(9, 'Valid phone number is required'),
    guestTitle: z.string().optional(),
    requestedDepartment: z.string().min(1, 'Please select a department'),
    visitorCount: z.number().min(1, 'At least 1 visitor required').default(1),
    preferredStartTime: z.string().min(1, 'Preferred start time is required'),
    preferredEndTime: z.string().min(1, 'Preferred end time is required'),
    visitObjective: z.string().trim().min(5, 'Please provide detailed visit objectives'),
    additionalNotes: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.guestCategory === 'ORGANIZATION' && !data.organizationName?.trim()) {
        return false;
      }
      return true;
    },
    {
      message: 'Organization entity name is required',
      path: ['organizationName'],
    }
  );

export const PublicBookingPage = () => {
  const [departments, setDepartments] = useState([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(publicBookingSchema),
    defaultValues: {
      title: '',
      guestCategory: 'ORGANIZATION',
      organizationName: '',
      contactPersonFirstName: '',
      contactPersonMiddleName: '',
      contactPersonLastName: '',
      contactEmail: '',
      contactPhone: '',
      guestTitle: 'Managing Director / Representative',
      requestedDepartment: 'Digital Banking & Payments',
      visitorCount: 2,
      preferredStartTime: '',
      preferredEndTime: '',
      visitObjective: '',
      additionalNotes: '',
    },
  });

  const guestCategory = watch('guestCategory', 'ORGANIZATION');

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const data = await masterDataApi.getDepartments(true);
        setDepartments(data);
      } catch (e) {
        console.warn('Failed to fetch departments:', e);
      }
    };
    loadDepartments();
  }, []);

  const onSubmit = async (data) => {
    setServerError(null);
    try {
      const payload = {
        ...data,
        preferredStartTime: new Date(data.preferredStartTime).toISOString(),
        preferredEndTime: new Date(data.preferredEndTime).toISOString(),
        visitorCount: Number(data.visitorCount) || 1,
      };

      const response = await apiClient.post('/api/v1/visits/public-booking', payload);
      soundPlayer.playNotificationChime();
      setConfirmationData(response.data);
      setIsSuccess(true);
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
          'Failed to submit visit request. Please check your information and try again.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-10 px-4 selection:bg-[#00adef]/20 text-left">
      <div className="w-full max-w-3xl bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden animate-fadeIn">
        {/* Brand Banner Header */}
        <div className="p-6 sm:p-8 bg-linear-to-r from-[#00adef] via-[#0093cc] to-[#e38524] text-white relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white text-[#00adef] flex items-center justify-center font-bold shadow-md">
                🏛️
              </div>
              <div>
                <h1 className="font-heading font-black text-xl sm:text-2xl text-white tracking-tight">
                  Cooperative Bank of Oromia
                </h1>
                <p className="text-xs text-sky-100 font-semibold">
                  DxValley Innovation & Executive Hub • Public Delegation Portal
                </p>
              </div>
            </div>

            <Link
              to="/login"
              className="text-xs font-bold text-white/90 hover:text-white bg-white/15 hover:bg-white/25 px-3.5 py-2 rounded-xl transition-colors shrink-0"
            >
              Staff Sign In
            </Link>
          </div>
        </div>

        {/* Content Body */}
        {isSuccess ? (
          <div className="p-8 sm:p-12 text-center space-y-5 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider border border-emerald-200">
                Request Submitted Successfully
              </span>
              <h2 className="font-heading font-black text-2xl text-[#000000] mt-3">
                Thank You for Your Request!
              </h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto mt-2 leading-relaxed">
                Your delegation booking request has been securely registered with CoopBank DxValley executive reception.
              </p>
            </div>

            {/* Confirmation Box */}
            <div className="max-w-md mx-auto p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Reference Tracking Code</span>
                <span className="font-mono font-black text-sm text-[#00adef]">
                  {confirmationData?.visitCode || 'VIS-2026'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Topic / Purpose</span>
                <span className="font-bold text-[#000000] truncate max-w-[200px]">
                  {confirmationData?.title || 'Delegation Visit'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Status</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[10px]">
                  UNDER REVIEW
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              A member of our relationship management team will review your request and contact you shortly.
            </p>

            <div className="pt-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-2xl bg-[#00adef] text-white font-bold text-xs hover:bg-[#0093cc] shadow-md transition-colors"
              >
                <span>Return to Home</span>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-5">
            {serverError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Visit Title */}
            <Input
              label="Visit Topic / Proposed Discussion Title"
              placeholder="e.g. Open Banking API Sandbox Peering & Merchant Settlements"
              error={errors.title?.message}
              required
              {...register('title')}
            />

            {/* Entity Classification Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                Are you representing a Corporate Entity or an Individual? <span className="text-rose-500">*</span>
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
                    <p className="text-xs font-bold text-[#000000]">Corporate Partner / Enterprise</p>
                    <p className="text-[10px] text-slate-400 font-normal">FinTech, Bank, Enterprise, NGO</p>
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
                    <p className="text-[10px] text-slate-400 font-normal">Consultant, Dignitary, Researcher</p>
                  </div>
                </button>
              </div>

              {guestCategory === 'ORGANIZATION' && (
                <Input
                  label="Company / Organization Entity Name"
                  placeholder="e.g. Visa Inc., Ethio Telecom, Chapa Technologies"
                  error={errors.organizationName?.message}
                  required
                  {...register('organizationName')}
                />
              )}
            </div>

            {/* Contact Person Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="First Name"
                placeholder="Nael"
                error={errors.contactPersonFirstName?.message}
                required
                {...register('contactPersonFirstName')}
              />
              <Input
                label="Middle Name"
                placeholder="Haile"
                {...register('contactPersonMiddleName')}
              />
              <Input
                label="Last Name"
                placeholder="Mariam"
                error={errors.contactPersonLastName?.message}
                required
                {...register('contactPersonLastName')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Official Email Address"
                type="email"
                placeholder="nael@organization.com"
                icon={Mail}
                error={errors.contactEmail?.message}
                required
                {...register('contactEmail')}
              />
              <Input
                label="Contact Phone Number"
                placeholder="+251 91 199 8877"
                icon={Phone}
                error={errors.contactPhone?.message}
                required
                {...register('contactPhone')}
              />
            </div>

            {/* Department & Headcount */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                  Requested CoopBank Host Department <span className="text-rose-500">*</span>
                </label>
                <select
                  className="w-full text-xs font-semibold py-2.5 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#00adef]"
                  {...register('requestedDepartment')}
                >
                  {departments.length > 0 ? (
                    departments.map((d) => (
                      <option key={d.id || d.name} value={d.name}>
                        {d.name}
                      </option>
                    ))
                  ) : (
                    <option value="Digital Banking & Payments">Digital Banking & Payments</option>
                  )}
                </select>
              </div>

              <div>
                <Input
                  label="Visitor Headcount"
                  type="number"
                  placeholder="3"
                  min="1"
                  error={errors.visitorCount?.message}
                  required
                  {...register('visitorCount', { valueAsNumber: true })}
                />
              </div>
            </div>

            {/* Preferred Start & End Date/Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Preferred Start Date & Time"
                type="datetime-local"
                error={errors.preferredStartTime?.message}
                required
                {...register('preferredStartTime')}
              />

              <Input
                label="Preferred End Date & Time"
                type="datetime-local"
                error={errors.preferredEndTime?.message}
                required
                {...register('preferredEndTime')}
              />
            </div>

            {/* Objective & Agenda */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                Purpose of Visit & Discussion Objectives <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows="3"
                placeholder="Explain the background, commercial peering, partnership demo, or regulatory discussion points..."
                className="w-full text-xs rounded-xl border border-slate-300 p-3 text-slate-900 focus:outline-none focus:border-[#00adef]"
                {...register('visitObjective')}
              />
              {errors.visitObjective && (
                <p className="text-[11px] text-rose-500 mt-1 font-medium">
                  {errors.visitObjective.message}
                </p>
              )}
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
                Special Requests & AV Equipment (Optional)
              </label>
              <textarea
                rows="2"
                placeholder="e.g. Requesting presentation screen and live API demo connectivity..."
                className="w-full text-xs rounded-xl border border-slate-300 p-3 text-slate-900 focus:outline-none focus:border-[#00adef]"
                {...register('additionalNotes')}
              />
            </div>

            <div className="pt-3">
              <Button
                type="submit"
                variant="orange"
                size="lg"
                className="w-full"
                icon={Send}
                isLoading={isSubmitting}
              >
                Submit Delegation Visit Request
              </Button>
            </div>
          </form>
        )}
      </div>

      <div className="text-center mt-6 text-slate-400 text-xs space-y-1">
        <p>© 2026 Cooperative Bank of Oromia • DxValley Executive Hub</p>
        <p>FinTech Innovation & Corporate Delegation Center</p>
      </div>
    </div>
  );
};

export default PublicBookingPage;
