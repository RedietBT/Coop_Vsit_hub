import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import AuthLayout from '@/core/layouts/AuthLayout';
import Button from '@/shared/components/ui/Button';
import Spinner from '@/shared/components/ui/Spinner';
import authApi from '../api/authApi';
import soundPlayer from '@/core/utils/soundPlayer';

export const VerifyEmailPage = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const triggerVerification = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Missing or invalid verification token.');
        return;
      }

      try {
        const res = await authApi.verifyEmail(token);
        setStatus('success');
        setMessage(res.message || 'Your email address has been verified successfully!');
        soundPlayer.playNotificationChime();
      } catch (err) {
        setStatus('error');
        setMessage(
          err.response?.data?.message ||
            'The verification link has expired or has already been used.'
        );
      }
    };

    triggerVerification();
  }, [token]);

  return (
    <AuthLayout
      title="Corporate Email Verification"
      subtitle="Confirming your bank staff onboarding credentials."
    >
      <div className="text-center py-6 space-y-5">
        {status === 'verifying' && (
          <div className="space-y-4 py-8">
            <Spinner size="xl" color="gold" className="mx-auto" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Verifying token with CoopBank security servers...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h3 className="font-heading font-black text-xl text-slate-900 dark:text-white">
                Verification Complete!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
                {message}
              </p>
            </div>

            <div className="pt-4">
              <Link to="/login?verified=true">
                <Button variant="gold" size="lg" className="w-full" icon={ArrowRight} iconPosition="right">
                  Proceed to Sign In
                </Button>
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-9 h-9" />
            </div>

            <div>
              <h3 className="font-heading font-black text-xl text-rose-700 dark:text-rose-400">
                Verification Failed
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
                {message}
              </p>
            </div>

            <div className="pt-4">
              <Link to="/login">
                <Button variant="navy" size="md" className="w-full">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default VerifyEmailPage;
