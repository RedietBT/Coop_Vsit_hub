/**
 * Banking Session & Token Expiration Manager for CoopBank Visit Hub.
 *
 * Enforces automatic logout when:
 * 1. The JWT token expiration time (exp claim) has passed.
 * 2. User inactivity/idle threshold (e.g. 15 minutes) is exceeded.
 * 3. Backend returns a 401 Unauthorized / Token Expired response.
 */

const LAST_ACTIVITY_KEY = 'coop_last_activity';
const DEFAULT_IDLE_TIMEOUT_MINUTES = 15; // 15 minutes maximum inactive session

/**
 * Safely decodes the payload of a JWT token without external dependencies.
 */
export const parseJwt = (token) => {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    return null;
  }
};

/**
 * Returns expiration timestamp in milliseconds from the token, or null.
 */
export const getTokenExpiryMs = (token) => {
  const payload = parseJwt(token);
  if (!payload || !payload.exp) return null;
  return payload.exp * 1000;
};

/**
 * Checks if the JWT access token is expired or about to expire.
 * @param {string} token 
 * @param {number} bufferSeconds - default 5s safety cushion
 */
export const isTokenExpired = (token, bufferSeconds = 5) => {
  if (!token) return true;
  const expiryMs = getTokenExpiryMs(token);
  if (!expiryMs) return true;
  return Date.now() >= (expiryMs - bufferSeconds * 1000);
};

/**
 * Returns remaining lifespan of token in milliseconds (0 if expired).
 */
export const getRemainingTokenMs = (token) => {
  const expiryMs = getTokenExpiryMs(token);
  if (!expiryMs) return 0;
  return Math.max(0, expiryMs - Date.now());
};

/**
 * Records the timestamp of user interactions (click, keypress, scroll).
 */
export const recordUserActivity = () => {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
};

/**
 * Retrieves the timestamp of the last recorded user interaction.
 */
export const getLastUserActivity = () => {
  try {
    const saved = localStorage.getItem(LAST_ACTIVITY_KEY);
    return saved ? parseInt(saved, 10) : Date.now();
  } catch {
    return Date.now();
  }
};

/**
 * Returns true if the user has been inactive for longer than idleMinutes.
 */
export const isUserIdle = (idleMinutes = DEFAULT_IDLE_TIMEOUT_MINUTES) => {
  const lastActive = getLastUserActivity();
  const idleMs = idleMinutes * 60 * 1000;
  return (Date.now() - lastActive) > idleMs;
};

/**
 * Comprehensive check: Is the current authenticated session expired?
 * Returns true if token is missing/expired OR user has been idle for >= 15 mins.
 */
export const isSessionPassed = (token, maxIdleMinutes = DEFAULT_IDLE_TIMEOUT_MINUTES) => {
  if (!token) return true;
  if (isTokenExpired(token)) return true;
  if (isUserIdle(maxIdleMinutes)) return true;
  return false;
};

/**
 * Triggers full session termination, clears storage, notifies listeners,
 * and redirects to the login screen with the session expired indicator.
 */
export const triggerSessionLogout = (reason = 'expired') => {
  try {
    // 1. Clear all storage keys
    localStorage.removeItem('coop_auth_state');
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  } catch (e) {
    console.error('Failed to clear session storage', e);
  }

  // 2. Dispatch custom event for in-app store listeners
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('coop_session_expired', {
        detail: { reason, timestamp: Date.now() },
      })
    );

    // 3. If not already on /login or a public route, redirect to login
    const path = window.location.pathname;
    const isPublic =
      path.includes('/login') ||
      path.includes('/schedule') ||
      path.includes('/room-display') ||
      path.includes('/feedback') ||
      path.includes('/survey');

    if (!isPublic) {
      window.location.href = '/login?expired=true';
    }
  }
};

