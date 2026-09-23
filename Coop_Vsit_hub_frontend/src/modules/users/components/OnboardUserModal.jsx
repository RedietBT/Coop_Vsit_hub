import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  UserPlus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import useUserStore from '../store/userStore';
import useMasterDataStore from '@/modules/master_data/store/masterDataStore';
import Modal from '@/shared/components/ui/Modal';
import Input from '@/shared/components/ui/Input';
import Button from '@/shared/components/ui/Button';

const onboardSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username too long'),
    email: z.string().trim().email('Invalid email address format'),
    firstName: z.string().trim().min(2, 'First name required'),
    lastName: z.string().trim().min(2, 'Last name required'),
    phone: z.string().optional(),
    department: z.string().min(1, 'Department is required'),
    jobTitle: z.string().optional(),
    isAdUser: z.boolean().default(false),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
    roleNames: z.array(z.string()).min(1, 'Select at least one role'),
  })
  .superRefine((data, ctx) => {
    if (!data.isAdUser) {
      if (!data.password || data.password.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Temporary password is required',
          path: ['password'],
        });
      } else {
        if (data.password.length < 8) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Password must be at least 8 characters',
            path: ['password'],
          });
        }
        if (!/[A-Z]/.test(data.password)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Must contain at least one uppercase letter',
            path: ['password'],
          });
        }
        if (!/[0-9]/.test(data.password)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Must contain at least one number',
            path: ['password'],
          });
        }
        if (!/[@$!%*?&#]/.test(data.password)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Must contain at least one special character',
            path: ['password'],
          });
        }
      }

      if (!data.confirmPassword || data.confirmPassword.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Please confirm temporary password',
          path: ['confirmPassword'],
        });
      } else if (data.password !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Passwords do not match',
          path: ['confirmPassword'],
        });
      }
    }
  });

const AVAILABLE_ROLES = [
  {
    id: 'ROLE_ADMIN',
    label: 'System Administrator',
    desc: 'Full system control, master data, staff onboarding & analytics',
  },
  {
    id: 'ROLE_DIRECTOR',
    label: 'Executive Director',
    desc: 'Department or Executive Director with visit hosting, sign-off, and analytics oversight',
  },
  {
    id: 'ROLE_SECRETARY',
    label: 'Department Secretary',
    desc: 'Manages department meeting rooms, reservations, and visitor coordination',
  },
  {
    id: 'ROLE_RELATIONSHIP_MANAGER',
    label: 'Relationship Manager',
    desc: 'Creates & hosts delegation visits, manages corporate partners & VIPs',
  },
  {
    id: 'ROLE_FRONT_DESK',
    label: 'Front Desk Reception',
    desc: 'Visitor check-in, ID verification, badge issuance (COOPV), check-out',
  },
  {
    id: 'ROLE_SECURITY_DESK',
    label: 'Security Desk',
    desc: 'Security front desk visitor check-in, inspection, and perimeter control',
  },
];

export const OnboardUserModal = () => {
  const { isOnboardModalOpen, closeOnboardModal, onboardUser, lookupAdStaff } = useUserStore();
  const { departments, fetchDepartments } = useMasterDataStore();

  const [isLookingUp, setIsLookingUp] = useState(false);
  const [adLookupStatus, setAdLookupStatus] = useState(null);
  const [adDepartmentOption, setAdDepartmentOption] = useState(null);

  useEffect(() => {
    if (isOnboardModalOpen) {
      fetchDepartments(true);
    }
  }, [isOnboardModalOpen, fetchDepartments]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(onboardSchema),
    defaultValues: {
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      department: 'Digital Banking & Payments',
      jobTitle: '',
      isAdUser: false,
      password: '',
      confirmPassword: '',
      roleNames: ['ROLE_RELATIONSHIP_MANAGER'],
    },
  });

  const isAdUser = watch('isAdUser', false);
  const currentEmail = watch('email', '');
  const currentUsername = watch('username', '');
  const selectedRoles = watch('roleNames', []);

  const handleRoleToggle = (roleId) => {
    if (selectedRoles.includes(roleId)) {
      setValue(
        'roleNames',
        selectedRoles.filter((r) => r !== roleId)
      );
    } else {
      setValue('roleNames', [...selectedRoles, roleId]);
    }
  };

  const handleClose = () => {
    reset();
    setAdLookupStatus(null);
    setAdDepartmentOption(null);
    setIsLookingUp(false);
    closeOnboardModal();
  };

  const handleAdLookup = async (explicitQuery = null) => {
    const query = (
      typeof explicitQuery === 'string'
        ? explicitQuery
        : currentEmail || currentUsername || ''
    ).trim();

    if (!query) {
      setAdLookupStatus({
        found: false,
        message: 'Please enter a Corporate Email Address or Username to check in Active Directory.',
      });
      return;
    }

    setIsLookingUp(true);
    setAdLookupStatus(null);

    try {
      const response = await lookupAdStaff(query);

      if (response && response.found && response.staff) {
        const staff = response.staff;

        if (staff.firstName) setValue('firstName', staff.firstName, { shouldValidate: true });
        if (staff.lastName) setValue('lastName', staff.lastName, { shouldValidate: true });
        if (staff.username) setValue('username', staff.username, { shouldValidate: true });
        if (staff.email) setValue('email', staff.email, { shouldValidate: true });
        if (staff.title) setValue('jobTitle', staff.title, { shouldValidate: true });
        if (staff.phoneNumber || staff.phone) {
          setValue('phone', staff.phoneNumber || staff.phone, { shouldValidate: true });
        }
        if (staff.department) {
          setAdDepartmentOption(staff.department);
          setValue('department', staff.department, { shouldValidate: true });
        }

        setValue('isAdUser', true, { shouldValidate: true });
        setValue('password', '');
        setValue('confirmPassword', '');
        clearErrors(['password', 'confirmPassword']);

        setAdLookupStatus({
          found: true,
          existsInLocalDb: Boolean(response.existsInLocalDb),
          staff,
        });
      } else {
        setValue('isAdUser', false);
        setAdLookupStatus({
          found: false,
          existsInLocalDb: false,
          message:
            response?.message ||
            'Not found in AD. You can continue with standard manual onboarding.',
        });
      }
    } catch {
      setValue('isAdUser', false);
      setAdLookupStatus({
        found: false,
        existsInLocalDb: false,
        message: 'Not found in AD. You can continue with standard manual onboarding.',
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSwitchToManual = () => {
    setValue('isAdUser', false);
    setAdLookupStatus(null);
  };

  const onSubmit = async (data) => {
    const payload = {
      username: data.username.trim(),
      email: data.email.trim(),
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      department: data.department,
      roleNames: data.roleNames,
      isAdUser: Boolean(data.isAdUser),
    };

    if (data.phone) {
      payload.phone = data.phone.trim();
    }
    if (data.jobTitle) {
      payload.jobTitle = data.jobTitle.trim();
    }

    if (!data.isAdUser) {
      payload.password = data.password;
      payload.confirmPassword = data.confirmPassword;
    }

    const result = await onboardUser(payload);
    if (result?.success || result === true) {
      handleClose();
    }
  };

  return (
    <Modal
      isOpen={isOnboardModalOpen}
      onClose={handleClose}
      title="Onboard New Staff Member"
      subtitle="Register a CoopBank staff member with Active Directory sync and role-based access."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        {/* Username & Email with AD Lookup */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="System Username"
            placeholder="dalemu"
            error={errors.username?.message}
            required
            {...register('username')}
          />

          <div className="flex flex-col gap-1.5 text-left">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                Corporate Email Address <span className="text-rose-500 font-bold">*</span>
              </label>
              {isAdUser && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  AD Verified
                </span>
              )}
            </div>

            <div className="flex items-stretch gap-2">
              <div className="relative flex-1">
                <input
                  type="email"
                  placeholder="dalemu@coopbankoromiasc.com"
                  className={`w-full text-sm rounded-xl border transition-all duration-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 pl-3.5 pr-3.5 py-2.5 ${
                    errors.email
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 ring-1 ring-rose-500'
                      : 'border-slate-300 hover:border-slate-400 focus:border-[#00adef] focus:ring-[#00adef]/25'
                  }`}
                  {...register('email')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAdLookup();
                    }
                  }}
                  onBlur={(e) => {
                    register('email').onBlur(e);
                    const val = e.target.value?.trim();
                    if (val && val.includes('@') && !isAdUser && !isLookingUp) {
                      handleAdLookup(val);
                    }
                  }}
                />
              </div>

              <Button
                type="button"
                variant="cyan"
                size="sm"
                onClick={() => handleAdLookup()}
                disabled={isLookingUp}
                isLoading={isLookingUp}
                className="shrink-0 px-3.5 py-2.5 font-bold text-xs"
                icon={isLookingUp ? null : Search}
              >
                {isLookingUp ? 'Checking...' : 'Check AD'}
              </Button>
            </div>

            {errors.email && (
              <div className="flex items-center gap-1 text-xs text-rose-600 font-medium animate-fadeIn">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.email.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Status Messages: User Not Found */}
        {adLookupStatus && !adLookupStatus.found && adLookupStatus.message && (
          <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 animate-fadeIn">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="font-medium">{adLookupStatus.message}</span>
          </div>
        )}

        {/* Status Messages: Already exists in Local DB */}
        {adLookupStatus?.existsInLocalDb && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2 animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">
                This staff member is already registered in the Visit Hub.
              </span>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
              Already Registered
            </span>
          </div>
        )}

        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name"
            placeholder="Dawit"
            error={errors.firstName?.message}
            required
            {...register('firstName')}
          />
          <Input
            label="Last Name"
            placeholder="Alemu"
            error={errors.lastName?.message}
            required
            {...register('lastName')}
          />
        </div>

        {/* Department & Job Title */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5">
              Department <span className="text-rose-500">*</span>
            </label>
            <select
              className="w-full text-xs font-semibold py-2.5 px-3.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#00adef]"
              {...register('department')}
            >
              {adDepartmentOption &&
                !departments.some((d) => (d.name || d) === adDepartmentOption) && (
                  <option value={adDepartmentOption}>{adDepartmentOption}</option>
                )}
              {departments.length > 0 ? (
                departments.map((d) => (
                  <option key={d.id || d.name} value={d.name}>
                    {d.name} {d.code ? `(${d.code})` : ''}
                  </option>
                ))
              ) : (
                <option value="Digital Banking & Payments">Digital Banking & Payments</option>
              )}
            </select>
          </div>

          <Input
            label="Job Title / Position"
            placeholder="Senior Digital Peering Manager"
            {...register('jobTitle')}
          />
        </div>

        {/* Conditional Password Section */}
        {isAdUser ? (
          /* Active Directory Verified Banner */
          <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-emerald-900 flex items-start justify-between gap-3 shadow-xs animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Active Directory Account Verified
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/60 text-emerald-800">
                    Password Bypassed
                  </span>
                </div>
                <p className="text-xs text-emerald-700 mt-1 font-medium leading-relaxed">
                  ✓ Active Directory Account Verified — Staff will authenticate using their official bank password.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSwitchToManual}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline shrink-0 cursor-pointer pt-0.5"
              title="Switch back to manual temporary password setup"
            >
              Manual entry
            </button>
          </div>
        ) : (
          /* Manual Temporary Password Fields */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Initial Temporary Password"
              type="password"
              placeholder="••••••••••••"
              error={errors.password?.message}
              required
              {...register('password')}
            />
            <Input
              label="Confirm Temporary Password"
              type="password"
              placeholder="••••••••••••"
              error={errors.confirmPassword?.message}
              required
              {...register('confirmPassword')}
            />
          </div>
        )}

        {/* Role Assignment Checkboxes */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              System Authorization Roles <span className="text-rose-500">*</span>
            </span>
            {errors.roleNames && (
              <span className="text-[11px] font-bold text-rose-500">
                {errors.roleNames.message}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {AVAILABLE_ROLES.map((role) => {
              const isSelected = selectedRoles.includes(role.id);
              return (
                <div
                  key={role.id}
                  onClick={() => handleRoleToggle(role.id)}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white border-[#00adef] shadow-xs ring-2 ring-[#00adef]/20'
                      : 'bg-white/80 border-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-bold ${isSelected ? 'text-[#00adef]' : 'text-slate-800'}`}>
                      {role.label}
                    </p>
                    <div
                      className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] font-bold ${
                        isSelected
                          ? 'bg-[#00adef] border-[#00adef] text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected ? '✓' : ''}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{role.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="orange"
            icon={UserPlus}
            isLoading={isSubmitting}
            disabled={isSubmitting || Boolean(adLookupStatus?.existsInLocalDb)}
          >
            Complete Onboarding
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default OnboardUserModal;
