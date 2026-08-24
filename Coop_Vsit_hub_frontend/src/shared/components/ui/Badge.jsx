import React from 'react';

export const Badge = ({
  children,
  variant = 'default',
  pulse = false,
  size = 'md', // 'sm' | 'md'
  className = '',
}) => {
  const normalizedVariant = (typeof children === 'string' ? children : variant).toLowerCase();

  const variantStyles = {
    // Visit Statuses (Crystal clear high contrast on clean light mode)
    approved: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold shadow-xs',
    completed: 'bg-teal-50 text-teal-800 border-teal-300 font-bold shadow-xs',
    in_progress: 'bg-amber-50 text-amber-900 border-amber-400 font-bold shadow-xs',
    submitted: 'bg-sky-50 text-sky-900 border-sky-300 font-bold shadow-xs',
    under_review: 'bg-indigo-50 text-indigo-900 border-indigo-300 font-bold shadow-xs',
    draft: 'bg-slate-100 text-slate-700 border-slate-300 font-bold',
    rejected: 'bg-rose-50 text-rose-800 border-rose-300 font-bold shadow-xs',
    cancelled: 'bg-rose-50 text-rose-800 border-rose-300 font-bold shadow-xs',

    // Priorities
    critical: 'bg-rose-50 text-rose-800 border-rose-300 font-black tracking-wide',
    high: 'bg-orange-50 text-orange-800 border-orange-300 font-black tracking-wide',
    medium: 'bg-amber-50 text-amber-800 border-amber-300 font-bold',
    low: 'bg-slate-100 text-slate-700 border-slate-300 font-medium',

    // VIP Tiers & Brand
    vip_tier_1: 'bg-orange-50 text-[#e38524] border-orange-300 font-black shadow-xs',
    vip_tier_2: 'bg-sky-50 text-[#00adef] border-sky-300 font-bold shadow-xs',
    gold: 'bg-orange-50 text-[#e38524] border-orange-300 font-bold',
    cyan: 'bg-sky-50 text-[#00adef] border-sky-300 font-bold',
    default: 'bg-slate-100 text-slate-700 border-slate-200 font-medium',
  };

  const dotColors = {
    approved: 'bg-emerald-600',
    completed: 'bg-teal-600',
    in_progress: 'bg-[#e38524] animate-ping',
    submitted: 'bg-[#00adef]',
    under_review: 'bg-indigo-600',
    draft: 'bg-slate-400',
    rejected: 'bg-rose-600',
    cancelled: 'bg-rose-600',
    critical: 'bg-rose-600',
    high: 'bg-orange-600',
    vip_tier_1: 'bg-[#e38524]',
    default: 'bg-slate-400',
  };

  const styleKey = variantStyles[normalizedVariant] ? normalizedVariant : 'default';
  const dotColor = dotColors[normalizedVariant] || dotColors.default;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border tracking-wide uppercase ${
        size === 'sm' ? 'text-[10px] px-2.5 py-0.5' : 'text-xs px-3 py-1'
      } ${variantStyles[styleKey]} ${className}`}
    >
      {pulse ? (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`} />
        </span>
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      )}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
