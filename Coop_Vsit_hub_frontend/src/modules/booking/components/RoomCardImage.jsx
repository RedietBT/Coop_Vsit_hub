import React, { useState, useEffect } from 'react';
import { DoorOpen } from 'lucide-react';

const PRESET_FACILITY_IMAGES = [
  { test: /boardroom|executive|conference|board/i, path: '/rooms/executive-boardroom.jpg' },
  { test: /africa|hall|summit|auditorium/i, path: '/rooms/africa-table.jpg' },
  { test: /lounge|creative|stools|casual/i, path: '/rooms/creative-lounge-stools.jpg' },
  { test: /cafe|cafeteria|collaboration|dining/i, path: '/rooms/cafeteria-collaboration-table.jpg' },
  { test: /fintech|bar|counter|tech|innovation/i, path: '/rooms/fintech-bar-counter.jpg' },
];

export const getRoomImageCandidates = (url, roomName = '') => {
  const candidates = new Set();
  const trimmed = typeof url === 'string' ? url.trim() : '';

  if (trimmed) {
    // Direct absolute URLs or data / blob URIs
    if (/^(https?:|data:|blob:)/i.test(trimmed)) {
      candidates.add(trimmed);
    } else {
      // Extract base filename (e.g. "room_xxx.jpg" or "executive-boardroom.jpg")
      const filename = trimmed.split('/').pop().split('?')[0];
      const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

      // 1. Primary relative path
      candidates.add(trimmed.startsWith('/') ? trimmed : `/${trimmed}`);

      // 2. Relative alternative endpoints (handled by Vite proxy and backend static/controller)
      if (filename) {
        candidates.add(`/rooms/${filename}`);
        candidates.add(`/api/v1/meeting-rooms/images/${filename}`);
        candidates.add(`/uploads/rooms/${filename}`);
      }

      // 3. API Base prefixed candidates (for production or explicit backend hosts)
      if (apiBase) {
        candidates.add(`${apiBase}/${trimmed.replace(/^\//, '')}`);
        if (filename) {
          candidates.add(`${apiBase}/rooms/${filename}`);
          candidates.add(`${apiBase}/api/v1/meeting-rooms/images/${filename}`);
        }
      }
    }
  }

  // Graceful facility preset fallbacks based on room name
  if (roomName && typeof roomName === 'string') {
    const matched = PRESET_FACILITY_IMAGES.find((p) => p.test.test(roomName));
    if (matched) {
      candidates.add(matched.path);
    }
  }

  // Final fallback to executive boardroom if still empty
  if (candidates.size === 0) {
    candidates.add('/rooms/executive-boardroom.jpg');
  }

  return Array.from(candidates);
};

export const resolveRoomImageUrl = (url, roomName = '') => {
  const candidates = getRoomImageCandidates(url, roomName);
  return candidates.length > 0 ? candidates[0] : null;
};

export const RoomCardImage = ({
  room,
  className = 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-500',
  iconSize = 'w-9 h-9',
  label = 'CoopBank Facility',
}) => {
  const imageUrl = room?.imageUrl || (typeof room === 'string' ? room : null);
  const roomName = room?.name || '';
  const candidates = getRoomImageCandidates(imageUrl, roomName);
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [imageUrl, roomName]);

  const currentSrc = candidates[candidateIndex];

  if (!currentSrc || candidateIndex >= candidates.length) {
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
      src={currentSrc}
      alt={room?.name || 'Meeting Room'}
      className={className}
      onError={() => {
        setCandidateIndex((prev) => prev + 1);
      }}
    />
  );
};

export default RoomCardImage;
