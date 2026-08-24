import React from 'react';
import { ShieldCheck, Building2, Calendar, Award } from 'lucide-react';
import CoopLogo from '@/core/assets/CoopLogo';

export const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950">
      {/* Left Showcase Banner (Hidden on small screens) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-coop-navy overflow-hidden flex-col justify-between p-12 text-white">
        {/* Background Gradients & Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-coop-gold/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10">
          <CoopLogo variant="white" size="lg" />
        </div>

        {/* Center Pitch & Highlights */}
        <div className="relative z-10 my-auto py-8 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-coop-gold/15 border border-coop-gold/30 text-coop-gold text-xs font-bold uppercase tracking-wider mb-6">
            <ShieldCheck className="w-4 h-4" />
            <span>DxValley Enterprise Portal</span>
          </div>

          <h1 className="font-heading font-black text-4xl leading-tight text-white mb-4">
            Transforming Executive Banking Delegations & VIP Engagements.
          </h1>

          <p className="text-slate-300 text-sm leading-relaxed mb-8">
            Next-generation visitor lifecycle management, relationship intelligence, financial pipeline tracking, and front-desk security check-ins for Cooperative Bank of Oromia.
          </p>

          {/* Feature Badges */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="p-2.5 rounded-xl bg-coop-gold/20 text-coop-gold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Guest Intelligence</p>
                <p className="text-[11px] text-slate-400">Corporate partners & VIPs</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="p-2.5 rounded-xl bg-coop-gold/20 text-coop-gold">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Smart Scheduling</p>
                <p className="text-[11px] text-slate-400">Room conflict prevention</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-6">
          <span>© 2026 Cooperative Bank of Oromia.</span>
          <div className="flex items-center gap-1 text-slate-400">
            <Award className="w-4 h-4 text-coop-gold" />
            <span>Enterprise Security Grade</span>
          </div>
        </div>
      </div>

      {/* Right Form Card Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md">
          {/* Mobile Logo View */}
          <div className="lg:hidden mb-8 flex justify-center">
            <CoopLogo size="md" />
          </div>

          {/* Header */}
          {(title || subtitle) && (
            <div className="text-left mb-8">
              {title && (
                <h2 className="font-heading font-black text-2xl sm:text-3xl text-coop-navy dark:text-white tracking-tight">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* Form Content */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-slate-800">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
