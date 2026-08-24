import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus, Shield, User, Mail, Phone, Lock, Building2 } from 'lucide-react';
import useUserStore from '../store/userStore';
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

const DEPARTMENTS = [
  'Digital Banking & Payments',
  'Corporate Banking',
  'FinTech PE & Open Banking',
  'Retail Banking',
  'Executive Office',
  'Information Security & Risk',
  'Operations & Security Desk',
];

const AVAILABLE_ROLES = [
  { id: 'ROLE_EMPLOYEE', label: 'Employee', desc: 'Standard staff member' },
  { id: 'ROLE_RELATIONSHIP_MANAGER', label: 'Relationship Manager', desc: 'Can create and host delegations' },
  { id: 'ROLE_APPROVER', label: 'Executive Approver', desc: 'Can approve or reject visit requests' },
  { id: 'ROLE_SECURITY_DESK', label: 'Security Desk', desc: 'Front desk check-in, badges, check-out' },
  { id: 'ROLE_EXECUTIVE', label: 'Bank Executive', desc: 'Full analytics and partner intelligence' },
  { id: 'ROLE_ADMIN', label: 'Administrator', desc: 'Full system & staff control' },
];

export const OnboardUserModal = () => {
  const { isOnboardModalOpen, closeOnboardModal, onboardUser } = useUserStore();

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
      department: DEPARTMENTS[0],
      jobTitle: 'Bank Officer',
      password: '',
      confirmPassword: '',
      roleNames: ['ROLE_EMPLOYEE'],
    },
  });

  const selectedRoles = watch('roleNames', ['ROLE_EMPLOYEE']);

  const handleRoleToggle = (roleId) => {
    if (selectedRoles.includes(roleId)) {
      if (selectedRoles.length > 1) {
        setValue(
          'roleNames',
          selectedRoles.filter((r) => r !== roleId)
        );
      }
    } else {
      setValue('roleNames', [...selectedRoles, roleId]);
    }
  };

  const handleClose = () => {
    reset();
    closeOnboardModal();
  };

  const onSubmit = async (data) => {
    await onboardUser(data);
  };

  return (
    <Modal
      isOpen={isOnboardModalOpen}
      onClose={handleClose}
      title="Onboard New Bank Staff Member"
      subtitle="Register user credentials, department assignment, and RBAC authorization roles."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        {/* Name Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name"
            placeholder="Chala"
            error={errors.firstName?.message}
            required
            {...register('firstName')}
          />
          <Input
            label="Last Name"
            placeholder="Tadesse"
            error={errors.lastName?.message}
            required
            {...register('lastName')}
          />
        </div>

        {/* Username & Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Staff Username (Login ID)"
            placeholder="chala_tadesse"
            sanitize="identifier"
            error={errors.username?.message}
            required
            {...register('username')}
          />
          <Input
            label="Official Bank Email"
            type="email"
            placeholder="chala.tadesse@coopbankoromia.com.et"
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
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Job Title"
            placeholder="Senior Relationship Manager"
            error={errors.jobTitle?.message}
            {...register('jobTitle')}
          />
        </div>

        {/* Password & Confirm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Initial Account Password"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            required
            {...register('password')}
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            required
            {...register('confirmPassword')}
          />
        </div>

        {/* Authorization Roles Selector */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
            Assigned Authorization Roles <span className="text-rose-500">*</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {AVAILABLE_ROLES.map((role) => {
              const isChecked = selectedRoles.includes(role.id);
              return (
                <label
                  key={role.id}
                  onClick={() => handleRoleToggle(role.id)}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-white border-[#00adef] text-[#000000] shadow-xs'
                      : 'bg-white/60 border-slate-200 text-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="mt-0.5 rounded text-[#00adef]"
                  />
                  <div>
                    <p className="text-xs font-bold">{role.label}</p>
                    <p className="text-[10px] text-slate-400">{role.desc}</p>
                  </div>
                </label>
              );
            })}
          </div>
          {errors.roleNames && (
            <p className="text-xs text-rose-500 mt-1">{errors.roleNames.message}</p>
          )}
        </div>

        {/* Action Buttons */}
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
            Onboard Staff Member
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default OnboardUserModal;
