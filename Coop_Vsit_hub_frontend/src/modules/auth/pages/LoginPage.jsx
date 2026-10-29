import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { User, Lock, ArrowRight, AlertCircle, Building2, ShieldCheck, KeyRound } from 'lucide-react';
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

  const [mode, setMode] = useState('STAFF'); // 'STAFF' | 'ADMIN'
  const [enteredPassword, setEnteredPassword] = useState('');
  const [showFirstTimeModal, setShowFirstTimeModal] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
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
    const loginType = mode === 'ADMIN' ? 'LOCAL' : 'ACTIVE_DIRECTORY';
    const result = await login(data.identifier, data.password, loginType);

    if (result.success) {
      if (result.user?.mustChangePassword) {
        setShowFirstTimeModal(true);
        return;
      }

      soundPlayer.playNotificationChime();
      toast.success(`Welcome back, ${result.user?.firstName || result.user?.username || 'User'}!`);
      
      const roles = Array.isArray(result.user?.roles) ? result.user.roles : [];
      const checkRole = (target) =>
        roles.some((r) => {
          const name = typeof r === 'string' ? r : r?.name;
          return name === target || name === `ROLE_${target}`;
        });
      const isAdmin = checkRole('ADMIN');
      const isSecurity = checkRole('SECURITY_DESK');
      const isDirector = checkRole('DIRECTOR');
      const isSecretary = checkRole('SECRETARY');
      
      let defaultDestination = '/my-tracking';
      if (isAdmin) {
        defaultDestination = '/dashboard';
      } else if (isDirector) {
        defaultDestination = '/my-tracking';
      } else if (isSecretary) {
        defaultDestination = '/bookings';
      } else if (isSecurity) {
        defaultDestination = '/security-desk';
      }

      const from = location.state?.from?.pathname || defaultDestination;
      navigate(from, { replace: true });
    } else {
      soundPlayer.playNotificationChime();
      if (result.status === 429 || (result.error && result.error.toLowerCase().includes('locked'))) {
        toast.error('Account temporarily locked due to 3 failed attempts (15 minutes).');
      } else {
        toast.error(result.error || 'Invalid credentials.');
      }
    }
  };

  const handleFirstTimeSuccess = () => {
    setShowFirstTimeModal(false);
    navigate('/visits/calendar', { replace: true });
  };

  const isLockedOut = lockoutUntil && lockoutUntil > Date.now();

  // Top-Right Corner Action Button (outside of the form card)
  const renderTopRightAction = () => {
    if (mode === 'ADMIN') {
      return (
        <button
          type="button"
          onClick={() => {
            setMode('STAFF');
            clearError();
            reset();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-[#00adef] hover:shadow-md text-slate-700 text-xs font-bold transition-all cursor-pointer"
        >
          <Building2 className="w-4 h-4 text-[#00adef]" />
          <span>Switch to Staff Portal</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={() => {
          setMode('ADMIN');
          clearError();
          reset();
        }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-[#e38524] hover:shadow-md text-slate-700 text-xs font-bold transition-all cursor-pointer"
      >
        <KeyRound className="w-4 h-4 text-[#e38524]" />
        <span>Admin Sign In</span>
      </button>
    );
  };

  // Titles and Subtitles per mode
  const getHeaderInfo = () => {
    if (mode === 'ADMIN') {
      return {
        title: "System Administrator Login",
        subtitle: "Elevated security portal for system administration, user roles, and audit logs.",
      };
    }
    return {
      title: "Staff & Reception Login",
      subtitle: "Sign in with your CoopBank credentials to book rooms and manage visits.",
    };
  };

  const { title, subtitle } = getHeaderInfo();

  return (
    <AuthLayout
      title={title}
      subtitle={subtitle}
      topRightAction={renderTopRightAction()}
    >
      <div>
        {/* Mode Selector Tabs */}
        <div className="flex rounded-2xl bg-slate-100 p-1 mb-5 border border-slate-200/80">
          <button
            type="button"
            onClick={() => {
              setMode('STAFF');
              clearError();
              reset();
            }}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'STAFF'
                ? 'bg-white text-[#00adef] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Staff & Reception</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('ADMIN');
              clearError();
              reset();
            }}
            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'ADMIN'
                ? 'bg-white text-[#e38524] shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Admin Portal</span>
          </button>
        </div>

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

          {/* Informational SSO / Local Banner */}
          {mode === 'STAFF' ? (
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-left flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#00adef] shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-blue-900">
                  Active Directory Single Sign-On
                </p>
                <p className="text-[10px] text-blue-700 leading-relaxed">
                  Use your bank username (e.g. <span className="font-mono font-bold">dalemu</span> or <span className="font-mono font-bold">staff_test</span>).
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl text-left flex items-start gap-2.5">
              <KeyRound className="w-4 h-4 text-[#e38524] shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] font-semibold text-amber-900">
                  Local Administrator Authentication
                </p>
                <p className="text-[10px] text-amber-700 leading-relaxed">
                  Enter administrative credentials (e.g. <span className="font-mono font-bold">admin</span>).
                </p>
              </div>
            </div>
          )}

          {/* Username / Email Field */}
          <Input
            label={mode === 'STAFF' ? "Staff AD Username or Email" : "Admin Username or Email"}
            name="identifier"
            placeholder={mode === 'STAFF' ? "e.g. dalemu or staff_test" : "e.g. admin"}
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

          {/* Submit Button */}
          <Button
            type="submit"
            variant={mode === 'STAFF' ? 'primary' : 'orange'}
            size="lg"
            className="w-full mt-2"
            isLoading={isLoading}
            disabled={isLockedOut}
            icon={ArrowRight}
            iconPosition="right"
          >
            {mode === 'STAFF' ? 'Sign In & Open Booking Calendar' : 'Sign In as System Admin'}
          </Button>
        </form>
      </div>

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
