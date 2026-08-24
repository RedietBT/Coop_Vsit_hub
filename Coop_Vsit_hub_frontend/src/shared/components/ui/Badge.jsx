import React from 'react';

export const Badge = ({
  children,
  variant = 'default', // 'approved' | 'in_progress' | 'completed' | 'submitted' | 'rejected' | 'gold' | 'navy' | 'vip1' | 'vip2'
  pulse = false,
  size = 'md', // 'sm' | 'md'
  className = '',
}) => {
  const normalizedVariant = (typeof children === 'string' ? children : variant).toLowerCase();

  const variantStyles = {
    // Visit Status
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
    completed: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800',
    in_progress: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700',
    submitted: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
    under_review: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800',
    draft: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    rejected: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800',

    // Priorities
    critical: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
    high: 'bg-orange-100 text-orange-800 border-orange-300 font-bold',
    medium: 'bg-amber-100 text-amber-800 border-amber-300',
    low: 'bg-slate-100 text-slate-700 border-slate-300',

    // VIP Tiers & Brand
    vip_tier_1: 'bg-linear-to-r from-amber-500/20 to-coop-gold/30 text-amber-900 dark:text-amber-300 border-amber-400 font-bold shadow-xs',
    vip_tier_2: 'bg-linear-to-r from-slate-200 to-slate-300 text-slate-800 dark:text-slate-200 border-slate-400 font-semibold',
    gold: 'bg-coop-gold/15 text-coop-gold border-coop-gold/40 font-bold',
    navy: 'bg-coop-navy/15 text-coop-navy border-coop-navy/40 font-bold',
    default: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
  };

  const dotColors = {
    approved: 'bg-emerald-500',
    completed: 'bg-teal-500',
    in_progress: 'bg-amber-500 animate-pulse',
    submitted: 'bg-blue-500',
    under_review: 'bg-indigo-500',
    draft: 'bg-slate-400',
    rejected: 'bg-rose-500',
    cancelled: 'bg-rose-500',
    critical: 'bg-rose-500 animate-ping',
    high: 'bg-orange-500',
    vip_tier_1: 'bg-coop-gold',
    default: 'bg-slate-400',
  };

  const styleKey = variantStyles[normalizedVariant] ? normalizedVariant : 'default';
  const dotColor = dotColors[normalizedVariant] || dotColors.default;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium tracking-wide uppercase ${
        size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'
      } ${variantStyles[styleKey]} ${className}`}
    >
      {pulse && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
