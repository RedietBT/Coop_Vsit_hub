import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Lock, ArrowRight, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import AuthLayout from '@/core/layouts/AuthLayout';
import Input from '@/shared/components/ui/Input';
import Button from '@/shared/components/ui/Button';
import LockoutCountdown from '../components/LockoutCountdown';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import { loginSchema } from '../schemas/authSchemas';
import useAuthStore from '../store/authStore';
import soundPlayer from '@/core/utils/soundPlayer';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showForgotModal, setShowForgotModal] = useState(false);

  const { login, isLoading, error, lockoutUntil, clearError } = useAuthStore();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  // Check if redirected from expired session or verification
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired')) {
      toast.error('Session expired. Please sign in again.');
    }
    if (params.get('verified')) {
      toast.success('Email verified successfully! You may now sign in.');
    }
  }, [location]);

  const onSubmit = async (data) => {
    clearError();
    const result = await login(data.identifier, data.password);

    if (result.success) {
      soundPlayer.playNotificationChime();
      toast.success(`Welcome back, ${result.user?.fullName || 'User'}!`);
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } else {
      soundPlayer.playNotificationChime();
      if (result.status === 429) {
        toast.error('Account temporarily locked due to 3 failed attempts.');
      } else {
        toast.error(result.error || 'Invalid credentials.');
      }
    }
  };

  // Demo Credentials Quick Fill
  const fillDemoAccount = (identifier, password) => {
    setValue('identifier', identifier, { shouldValidate: true });
    setValue('password', password, { shouldValidate: true });
    clearError();
  };

  const isLockedOut = lockoutUntil && lockoutUntil > Date.now();

  return (
    <AuthLayout
      title="Staff Portal Sign In"
      subtitle="Enter your credentials to access CoopBank DxValley Visit Hub."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Active Lockout Timer Banner */}
        {isLockedOut && (
          <LockoutCountdown
            lockoutUntil={lockoutUntil}
            onCountdownEnd={() => clearError()}
          />
        )}

        {/* Server Error Alert */}
        {!isLockedOut && error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 text-left animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Username / Email Field */}
        <Input
          label="Username or Corporate Email"
          name="identifier"
          placeholder="e.g. admin or username"
          icon={User}
          sanitize="identifier"
          disabled={isLoading || isLockedOut}
          error={errors.identifier?.message}
          required
          {...register('identifier')}
        />

        {/* Password Field */}
        <div className="space-y-1.5">
          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="••••••••••••"
            icon={Lock}
            sanitize={false}
            disabled={isLoading || isLockedOut}
            error={errors.password?.message}
            required
            {...register('password')}
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-xs font-semibold text-coop-navy dark:text-coop-gold hover:underline transition-all cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="gold"
          size="lg"
          className="w-full mt-2"
          isLoading={isLoading}
          disabled={isLockedOut}
          icon={ArrowRight}
          iconPosition="right"
        >
          Sign In to Portal
        </Button>

        {/* Quick-Fill QA Credentials Helper Chips */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-left">
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3 h-3 text-coop-gold" />
            <span>Demo Test Credentials</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('admin', 'ChangeMe@CoopBank2026!')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-coop-gold/20 hover:text-coop-navy border border-slate-200 transition-colors cursor-pointer"
            >
              👑 Admin (admin)
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('chala_tadesse', 'ChangeMe@CoopBank2026!')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-coop-gold/20 hover:text-coop-navy border border-slate-200 transition-colors cursor-pointer"
            >
              💼 RM (chala_tadesse)
            </button>
          </div>
        </div>

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-2">
          <ShieldCheck className="w-3.5 h-3.5 text-coop-gold" />
          <span>Protected by AES-256 JWT & 3-Attempt Rate Guard</span>
        </div>
      </form>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
      />
    </AuthLayout>
  );
};

export default LoginPage;
