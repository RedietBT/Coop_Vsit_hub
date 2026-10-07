function getApiBase() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim();
  }
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    return `http://${window.location.hostname}:8080`;
  }
  return 'http://localhost:8080';
}

/**
 * Resolves room image URLs to ensure uploaded backend images load correctly across all environments
 * (localhost, local LAN IP 10.8.101.150, or production).
 * - Automatically prepends the backend API host when the image path starts with `/api/` or `/uploads/`.
 * - Preserves public frontend assets like `/rooms/...` and full URLs (http/https, data, blob).
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

  // If frontend public static asset (e.g. /rooms/...)
  if (trimmed.startsWith('/rooms/')) {
    return trimmed;
  }

  // If backend endpoint (e.g. /api/v1/meeting-rooms/images/... or /uploads/...)
  if (trimmed.startsWith('/api') || trimmed.startsWith('/uploads')) {
    const apiBase = getApiBase();
    const base = apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
    return `${base}${trimmed}`;
  }

  return trimmed;
}

export default resolveImageUrl;
