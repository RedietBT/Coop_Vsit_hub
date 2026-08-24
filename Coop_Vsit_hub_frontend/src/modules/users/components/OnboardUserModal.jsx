import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Shield, User, Mail, Phone, Lock, Building2 } from 'lucide-react';
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
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .regex(/[@$!%*?&#]/, 'Must contain at least one special character'),
    confirmPassword: z.string(),
    roleNames: z.array(z.string()).min(1, 'Select at least one role'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const AVAILABLE_ROLES = [
  {
    id: 'ROLE_ADMIN',
    label: 'System Administrator',
    desc: 'Full system control, master data, staff onboarding & analytics',
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
      password: '',
      confirmPassword: '',
      roleNames: ['ROLE_RELATIONSHIP_MANAGER'],
    },
  });

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
    closeOnboardModal();
  };

  const onSubmit = async (data) => {
    const success = await onboardUser(data);
    if (success) {
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

        {/* Username & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="System Username"
            placeholder="dalemu"
            error={errors.username?.message}
            required
            {...register('username')}
          />
          <Input
            label="Corporate Email Address"
            type="email"
            placeholder="dalemu@coopbank.com.et"
            error={errors.email?.message}
            required
            {...register('email')}
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

          <Input
            label="Job Title / Position"
            placeholder="Senior Digital Peering Manager"
            {...register('jobTitle')}
          />
        </div>

        {/* Password Fields */}
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
          >
            Complete Onboarding
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default OnboardUserModal;
