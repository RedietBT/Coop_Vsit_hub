import React, { useState } from 'react';

/**
 * Cooperative Bank of Oromia (CoopBank) Official Brand Logo Component.
 * Supports image file located at `src/assets/coop-logo.png` with a clean vector SVG fallback.
 */
export const CoopLogo = ({
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  variant = 'full', // 'full' | 'icon'
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeMap = {
    sm: { img: 'h-8', icon: 'w-7 h-7', text: 'text-lg', sub: 'text-[9px]' },
    md: { img: 'h-11', icon: 'w-10 h-10', text: 'text-xl', sub: 'text-[10px]' },
    lg: { img: 'h-14', icon: 'w-12 h-12', text: 'text-2xl', sub: 'text-xs' },
    xl: { img: 'h-20', icon: 'w-16 h-16', text: 'text-3xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // If user placed coop-logo.png in assets directory, render it directly
  if (!imageError) {
    return (
      <div className={`flex items-center gap-2.5 select-none ${className}`}>
        <img
          src="/coop-logo.png"
          alt="Cooperative Bank of Oromia"
          className={`${currentSize.img} object-contain transition-all`}
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Graceful High-DPI Vector SVG fallback with official #00adef, #e38524, #000000
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Hexagonal Emblem */}
      <div className={`relative flex items-center justify-center shrink-0 ${currentSize.icon}`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          {/* Hexagon Frame in #00adef Cyan */}
          <polygon
            points="50,4 92,26 92,74 50,96 8,74 8,26"
            fill="#00adef"
          />
          {/* Inner Accent in #e38524 Orange */}
          <polygon
            points="50,18 80,35 80,65 50,82 20,65 20,35"
            fill="#ffffff"
          />
          {/* Center Brand Diamond in #e38524 */}
          <polygon
            points="50,30 68,50 50,70 32,50"
            fill="#e38524"
          />
        </svg>
      </div>

      {/* Typography Brand Name */}
      {variant !== 'icon' && (
        <div className="flex flex-col leading-tight text-left">
          <div className="flex items-center gap-1.5">
            <span className={`font-heading font-black tracking-tight text-[#000000] ${currentSize.text}`}>
              COOP
            </span>
            <span className={`font-heading font-bold text-[#00adef] tracking-tight ${currentSize.text}`}>
              BANK
            </span>
          </div>
          <span className={`font-sans tracking-wider uppercase font-semibold text-slate-500 ${currentSize.sub}`}>
            DxValley • Visit Hub
          </span>
        </div>
      )}
    </div>
  );
};

export default CoopLogo;
