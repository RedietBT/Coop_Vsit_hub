import React from 'react';
import { ShieldCheck, Building2, Calendar, Award } from 'lucide-react';
import CoopLogo from '@/core/assets/CoopLogo';

export const AuthLayout = ({ children, title, subtitle, topRightAction }) => {
  return (
    <div className="min-h-screen w-full flex bg-slate-50">
 
      {/* Right Form Card Panel (Clean White Light Mode) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative bg-white min-h-screen">
        {/* Top Right Action Button outside the card */}
        {topRightAction && (
          <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-20">
            {topRightAction}
          </div>
        )}

        <div className="w-full max-w-md">
          {/* Mobile Logo View */}
          <div className="lg:hidden mb-8 flex justify-center">
            <CoopLogo size="md" />
          </div>

          {/* Header */}
          {(title || subtitle) && (
            <div className="text-left mb-8">
              {title && (
                <h2 className="font-heading font-black text-2xl sm:text-3xl text-[#000000] tracking-tight">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-sm text-slate-600 mt-2">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* Form Container Card */}
          <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/60 border border-slate-200/90">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
