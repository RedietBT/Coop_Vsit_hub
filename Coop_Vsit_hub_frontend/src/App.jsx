import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import AppRoutes from '@/app/routes/AppRoutes';
import useAuthStore from '@/modules/auth/store/authStore';
import CookieConsentBanner from '@/shared/components/ui/CookieConsentBanner';
import { isTokenExpired, clearSession, redirectToLogin, getStoredToken } from '@/core/utils/authUtils';

export function App() {
  const { accessToken, isAuthenticated, fetchCurrentUser, setAuthSession } = useAuthStore();

  useEffect(() => {
    // 1. Proactive session check on mount & user activity (button clicks, key presses, tab focus)
    const checkUserActionSession = () => {
      // Don't trigger redirect if user is already on auth or public pages
      const path = window.location.pathname;
      const isPublicPage =
        path.includes('/login') ||
        path.includes('/forgot-password') ||
        path.includes('/reset-password') ||
        path.includes('/verify-email') ||
        path.includes('/feedback') ||
        path.includes('/survey');

      if (isPublicPage) return;

      const token = getStoredToken();
      if (token && isTokenExpired(token)) {
        clearSession();
        redirectToLogin(true);
      }
    };

    // Run check immediately on mount
    checkUserActionSession();

    // Check on user interactions (any button click or keystroke)
    window.addEventListener('click', checkUserActionSession);
    window.addEventListener('keydown', checkUserActionSession);

    // Check when user returns to tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkUserActionSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 2. Re-validate and refresh user profile if session exists
    if (isAuthenticated && accessToken) {
      if (isTokenExpired(accessToken)) {
        clearSession();
        redirectToLogin(true);
      } else {
        fetchCurrentUser();
      }
    }

    // 3. Listen to silent token refreshes dispatched by Axios interceptor
    const handleAuthRefreshed = (event) => {
      if (event.detail) {
        setAuthSession(event.detail);
      }
    };

    window.addEventListener('coop_auth_refreshed', handleAuthRefreshed);
    return () => {
      window.removeEventListener('click', checkUserActionSession);
      window.removeEventListener('keydown', checkUserActionSession);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('coop_auth_refreshed', handleAuthRefreshed);
    };
  }, [isAuthenticated, accessToken, fetchCurrentUser, setAuthSession]);

  return (
    <BrowserRouter>
      {/* Slide-up animation for cookie banner */}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(30px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      {/* Cookie Consent Banner — shown once per browser session */}
      <CookieConsentBanner />

      {/* Toast Notification Container */}
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={4500}
        toastOptions={{
          className: 'font-sans rounded-2xl shadow-xl border text-sm',
          style: {
            padding: '14px 18px',
          },
        }}
      />

      {/* Main Application Router */}
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
