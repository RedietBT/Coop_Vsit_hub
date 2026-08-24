import React, { useState, useEffect } from 'react';
import { ShieldAlert, Timer } from 'lucide-react';

export const LockoutCountdown = ({ lockoutUntil, onCountdownEnd }) => {
  const calculateRemaining = () => {
    if (!lockoutUntil) return 0;
    const diff = Math.max(0, Math.floor((lockoutUntil - Date.now()) / 1000));
    return diff;
  };

  const [secondsLeft, setSecondsLeft] = useState(calculateRemaining());

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = calculateRemaining();
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        if (onCountdownEnd) {
          onCountdownEnd();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutUntil, onCountdownEnd]);

  if (secondsLeft <= 0) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  return (
    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-left animate-fadeIn">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-rose-100 text-rose-700 shrink-0 mt-0.5">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-rose-800 dark:text-rose-300">
            Account Temporarily Locked
          </h4>
          <p className="text-xs text-rose-700/90 dark:text-rose-400 mt-1 leading-relaxed">
            Due to 3 consecutive failed login attempts, sign-in has been temporarily restricted for security compliance.
          </p>

          <div className="flex items-center gap-1.5 mt-3 text-xs font-bold text-rose-800 dark:text-rose-300">
            <Timer className="w-4 h-4 animate-spin text-rose-600" />
            <span>Cooldown remaining: <span className="font-mono text-sm underline">{formattedTime}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LockoutCountdown;
