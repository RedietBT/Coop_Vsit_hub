import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import Modal from '@/shared/components/ui/Modal';
import Input from '@/shared/components/ui/Input';
import Button from '@/shared/components/ui/Button';
import { forgotPasswordSchema } from '../schemas/authSchemas';
import authApi from '../api/authApi';
import soundPlayer from '@/core/utils/soundPlayer';

export const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data) => {
    setServerError(null);
    try {
      await authApi.forgotPassword(data.email);
      setIsSuccess(true);
      soundPlayer.playNotificationChime();
      toast.success('Password reset instructions sent to your corporate email.');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Failed to initiate password reset. Please contact system administrator.';
      setServerError(msg);
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
      title="Reset Account Password"
      subtitle="Enter your verified corporate email to receive a secure recovery link."
      maxWidth="max-w-md"
    >
      {isSuccess ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-lg text-slate-900 dark:text-white">
              Instructions Dispatched
            </h4>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-xs mx-auto">
              If an active account exists for that email, a password reset link has been dispatched to your inbox.
            </p>
          </div>

          <Button variant="navy" className="w-full mt-4" onClick={handleClose}>
            Back to Sign In
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {serverError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <Input
            label="Corporate Email Address"
            type="email"
            placeholder="e.g. name@coopbank.com.et"
            icon={Mail}
            error={errors.email?.message}
            required
            {...register('email')}
          />

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
              variant="gold"
              className="w-1/2"
              isLoading={isSubmitting}
            >
              Send Reset Link
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default ForgotPasswordModal;
