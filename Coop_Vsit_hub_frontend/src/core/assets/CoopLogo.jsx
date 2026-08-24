import React from 'react';

/**
 * Cooperative Bank of Oromia (CoopBank) Official Brand Vector Logo.
 * Displays the distinctive CoopBank hexagonal brand emblem in Gold & Deep Navy.
 */
export const CoopLogo = ({
  variant = 'full', // 'full' | 'icon' | 'white'
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  className = '',
}) => {
  const sizeMap = {
    sm: { icon: 'w-7 h-7', text: 'text-lg', sub: 'text-[9px]' },
    md: { icon: 'w-9 h-9', text: 'text-xl', sub: 'text-[10px]' },
    lg: { icon: 'w-12 h-12', text: 'text-2xl', sub: 'text-xs' },
    xl: { icon: 'w-16 h-16', text: 'text-3xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Hexagonal Gold/Navy Brand Emblem */}
      <div className={`relative flex items-center justify-center shrink-0 ${currentSize.icon}`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-md"
        >
          {/* Hexagon Outer Frame */}
          <polygon
            points="50,3 93,25 93,75 50,97 7,75 7,25"
            className="fill-coop-navy stroke-coop-gold"
            strokeWidth="5"
          />
          {/* Inner Geometric Rays / Energy Lines */}
          <path
            d="M50 20 L50 80 M25 35 L75 65 M25 65 L75 35"
            stroke="#F39200"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          {/* Center Hub Diamond */}
          <polygon
            points="50,38 62,50 50,62 38,50"
            fill="#FDB714"
            className="filter drop-shadow"
          />
        </svg>
      </div>

      {/* Typography Brand Name */}
      {variant !== 'icon' && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1">
            <span
              className={`font-heading font-black tracking-tight ${
                variant === 'white' ? 'text-white' : 'text-coop-navy'
              } ${currentSize.text}`}
            >
              COOP
            </span>
            <span className={`font-heading font-bold text-coop-gold tracking-tight ${currentSize.text}`}>
              BANK
            </span>
          </div>
          <span
            className={`font-sans tracking-wider uppercase font-semibold text-slate-500 dark:text-slate-400 ${currentSize.sub}`}
          >
            DxValley • Visit Hub
          </span>
        </div>
      )}
    </div>
  );
};

export default CoopLogo;
