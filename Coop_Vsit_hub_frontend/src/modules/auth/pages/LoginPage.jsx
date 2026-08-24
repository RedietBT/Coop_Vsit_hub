import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Lock, ArrowRight, AlertCircle } from 'lucide-react';
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
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  // Check if redirected from expired session or email verification
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
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 text-left animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Username / Email Field */}
        <Input
          label="Username or Corporate Email"
          name="identifier"
          placeholder="e.g. admin or your username"
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
              className="text-xs font-bold text-[#00adef] hover:text-[#0093cc] hover:underline transition-all cursor-pointer"
            >
              Forgot Password?
            </button>
          </div>
        </div>

        {/* Submit Button in CoopBank Orange #e38524 */}
        <Button
          type="submit"
          variant="orange"
          size="lg"
          className="w-full mt-2"
          isLoading={isLoading}
          disabled={isLockedOut}
          icon={ArrowRight}
          iconPosition="right"
        >
          Sign In to Portal
        </Button>
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
