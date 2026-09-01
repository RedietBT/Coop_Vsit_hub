import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import AppRoutes from '@/app/routes/AppRoutes';
import useAuthStore from '@/modules/auth/store/authStore';

export function App() {
  const { accessToken, isAuthenticated, fetchCurrentUser, setAuthSession } = useAuthStore();

  useEffect(() => {
    // 1. Re-validate and refresh user profile if session exists
    if (isAuthenticated && accessToken) {
      fetchCurrentUser();
    }

    // 2. Listen to silent token refreshes dispatched by Axios interceptor
    const handleAuthRefreshed = (event) => {
      if (event.detail) {
        setAuthSession(event.detail);
      }
    };

    window.addEventListener('coop_auth_refreshed', handleAuthRefreshed);
    return () => window.removeEventListener('coop_auth_refreshed', handleAuthRefreshed);
  }, [isAuthenticated, accessToken, fetchCurrentUser, setAuthSession]);

  return (
    <BrowserRouter>
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
