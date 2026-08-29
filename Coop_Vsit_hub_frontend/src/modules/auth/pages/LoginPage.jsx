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

  const [mode, setMode] = useState('LANDING'); // 'LANDING' | 'STAFF' | 'ADMIN'
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
      
      let defaultDestination = '/visits/calendar';
      if (isAdmin) {
        defaultDestination = '/dashboard';
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
            setMode('LANDING');
            clearError();
            reset();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-[#00adef] hover:shadow-md text-slate-700 text-xs font-bold transition-all cursor-pointer"
        >
          <Building2 className="w-4 h-4 text-[#00adef]" />
          <span>Staff & Reception Portal</span>
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
    if (mode === 'LANDING') {
      return {
        title: "Welcome to CoopBank Visit Hub",
        subtitle: "Enterprise room booking, executive visit scheduling, and reception portal.",
      };
    }
    if (mode === 'STAFF') {
      return {
        title: "Access Receptionist & Staff Portal",
        subtitle: "Sign in with your CoopBank credentials to book rooms and manage visits.",
      };
    }
    return {
      title: "System Administrator Login",
      subtitle: "Elevated security portal for system administration, user roles, and audit logs.",
    };
  };

  const { title, subtitle } = getHeaderInfo();

  return (
    <AuthLayout
      title={title}
      subtitle={subtitle}
      topRightAction={renderTopRightAction()}
    >
      {/* 1. LANDING PORTAL VIEW */}
      {mode === 'LANDING' && (
        <div className="space-y-6 text-left">
          {/* Main Action Card */}
          <div
            onClick={() => {
              setMode('STAFF');
              clearError();
            }}
            className="p-6 rounded-3xl bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-white border-2 border-sky-500/30 hover:border-[#00adef] transition-all group shadow-xs hover:shadow-md cursor-pointer text-left"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#00adef] text-white flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-black text-lg text-slate-900 mb-1 group-hover:text-[#00adef] transition-colors">
              Access Receptionist & Staff Portal
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              Book a meeting room, reserve an executive visit, or check in guest delegations for CoopBank facilities.
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-sky-100">
              <span className="text-xs font-bold text-[#00adef] group-hover:underline">
                Sign In to Access Booking & Visits
              </span>
              <div className="w-8 h-8 rounded-full bg-[#00adef] text-white flex items-center justify-center group-hover:translate-x-1 transition-transform shadow-xs">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Quick SSO Security Note */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left flex items-start gap-3">
            <ShieldCheck className="w-4 h-4 text-[#00adef] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-800">Active Directory Single Sign-On</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                CoopBank employees and front-desk staff can sign in directly using their bank account credentials.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. STAFF LOGIN OR ADMIN LOGIN FORM */}
      {(mode === 'STAFF' || mode === 'ADMIN') && (
        <div>
          {/* Back Button */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <button
              type="button"
              onClick={() => {
                setMode('LANDING');
                clearError();
                reset();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <span>← Back to Portal Home</span>
            </button>
            <span className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">
              {mode === 'STAFF' ? 'Staff SSO' : 'Admin Auth'}
            </span>
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
      )}

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
