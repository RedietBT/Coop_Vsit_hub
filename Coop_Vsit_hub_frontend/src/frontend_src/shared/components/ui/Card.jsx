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
      className={`rounded-3xl border border-slate-200/90 transition-all duration-200 bg-white shadow-xs ${
        hoverLift ? 'hover:shadow-md hover:-translate-y-0.5 hover:border-[#00adef]/50' : ''
      } ${className}`}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div>
            {title && (
              <h3 className="font-heading font-black text-base text-[#000000]">
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
