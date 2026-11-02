import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '@/modules/auth/store/authStore';
import { isTokenExpired, isUserIdle, triggerSessionLogout } from '@/core/auth/sessionManager';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, accessToken, logout } = useAuthStore();
  const location = useLocation();

  const isPassed = !isAuthenticated || !accessToken || isTokenExpired(accessToken) || isUserIdle(15);

  useEffect(() => {
    if (isAuthenticated && isPassed) {
      logout();
      triggerSessionLogout('expired');
    }
  }, [isAuthenticated, isPassed, logout]);

  if (isPassed) {
    return <Navigate to="/login?expired=true" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
