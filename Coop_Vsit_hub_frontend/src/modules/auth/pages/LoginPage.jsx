import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { User, Lock, ArrowRight, AlertCircle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import AuthLayout from '@/core/layouts/AuthLayout';
import Input from '@/shared/components/ui/Input';
import Button from '@/shared/components/ui/Button';
import LockoutCountdown from '../components/LockoutCountdown';
import FirstTimeChangePasswordModal from '../components/FirstTimeChangePasswordModal';
import { loginSchema } from '../schemas/authSchemas';
import useAuthStore from '../store/authStore';
import soundPlayer from '@/core/utils/soundPlayer';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { login, isLoading, error, lockoutUntil, clearError } = useAuthStore();

  const [enteredPassword, setEnteredPassword] = useState('');
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(false);

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
    setEnteredPassword(data.password);
    const result = await login(data.identifier, data.password);

    if (result.success) {
      // Check if user must change password on first login
      if (result.user?.mustChangePassword) {
        setShowFirstTimeModal(true);
        return;
      }

      soundPlayer.playNotificationChime();
      toast.success(`Welcome back, ${result.user?.firstName || result.user?.username || 'User'}!`);
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } else {
      soundPlayer.playNotificationChime();
      if (result.status === 429 || (result.error && result.error.toLowerCase().includes('locked'))) {
        toast.error('Account temporarily locked due to 3 failed attempts (15 minutes).');
      } else {
        toast.error(result.error || 'Invalid username or password.');
      }
    }
  };

  const handleFirstTimeSuccess = () => {
    setShowFirstTimeModal(false);
    const from = location.state?.from?.pathname || '/dashboard';
    navigate(from, { replace: true });
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
            <Link
              to="/forgot-password"
              className="text-xs font-bold text-[#00adef] hover:text-[#e38524] hover:underline transition-all cursor-pointer"
            >
              Forgot Password?
            </Link>
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

      {/* Mandatory First-Time Password Change Modal */}
      <FirstTimeChangePasswordModal
        isOpen={showFirstTimeModal}
        tempPassword={enteredPassword}
        onSuccess={handleFirstTimeSuccess}
      />
    </AuthLayout>
  );
};

export default LoginPage;
