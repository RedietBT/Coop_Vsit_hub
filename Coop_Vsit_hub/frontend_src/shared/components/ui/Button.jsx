import React from 'react';
import Spinner from './Spinner';
import soundPlayer from '@/core/utils/soundPlayer';

export const Button = ({
  children,
  type = 'button',
  variant = 'orange', // 'orange' | 'cyan' | 'black' | 'outline-cyan' | 'outline-orange' | 'ghost' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  isLoading = false,
  disabled = false,
  icon: Icon = null,
  iconPosition = 'left',
  playClick = true,
  onClick,
  className = '',
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5',
    md: 'text-sm px-5 py-2.5 gap-2 font-semibold',
    lg: 'text-base px-6 py-3.5 gap-2.5 font-bold',
  };

  const variantStyles = {
    orange:
      'bg-[#e38524] hover:bg-[#c9721b] text-white shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/35 focus:ring-[#e38524] font-bold',
    gold: // backward compatibility mapping to orange
      'bg-[#e38524] hover:bg-[#c9721b] text-white shadow-md shadow-orange-500/25 hover:shadow-lg hover:shadow-orange-500/35 focus:ring-[#e38524] font-bold',
    cyan:
      'bg-[#00adef] hover:bg-[#0098d3] text-white shadow-md shadow-sky-500/25 hover:shadow-lg hover:shadow-sky-500/35 focus:ring-[#00adef] font-bold',
    navy: // backward compatibility mapping to black / dark cyan
      'bg-[#000000] hover:bg-slate-800 text-white shadow-md shadow-slate-900/20 hover:shadow-lg focus:ring-black',
    black:
      'bg-[#000000] hover:bg-slate-800 text-white shadow-md shadow-slate-900/20 hover:shadow-lg focus:ring-black',
    'outline-cyan':
      'border-2 border-[#00adef] text-[#00adef] hover:bg-[#00adef]/10 focus:ring-[#00adef] bg-transparent font-semibold',
    'outline-orange':
      'border-2 border-[#e38524] text-[#e38524] hover:bg-[#e38524]/10 focus:ring-[#e38524] bg-transparent font-semibold',
    'outline-gold':
      'border-2 border-[#e38524] text-[#e38524] hover:bg-[#e38524]/10 focus:ring-[#e38524] bg-transparent font-semibold',
    ghost:
      'text-slate-700 hover:text-[#000000] hover:bg-slate-100 focus:ring-slate-400 bg-transparent',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 focus:ring-rose-500',
  };

  const handleClick = (e) => {
    if (disabled || isLoading) return;
    if (playClick) {
      soundPlayer.playClickSound();
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={handleClick}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${
        variantStyles[variant] || variantStyles.orange
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner size="sm" color="white" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  );
};

export default Button;
