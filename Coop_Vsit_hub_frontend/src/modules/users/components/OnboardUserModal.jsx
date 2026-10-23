import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  UserPlus,
  Shield,
  User,
  Mail,
  Phone,
  Lock,
  Building2,
  Search,
  Loader2,
  CheckCircle2,
  Sparkles,
  X,
  KeyRound,
  Check,
  Briefcase,
  AlertCircle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import useUserStore from '../store/userStore';
import useMasterDataStore from '@/modules/master_data/store/masterDataStore';
import userApi from '../api/userApi';
import Modal from '@/shared/components/ui/Modal';
import Input from '@/shared/components/ui/Input';
import Button from '@/shared/components/ui/Button';
import { toast } from 'sonner';

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
  .refine(
    (data) => {
      // If user is authenticated via AD, password is not required
      if (data.isAdUser) return true;
      if (!data.password || data.password.length < 8) return false;
      if (!/[A-Z]/.test(data.password)) return false;
      if (!/[0-9]/.test(data.password)) return false;
      if (!/[@$!%*?&#]/.test(data.password)) return false;
      return true;
    },
    {
      message:
        'Password must be at least 8 characters with 1 uppercase, 1 number, and 1 special character',
      path: ['password'],
    }
  )
  .refine(
    (data) => {
      if (data.isAdUser) return true;
      return data.password === data.confirmPassword;
    },
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }
  );

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
    id: 'ROLE_APPROVER',
    label: 'Executive Approver',
    desc: 'Authorizes, approves, or rejects visit requests',
  },
  {
    id: 'ROLE_SECURITY_DESK',
    label: 'Front Desk Reception',
    desc: 'Visitor check-in, ID verification, badge issuance (COOPV), check-out',
  },
];

export const OnboardUserModal = () => {
  const { isOnboardModalOpen, closeOnboardModal, onboardUser } = useUserStore();
  const { departments, fetchAllMasterData } = useMasterDataStore();

  // Active Directory Live Search & Autocomplete state
  const [adSuggestions, setAdSuggestions] = useState([]);
  const [isSearchingAd, setIsSearchingAd] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedAdStaff, setSelectedAdStaff] = useState(null);
  const [isLookingUpUsername, setIsLookingUpUsername] = useState(false);

  const searchDebounceRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (isOnboardModalOpen) {
      fetchAllMasterData();
    }
  }, [isOnboardModalOpen, fetchAllMasterData]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    clearErrors,
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

  const selectedRoles = watch('roleNames', []);
  const isAdUser = watch('isAdUser', false);
  const currentEmail = watch('email', '');
  const currentUsername = watch('username', '');

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle live search as the user types in the email field
  const handleEmailInputChange = (e) => {
    const value = e.target.value;
    setValue('email', value, { shouldValidate: true });

    // If an AD user was previously selected, typing will disconnect AD link unless re-selected
    if (selectedAdStaff && selectedAdStaff.email !== value) {
      setSelectedAdStaff(null);
      setValue('isAdUser', false);
    }

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    const trimmed = value.trim();
    if (trimmed.length >= 2) {
      setIsSearchingAd(true);
      setIsDropdownOpen(true);

      searchDebounceRef.current = setTimeout(async () => {
        try {
          const results = await userApi.searchAdUsers(trimmed, 8);
          setAdSuggestions(Array.isArray(results) ? results : []);
        } catch (err) {
          console.warn('AD live search error:', err);
          setAdSuggestions([]);
        } finally {
          setIsSearchingAd(false);
        }
      }, 250);
    } else {
      setAdSuggestions([]);
      setIsDropdownOpen(false);
      setIsSearchingAd(false);
    }
  };

  // Populate all spaces when choosing an AD user
  const handleSelectAdUser = (staff) => {
    setSelectedAdStaff(staff);
    setValue('isAdUser', true);

    // Populate all spaces (form inputs) from AD profile
    setValue('username', staff.username || '', { shouldValidate: true });
    setValue('email', staff.email || '', { shouldValidate: true });
    setValue('firstName', staff.firstName || '', { shouldValidate: true });
    setValue('lastName', staff.lastName || '', { shouldValidate: true });
    setValue('jobTitle', staff.jobTitle || staff.title || '', { shouldValidate: true });
    setValue('phone', staff.phoneNumber || staff.phone || '', { shouldValidate: true });

    // Match or set department
    if (staff.department) {
      const match = departments.find(
        (d) => d.name.toLowerCase() === staff.department.toLowerCase()
      );
      if (match) {
        setValue('department', match.name, { shouldValidate: true });
      } else {
        setValue('department', staff.department, { shouldValidate: true });
      }
    }

    // Clear password values and errors for AD users
    setValue('password', '');
    setValue('confirmPassword', '');
    clearErrors(['password', 'confirmPassword', 'username', 'email', 'firstName', 'lastName']);

    setIsDropdownOpen(false);

    toast.success(
      `Loaded Active Directory profile for "${staff.displayName || staff.username}". Form spaces populated.`
    );

    if (staff.existsInLocalDb) {
      toast.warning(
        `Staff member "${staff.username}" already has a registered account in Visit Hub.`
      );
    }
  };

  // Lookup by System Username directly
  const handleLookupUsername = async () => {
    if (!currentUsername || currentUsername.trim().length < 2) {
      toast.error('Please enter a username to look up in Active Directory.');
      return;
    }

    setIsLookingUpUsername(true);
    try {
      const res = await userApi.lookupAdUser(currentUsername.trim());
      if (res && res.found && res.staff) {
        handleSelectAdUser(res.staff);
      } else {
        toast.error(
          res?.message || `User "${currentUsername}" was not found in Active Directory.`
        );
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || 'Failed to connect to Active Directory.';
      toast.error(errorMsg);
    } finally {
      setIsLookingUpUsername(false);
    }
  };

  // Unlink AD Profile and return to manual user creation
  const handleUnlinkAd = () => {
    setSelectedAdStaff(null);
    setValue('isAdUser', false);
    toast.info('Switched to manual local user registration. Passwords are now required.');
  };

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
    setSelectedAdStaff(null);
    setAdSuggestions([]);
    setIsDropdownOpen(false);
    closeOnboardModal();
  };

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      isAdUser: Boolean(isAdUser),
      roles: data.roleNames,
      roleNames: data.roleNames,
      phoneNumber: data.phone,
    };

    const result = await onboardUser(payload);
    if (result && result.success) {
      handleClose();
    }
  };

  return (
    <Modal
      isOpen={isOnboardModalOpen}
      onClose={handleClose}
      title="Onboard New Staff Member"
      subtitle="Register a CoopBank staff member with role-based system access."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        {/* Active Directory Linked Badge Banner */}
        {selectedAdStaff && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-50 via-emerald-50/60 to-white border border-sky-200/90 shadow-xs flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-[#00adef] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                AD
              </div>
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-900 truncate">
                    {selectedAdStaff.displayName || selectedAdStaff.username}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    AD Verified
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 truncate">
                  Authenticates via Bank Active Directory. Password fields bypassed.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleUnlinkAd}
              className="text-xs font-semibold text-slate-500 hover:text-rose-600 px-2.5 py-1 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all shrink-0 cursor-pointer"
            >
              Unlink AD
            </button>
          </div>
        )}

        {/* Corporate Email with Live Search Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
              Corporate Email Address <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] font-semibold text-[#00adef] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#f58220]" />
              Live Active Directory search
            </span>
          </div>

          <div className="relative rounded-xl shadow-xs">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-4 h-4" />
            </div>

            <input
              type="email"
              placeholder="Search by name, email, or username (e.g. dawit / dalemu@coopbank.com.et)"
              value={currentEmail}
              onChange={handleEmailInputChange}
              onFocus={() => {
                if (adSuggestions.length > 0) setIsDropdownOpen(true);
              }}
              className={`w-full text-sm rounded-xl border pl-10 pr-10 py-2.5 transition-all duration-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                errors.email
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 ring-1 ring-rose-500'
                  : 'border-slate-300 hover:border-slate-400 focus:border-[#00adef] focus:ring-[#00adef]/25'
              }`}
            />

            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
              {isSearchingAd ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#00adef]" />
              ) : currentEmail.length >= 2 ? (
                <Search className="w-4 h-4 text-slate-400" />
              ) : null}
            </div>
          </div>

          {errors.email && (
            <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.email.message}
            </p>
          )}

          {/* Floating Dropdown Autocomplete Menu */}
          {isDropdownOpen && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden divide-y divide-slate-100 animate-fadeIn max-h-72 overflow-y-auto">
              <div className="px-3 py-2 bg-slate-50/80 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#00adef]" />
                  CoopBank Active Directory Results
                </span>
                <span>{adSuggestions.length} found</span>
              </div>

              {isSearchingAd ? (
                <div className="p-6 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-[#00adef]" />
                  <span className="text-xs font-medium">Searching Active Directory...</span>
                </div>
              ) : adSuggestions.length > 0 ? (
                adSuggestions.map((staff) => {
                  const initials = `${(staff.firstName || 'C')[0]}${(staff.lastName || 'B')[0]}`.toUpperCase();
                  const isCurrentSelected = selectedAdStaff?.username === staff.username;

                  return (
                    <div
                      key={staff.username}
                      onClick={() => handleSelectAdUser(staff)}
                      className={`p-3 text-left flex items-center justify-between gap-3 cursor-pointer transition-all hover:bg-sky-50/70 ${
                        isCurrentSelected ? 'bg-sky-50/90 border-l-4 border-[#00adef]' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00adef] to-[#0081b8] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                          {initials}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {staff.displayName || `${staff.firstName} ${staff.lastName}`}
                            </span>
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                              @{staff.username}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 truncate">
                            {staff.email}
                          </p>

                          {(staff.department || staff.jobTitle) && (
                            <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                              <Building2 className="w-2.5 h-2.5" />
                              {staff.department || 'CoopBank Staff'}
                              {staff.jobTitle ? ` • ${staff.jobTitle}` : ''}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        {staff.existsInLocalDb ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Already in Hub
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <Check className="w-2.5 h-2.5" />
                            Select
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  <p className="font-semibold text-slate-700">No staff found matching "{currentEmail}"</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    You can type the email address manually to onboard a local system user.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Username & Fetch Button */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="w-full text-left">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
                System Username <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleLookupUsername}
                disabled={isLookingUpUsername || !currentUsername}
                className="text-[10px] font-bold text-[#00adef] hover:text-[#0081b8] disabled:text-slate-400 flex items-center gap-1 cursor-pointer transition-colors"
                title="Search Active Directory using this username"
              >
                {isLookingUpUsername ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                Fetch from AD
              </button>
            </div>

            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="dalemu"
                {...register('username')}
                className={`w-full text-sm rounded-xl border pl-10 pr-3.5 py-2.5 transition-all duration-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                  errors.username
                    ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 ring-1 ring-rose-500'
                    : 'border-slate-300 hover:border-slate-400 focus:border-[#00adef] focus:ring-[#00adef]/25'
                }`}
              />
            </div>
            {errors.username && (
              <p className="text-xs text-rose-500 font-medium mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.username.message}
              </p>
            )}
          </div>

          {/* Phone Field */}
          <Input
            label="Phone Number"
            placeholder="+251911223344"
            icon={Phone}
            error={errors.phone?.message}
            {...register('phone')}
          />
        </div>

        {/* First & Last Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name"
            placeholder="Dawit"
            icon={User}
            error={errors.firstName?.message}
            required
            {...register('firstName')}
          />
          <Input
            label="Last Name"
            placeholder="Alemu"
            icon={User}
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
            <div className="relative rounded-xl shadow-xs">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Building2 className="w-4 h-4" />
              </div>
              <select
                className="w-full text-xs font-semibold pl-10 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#00adef] focus:ring-2 focus:ring-[#00adef]/25 transition-all"
                {...register('department')}
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
                {/* Fallback option if AD department isn't in master data list */}
                {watch('department') &&
                  !departments.some((d) => d.name === watch('department')) && (
                    <option value={watch('department')}>{watch('department')}</option>
                  )}
              </select>
            </div>
          </div>

          <Input
            label="Job Title / Position"
            placeholder="Senior Digital Peering Manager"
            icon={Briefcase}
            {...register('jobTitle')}
          />
        </div>

        {/* Password Fields OR AD Single Sign-on Card */}
        {isAdUser ? (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-left space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
              <Lock className="w-4 h-4 text-[#00adef]" />
              Active Directory Single Sign-On Enabled
            </div>
            <p className="text-xs text-slate-500">
              This staff member will log into Visit Hub using their existing CoopBank Active Directory Windows / Domain password.
              No local temporary password is required.
            </p>
          </div>
        ) : (
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
                    <p
                      className={`text-xs font-bold ${
                        isSelected ? 'text-[#00adef]' : 'text-slate-800'
                      }`}
                    >
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
          >
            Complete Onboarding
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default OnboardUserModal;
