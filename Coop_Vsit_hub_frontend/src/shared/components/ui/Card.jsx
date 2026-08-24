import React from 'react';

export const Card = ({
  children,
  title = null,
  subtitle = null,
  action = null,
  hoverLift = false,
  glass = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`rounded-2xl border border-slate-200/80 dark:border-slate-800 transition-all duration-200 ${
        glass
          ? 'glass-card'
          : 'bg-white dark:bg-slate-900/80 shadow-xs'
      } ${hoverLift ? 'hover:shadow-md hover:-translate-y-0.5' : ''} ${className}`}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            {title && (
              <h3 className="font-heading font-bold text-base text-coop-navy dark:text-slate-100">
                {title}
              </h3>
            )}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};

export default Card;
