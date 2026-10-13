import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import CoopLogo from '@/core/assets/CoopLogo';
import Input from '@/shared/components/ui/Input';
import Button from '@/shared/components/ui/Button';
import authApi from '../api/authApi';
import soundPlayer from '@/core/utils/soundPlayer';

const forgotSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(3, 'Please enter your username, email, or phone number'),
});

export const ForgotPasswordPage = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotSchema),
    defaultValues: { identifier: '' },
  });

  const onSubmit = async (data) => {
    setServerError(null);
    try {
      await authApi.forgotPassword(data.identifier);
      soundPlayer.playNotificationChime();
      setIsSuccess(true);
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
          'Failed to send password reset link. Please verify your credentials.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-[#00adef]/20">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 text-left space-y-6 animate-fadeIn">
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center space-y-2">
          <CoopLogo className="w-12 h-12" subtext="VISIT HUB" />
          <h1 className="font-heading font-black text-2xl text-[#000000] tracking-tight">
            Reset Account Password
          </h1>
          <p className="text-xs text-slate-500 max-w-xs">
            Enter your corporate email or system username to receive a secure password reset link.
          </p>
        </div>

        {isSuccess ? (
          <div className="p-6 rounded-2xl bg-sky-50/80 border border-sky-200 text-center space-y-4 animate-fadeIn">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-[#00adef] flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-[#000000]">
                Password Reset Link Dispatched
              </h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                If an account matches your information, a single-use 15-minute reset token has been sent to your registered inbox.
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00adef] hover:text-[#e38524] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <Input
              label="Corporate Email, Username, or Phone"
              placeholder="e.g. dalemu@coopbank.com.et"
              icon={Mail}
              error={errors.identifier?.message}
              required
              {...register('identifier')}
            />

            <Button
              type="submit"
              variant="orange"
              size="lg"
              className="w-full"
              icon={Send}
              isLoading={isSubmitting}
            >
              Send Reset Link
            </Button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#00adef] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
