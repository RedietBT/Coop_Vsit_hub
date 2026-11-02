import React, { useEffect, useCallback } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import AppRoutes from '@/app/routes/AppRoutes';
import useAuthStore from '@/modules/auth/store/authStore';
import CookieConsentBanner from '@/shared/components/ui/CookieConsentBanner';
import {
  isSessionPassed,
  recordUserActivity,
  triggerSessionLogout,
} from '@/core/auth/sessionManager';

export function App() {
  const { accessToken, isAuthenticated, fetchCurrentUser, setAuthSession, logout } = useAuthStore();

  // Active check if session has passed
  const checkSessionStatus = useCallback(() => {
    if (!isAuthenticated || !accessToken) return;

    if (isSessionPassed(accessToken, 15)) {
      logout();
      triggerSessionLogout('expired');
    }
  }, [isAuthenticated, accessToken, logout]);

  useEffect(() => {
    // 1. Initial validation on mount
    if (isAuthenticated && accessToken) {
      if (isSessionPassed(accessToken, 15)) {
        logout();
        triggerSessionLogout('expired');
        return;
      }
      fetchCurrentUser();
    }

    // 2. Active Session Polling Timer (Checks every 5 seconds)
    const sessionTimer = setInterval(() => {
      checkSessionStatus();
    }, 5000);

    // 3. User Activity Listeners (keeps session fresh while actively working)
    const handleUserInteraction = () => {
      if (isAuthenticated) {
        recordUserActivity();
      }
    };

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((ev) => {
      window.addEventListener(ev, handleUserInteraction, { passive: true });
    });

    // 4. Tab Focus / Visibility change check (when user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSessionStatus();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkSessionStatus);

    // 5. Listen to silent token refreshes dispatched by Axios interceptor
    const handleAuthRefreshed = (event) => {
      if (event.detail) {
        setAuthSession(event.detail);
      }
    };
    window.addEventListener('coop_auth_refreshed', handleAuthRefreshed);

    return () => {
      clearInterval(sessionTimer);
      activityEvents.forEach((ev) => {
        window.removeEventListener(ev, handleUserInteraction);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkSessionStatus);
      window.removeEventListener('coop_auth_refreshed', handleAuthRefreshed);
    };
  }, [isAuthenticated, accessToken, fetchCurrentUser, setAuthSession, checkSessionStatus, logout]);

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

      {/* Toast Notification Container — capped at 2 popups at a time */}
      <Toaster
        position="top-right"
        richColors
        closeButton
        visibleToasts={2}
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
