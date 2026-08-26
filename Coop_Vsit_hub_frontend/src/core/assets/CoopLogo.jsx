import React from 'react';
import coopLogo from '@/assets/coop.png';

/**
 * High-definition CoopBank Official Logo Component.
 * Prominent, large brand logo with a clean, subtle `DxValley • VisitHub` subtitle.
 */
export const CoopLogo = ({
  size = 'md', // 'sm' | 'md' | 'lg' | 'xl'
  variant = 'full', // 'full' | 'icon'
  hideText = false,
  className = '',
}) => {
  const sizeMap = {
    sm: { img: 'h-9', text: 'text-[9px]' },
    md: { img: 'h-14 md:h-16', text: 'text-[11px]' },
    lg: { img: 'h-20 md:h-22', text: 'text-xs' },
    xl: { img: 'h-28', text: 'text-sm' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex flex-col items-center justify-center text-center select-none ${className}`}>
      {/* Large, Bold CoopBank Official Logo */}
      <img
        src={coopLogo}
        alt="Cooperative Bank of Oromia"
        className={`${currentSize.img} w-auto object-contain drop-shadow-xs`}
      />

      {/* Subtle, Balanced Brand Subtitle */}
      {!hideText && variant !== 'icon' && (
        <div className={`mt-2 font-sans font-bold tracking-widest uppercase text-slate-500 flex items-center justify-center gap-1 ${currentSize.text}`}>
          <span className="text-slate-800 font-black">DxValley</span>
          <span className="text-slate-400">•</span>
          <span className="text-[#00adef] font-black">VisitHub</span>
        </div>
      )}
    </div>
  );
};

export default CoopLogo;
