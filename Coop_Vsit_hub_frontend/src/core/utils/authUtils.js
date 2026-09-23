import useAuthStore from '@/modules/auth/store/authStore';

/**
 * Checks if a JWT token is expired based on its 'exp' claim.
 * @param {string|null} token
 * @returns {boolean} true if token is missing, malformed, or expired
 */
export const isTokenExpired = (token) => {
  if (!token || typeof token !== 'string') return true;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      // If it's not standard 3-part JWT, don't falsely expire non-JWT tokens
      return false;
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let jsonPayload;

    try {
      jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch {
      jsonPayload = atob(base64);
    }

    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) {
      return false;
    }

    // payload.exp is in seconds; Date.now() is in milliseconds
    return Date.now() >= payload.exp * 1000;
  } catch (error) {
    console.error('Error parsing token expiration:', error);
    return true;
  }
};

/**
 * Retrieves the current access token from localStorage (checking coop_access_token and coop_auth_state).
 * @returns {string|null}
 */
export const getStoredToken = () => {
  const directToken = localStorage.getItem('coop_access_token');
  if (directToken) return directToken;

  const authData = localStorage.getItem('coop_auth_state');
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      return parsed?.state?.accessToken || null;
    } catch {
      return null;
    }
  }

  return null;
};

/**
 * Retrieves the current user profile from localStorage (checking coop_user and coop_auth_state).
 * @returns {object|null}
 */
export const getStoredUser = () => {
  const directUser = localStorage.getItem('coop_user');
  if (directUser) {
    try {
      return JSON.parse(directUser);
    } catch {
      // ignore parse error, fallback
    }
  }

  const authData = localStorage.getItem('coop_auth_state');
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      return parsed?.state?.user || null;
    } catch {
      return null;
    }
  }

  return null;
};

/**
 * Completely clears authentication tokens, user profile, and cached credentials.
 */
export const clearSession = () => {
  localStorage.removeItem('coop_access_token');
  localStorage.removeItem('coop_user');
  localStorage.removeItem('coop_auth_state');
  sessionStorage.clear();

  try {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      error: null,
      lockoutUntil: null,
    });
  } catch (e) {
    console.warn('Could not reset auth store state:', e);
  }
};

/**
 * Immediately redirects to /login (with optional expired query flag).
 * Avoids infinite redirect loops if the user is already on the login page.
 * @param {boolean} isExpired
 */
export const redirectToLogin = (isExpired = true) => {
  if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
    window.location.href = isExpired ? '/login?expired=true' : '/login';
  }
};
