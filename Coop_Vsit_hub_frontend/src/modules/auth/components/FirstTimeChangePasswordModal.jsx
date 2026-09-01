import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '@/shared/components/ui/Modal';
import Input from '@/shared/components/ui/Input';
import Button from '@/shared/components/ui/Button';
import PasswordStrengthMeter from '@/shared/components/ui/PasswordStrengthMeter';
import authApi from '../api/authApi';
import useAuthStore from '../store/authStore';
import soundPlayer from '@/core/utils/soundPlayer';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current temporary password is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .regex(/[@$!%*?&#]/, 'Must contain at least one special character (@$!%*?&#)'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });

export const FirstTimeChangePasswordModal = ({ isOpen, onSuccess, tempPassword = '' }) => {
  const [serverError, setServerError] = useState(null);
  const { user } = useAuthStore();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: tempPassword || '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPasswordValue = watch('newPassword', '');

  const hasMinLength = newPasswordValue.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPasswordValue);
  const hasLowercase = /[a-z]/.test(newPasswordValue);
  const hasDigit = /[0-9]/.test(newPasswordValue);
  const hasSpecial = /[@$!%*?&#]/.test(newPasswordValue);

  const onSubmit = async (data) => {
    setServerError(null);
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      soundPlayer.playNotificationChime();
      toast.success('Password updated successfully! Welcome to CoopBank Visit Hub.');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
          'Failed to change password. Please check your current password.'
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Mandatory: cannot dismiss without completing
      title="First-Time Login Security Setup"
      subtitle="For corporate compliance, please establish your personal account password."
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-left">
        {serverError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-[#e38524]" />
          <div>
            <p className="font-bold">Initial Setup Required</p>
            <p className="text-[11px] text-amber-800 mt-0.5">
              Welcome {user?.firstName || 'Staff Member'}! Please replace your temporary onboarding password with a secure personal password.
            </p>
          </div>
        </div>

        <Input
          label="Current Temporary Password"
          type="password"
          placeholder="••••••••••••"
          icon={Lock}
          error={errors.currentPassword?.message}
          required
          {...register('currentPassword')}
        />

        <Input
          label="New Personal Password"
          type="password"
          placeholder="••••••••••••"
          icon={Lock}
          error={errors.newPassword?.message}
          required
          {...register('newPassword')}
        />

        {/* Live password strength meter */}
        <PasswordStrengthMeter password={newPasswordValue} />

        <Input
          label="Confirm New Password"
          type="password"
          placeholder="••••••••••••"
          icon={Lock}
          error={errors.confirmPassword?.message}
          required
          {...register('confirmPassword')}
        />

        <div className="pt-2">
          <Button
            type="submit"
            variant="orange"
            size="lg"
            className="w-full"
            icon={ArrowRight}
            iconPosition="right"
            isLoading={isSubmitting}
          >
            Save Password & Continue
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default FirstTimeChangePasswordModal;
