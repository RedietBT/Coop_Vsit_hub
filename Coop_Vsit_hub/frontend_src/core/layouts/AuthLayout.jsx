import React from 'react';
import { ShieldCheck, Building2, Calendar, Award } from 'lucide-react';
import CoopLogo from '@/core/assets/CoopLogo';

export const AuthLayout = ({ children, title, subtitle, topRightAction }) => {
  return (
    <div className="min-h-screen w-full flex bg-slate-50">
      {/* Left Showcase Banner in CoopBank Cyan & Orange Accent */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#00adef] overflow-hidden flex-col justify-between p-12 text-white">
        {/* Background Decorative Circles & Lighting */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#e38524]/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff15_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="px-6 py-4 bg-white rounded-2xl shadow-lg border border-white/50 inline-flex items-center justify-center">
            <CoopLogo size="lg" />
          </div>
        </div>

        {/* Center Pitch & Highlights */}
        <div className="relative z-10 my-auto py-8 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-black uppercase tracking-wider mb-6 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-[#e38524]" />
            <span>CoopBank Enterprise Portal</span>
          </div>

          <h1 className="font-heading font-black text-4xl leading-tight text-white mb-4 drop-shadow-xs">
            Transforming Executive Delegations & VIP Engagements.
          </h1>

          <p className="text-white/90 text-sm leading-relaxed mb-8">
            Next-generation visitor lifecycle management, relationship intelligence, financial pipeline tracking, and security front-desk badging for Cooperative Bank of Oromia.
          </p>

          {/* Feature Badges */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-md">
              <div className="p-2.5 rounded-xl bg-white text-[#00adef] shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">Guest Intelligence</p>
                <p className="text-[11px] text-white/80">Corporate partners & VIPs</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-md">
              <div className="p-2.5 rounded-xl bg-[#e38524] text-white shadow-xs">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">Smart Scheduling</p>
                <p className="text-[11px] text-white/80">Conflict prevention</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-white/80 border-t border-white/20 pt-6">
          <span>© 2026 Cooperative Bank of Oromia.</span>
          <div className="flex items-center gap-1.5 text-white font-medium">
            <Award className="w-4 h-4 text-[#e38524]" />
            <span>CoopBank Security Grade</span>
          </div>
        </div>
      </div>

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
