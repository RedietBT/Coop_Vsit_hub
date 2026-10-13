import React from 'react';

export const Spinner = ({ size = 'md', color = 'gold', className = '' }) => {
  const sizeMap = {
    xs: 'w-3.5 h-3.5 border-2',
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
  };

  const colorMap = {
    gold: 'border-coop-gold border-t-transparent',
    navy: 'border-coop-navy border-t-transparent',
    white: 'border-white border-t-transparent',
    slate: 'border-slate-400 border-t-transparent',
  };

  return (
    <div
      className={`inline-block rounded-full animate-spin ${sizeMap[size] || sizeMap.md} ${
        colorMap[color] || colorMap.gold
      } ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
};

export default Spinner;
