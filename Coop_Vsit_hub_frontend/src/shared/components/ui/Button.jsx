import React from 'react';
import Spinner from './Spinner';
import soundPlayer from '@/core/utils/soundPlayer';

export const Button = ({
  children,
  type = 'button',
  variant = 'gold', // 'gold' | 'navy' | 'outline-gold' | 'outline-navy' | 'ghost' | 'danger'
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
    gold: 'bg-coop-gold hover:bg-coop-gold-light text-coop-navy shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 focus:ring-coop-gold font-bold',
    navy: 'bg-coop-navy hover:bg-coop-navy-light text-white shadow-md shadow-blue-900/20 hover:shadow-lg hover:shadow-blue-900/30 focus:ring-coop-navy',
    'outline-gold':
      'border-2 border-coop-gold text-coop-gold hover:bg-coop-gold/10 focus:ring-coop-gold bg-transparent',
    'outline-navy':
      'border-2 border-coop-navy text-coop-navy hover:bg-coop-navy/10 focus:ring-coop-navy bg-transparent',
    ghost:
      'text-slate-600 hover:text-coop-navy hover:bg-slate-100 focus:ring-slate-400 bg-transparent',
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
        variantStyles[variant] || variantStyles.gold
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Spinner
            size="sm"
            color={variant === 'gold' ? 'navy' : variant === 'outline-gold' ? 'gold' : 'white'}
          />
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
