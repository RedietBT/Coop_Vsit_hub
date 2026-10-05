import React, { useState, useEffect } from 'react';
import { DoorOpen } from 'lucide-react';

export const resolveRoomImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^(https?:|data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }
  const apiBase = import.meta.env.VITE_API_URL || '';
  if (apiBase && !window.location.origin.includes('localhost:3000')) {
    return `${apiBase.replace(/\/$/, '')}/${trimmed.replace(/^\//, '')}`;
  }
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};

export const RoomCardImage = ({
  room,
  className = 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-500',
  iconSize = 'w-9 h-9',
  label = 'CoopBank Facility',
}) => {
  const imageUrl = room?.imageUrl || (typeof room === 'string' ? room : null);
  const resolved = resolveRoomImageUrl(imageUrl);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [imageUrl]);

  if (!resolved || hasError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-100 select-none">
        <DoorOpen className={`${iconSize} mb-1 opacity-40 text-slate-400`} />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </span>
      </div>
    );
  }

  return (
    <img
      src={resolved}
      alt={room?.name || 'Meeting Room'}
      className={className}
      onError={() => setHasError(true)}
    />
  );
};

export default RoomCardImage;
