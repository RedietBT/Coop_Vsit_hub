import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import AuthLayout from '@/core/layouts/AuthLayout';
import Input from '@/shared/components/ui/Input';
import Button from '@/shared/components/ui/Button';
import PasswordStrengthMeter from '@/shared/components/ui/PasswordStrengthMeter';
import { resetPasswordSchema } from '../schemas/authSchemas';
import authApi from '../api/authApi';
import soundPlayer from '@/core/utils/soundPlayer';

export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const [serverError, setServerError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPasswordValue = watch('newPassword', '');

  // Password Policy Checklist Checks
  const hasMinLength = newPasswordValue.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPasswordValue);
  const hasLowercase = /[a-z]/.test(newPasswordValue);
  const hasDigit = /[0-9]/.test(newPasswordValue);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPasswordValue);

  const onSubmit = async (data) => {
    setServerError(null);
    try {
      await authApi.resetPassword({
        token: data.token,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      setIsSuccess(true);
      soundPlayer.playNotificationChime();
      toast.success('Password updated successfully! You may now sign in.');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
          'Failed to reset password. The link may have expired or is invalid.'
      );
    }
  };

  return (
    <AuthLayout
      title="Create New Password"
      subtitle="Establish a new high-security password for your bank account."
    >
      {isSuccess ? (
        <div className="text-center py-6 space-y-4 animate-fadeIn">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div>
            <h3 className="font-heading font-black text-xl text-[#000000]">
              Password Changed!
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Your account password has been updated. Redirecting to sign in...
            </p>
          </div>

          <Link to="/login">
            <Button variant="orange" size="lg" className="w-full mt-4" icon={ArrowRight} iconPosition="right">
              Sign In Now
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {serverError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {serverError}
            </div>
          )}

          <input type="hidden" {...register('token')} />

          <Input
            label="New Password"
            name="newPassword"
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
            name="confirmPassword"
            type="password"
            placeholder="••••••••••••"
            icon={Lock}
            error={errors.confirmPassword?.message}
            required
            {...register('confirmPassword')}
          />

          <Button
            type="submit"
            variant="orange"
            size="lg"
            className="w-full"
            isLoading={isSubmitting}
          >
            Update Account Password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
};

export default ResetPasswordPage;
