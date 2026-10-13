function getApiBase() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim()) {
    const trimmed = envUrl.trim();
    return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
  }
  // When running in the browser without an explicit external VITE_API_URL:
  // Return empty string so relative URLs (/api/...) use current host and port
  // and route smoothly through Nginx or the Vite proxy.
  return '';
}

/**
 * Resolves room image URLs to ensure uploaded backend images load correctly across all environments
 * (localhost, local LAN IP 10.8.101.150, or production).
 * - Automatically routes uploaded room images (stored as /rooms/room_xxx or room_xxx) to the backend API.
 * - Automatically prepends API base if configured, or leaves as relative URL for Nginx/Vite proxy.
 * - Preserves public frontend static assets like `/rooms/executive-boardroom.jpg`.
 * - Provides an authentic CoopBank facility fallback if the URL is empty.
 */
export function resolveImageUrl(url, fallback = '/rooms/executive-boardroom.jpg') {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return fallback;
  }
  const trimmed = url.trim();

  // If already absolute or data/blob URL
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  const apiBase = getApiBase();

  // Handle uploaded room images (e.g. /rooms/room_xxxx, /uploads/rooms/room_xxxx, room_xxxx)
  // Route them through the public API endpoint so Nginx (port 80) and Vite proxy serve them
  if (
    trimmed.includes('room_') &&
    (trimmed.startsWith('/rooms/') || trimmed.startsWith('/uploads/') || trimmed.startsWith('room_'))
  ) {
    const filename = trimmed.substring(trimmed.lastIndexOf('/') + 1);
    return `${apiBase}/api/v1/meeting-rooms/images/${filename}`;
  }

  // If backend endpoint (e.g. /api/v1/meeting-rooms/images/... or /uploads/...)
  if (trimmed.startsWith('/api') || trimmed.startsWith('/uploads')) {
    return `${apiBase}${trimmed}`;
  }

  // If frontend public static stock asset (e.g. /rooms/executive-boardroom.jpg)
  if (trimmed.startsWith('/rooms/')) {
    return trimmed;
  }

  return trimmed;
}

export default resolveImageUrl;
