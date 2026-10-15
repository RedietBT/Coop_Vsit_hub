function getApiBase() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim()) {
    const trimmed = envUrl.trim();
    // When accessed from a remote IP/hostname, don't use 'localhost' as it will fail on the client browser
    if (
      typeof window !== 'undefined' &&
      trimmed.includes('localhost') &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      return '';
    }
    return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
  }
  return '';
}

/**
 * Resolves room image URLs to ensure uploaded backend images load correctly across all environments
 * (localhost, local LAN IP, or production).
 * - Preserves /rooms/ paths (both uploaded and stock assets) so Vite serves them from public/rooms/ or proxies them.
 * - Handles filenames starting with 'room_'.
 * - Preserves absolute, blob, and data URLs.
 * - Provides an authentic CoopBank facility fallback if the URL is empty.
 */
export function resolveImageUrl(url, fallback = '/rooms/executive-boardroom.jpg') {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return fallback;
  }
  let trimmed = url.trim();

  // Strip accidental localhost:8080 or 127.0.0.1:8080 prefixes so paths remain relative to reverse proxy
  if (trimmed.includes('localhost:8080')) {
    trimmed = trimmed.replace(/^https?:\/\/localhost:8080/, '');
  } else if (trimmed.includes('127.0.0.1:8080')) {
    trimmed = trimmed.replace(/^https?:\/\/127.0.0.1:8080/, '');
  }

  // If already absolute external URL or data/blob URL
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Uploaded room photos (starting with room_ or containing /room_):
  // Must ALWAYS be routed through /api/v1/meeting-rooms/images/{filename} so that deployed
  // frontends (e.g. at 10.8.101.151) that reverse-proxy /api to the backend server will
  // fetch the uploaded image file directly from the backend server where it was saved.
  if (trimmed.includes('room_')) {
    const filename = trimmed.substring(trimmed.lastIndexOf('/') + 1);
    return `/api/v1/meeting-rooms/images/${filename}`;
  }

  // Stock static assets packaged in the frontend (e.g. /rooms/executive-boardroom.jpg)
  if (trimmed.startsWith('/rooms/')) {
    return trimmed;
  }

  // Backend endpoints (e.g. /api/... or /uploads/...)
  if (trimmed.startsWith('/api') || trimmed.startsWith('/uploads')) {
    return trimmed;
  }

  // Default fallback for relative image path
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export default resolveImageUrl;
