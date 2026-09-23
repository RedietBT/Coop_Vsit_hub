import React from 'react';
import CoopLogo from '@/core/assets/CoopLogo';

export const AuthLayout = ({ children, title, subtitle, topRightAction }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 relative bg-slate-50">
      {/* Top Right Action Button outside the card */}
      {topRightAction && (
        <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-20">
          {topRightAction}
        </div>
      )}

      <div className="w-full max-w-md my-auto">
        {/* Brand Logo */}
        <div className="mb-6 flex justify-center">
          <CoopLogo size="md" />
        </div>

        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-6">
            {title && (
              <h2 className="font-heading font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-600 mt-2">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* Form Container Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 border border-slate-200/90">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
