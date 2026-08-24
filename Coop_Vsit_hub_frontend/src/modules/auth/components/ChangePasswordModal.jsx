import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '@/shared/components/ui/Modal';
import Input from '@/shared/components/ui/Input';
import Button from '@/shared/components/ui/Button';
import { changePasswordSchema } from '../schemas/authSchemas';
import authApi from '../api/authApi';
import soundPlayer from '@/core/utils/soundPlayer';

export const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [serverError, setServerError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const newPasswordValue = watch('newPassword', '');

  // Password policy checklist checks
  const hasMinLength = newPasswordValue.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPasswordValue);
  const hasLowercase = /[a-z]/.test(newPasswordValue);
  const hasDigit = /[0-9]/.test(newPasswordValue);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPasswordValue);

  const onSubmit = async (data) => {
    setServerError(null);
    try {
      await authApi.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmNewPassword: data.confirmNewPassword,
      });

      setIsSuccess(true);
      soundPlayer.playNotificationChime();
      toast.success('Password changed successfully.');
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
          'Failed to change password. Please check your current password.'
      );
    }
  };

  const handleClose = () => {
    setIsSuccess(false);
    setServerError(null);
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Change Account Password"
      subtitle="Update your bank staff credentials to maintain enterprise security."
      maxWidth="max-w-md"
    >
      {isSuccess ? (
        <div className="text-center py-6 space-y-4 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <h4 className="font-heading font-black text-lg text-[#000000]">
              Password Updated Successfully
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-xs mx-auto">
              Your password has been changed. Other active sessions have been invalidated for security.
            </p>
          </div>

          <Button variant="orange" className="w-full mt-4" onClick={handleClose}>
            Done
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <Input
            label="Current Password"
            type="password"
            placeholder="••••••••••••"
            icon={Lock}
            error={errors.currentPassword?.message}
            required
            {...register('currentPassword')}
          />

          <Input
            label="New Password"
            type="password"
            placeholder="••••••••••••"
            icon={Lock}
            error={errors.newPassword?.message}
            required
            {...register('newPassword')}
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••••••"
            icon={Lock}
            error={errors.confirmNewPassword?.message}
            required
            {...register('confirmNewPassword')}
          />

          {/* Password Security Rules Checklist */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-left">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <ShieldCheck className="w-4 h-4 text-[#00adef]" />
              <span>Password Security Standards:</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600">
              <span className={hasMinLength ? 'text-emerald-600 font-semibold' : ''}>
                {hasMinLength ? '✓' : '•'} At least 8 chars
              </span>
              <span className={hasUppercase ? 'text-emerald-600 font-semibold' : ''}>
                {hasUppercase ? '✓' : '•'} 1 Uppercase letter
              </span>
              <span className={hasLowercase ? 'text-emerald-600 font-semibold' : ''}>
                {hasLowercase ? '✓' : '•'} 1 Lowercase letter
              </span>
              <span className={hasDigit ? 'text-emerald-600 font-semibold' : ''}>
                {hasDigit ? '✓' : '•'} 1 Number
              </span>
              <span className={hasSpecial ? 'text-emerald-600 font-semibold' : ''}>
                {hasSpecial ? '✓' : '•'} 1 Special symbol
              </span>
            </div>
          </div>

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
              variant="orange"
              className="w-1/2"
              isLoading={isSubmitting}
            >
              Update Password
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default ChangePasswordModal;
