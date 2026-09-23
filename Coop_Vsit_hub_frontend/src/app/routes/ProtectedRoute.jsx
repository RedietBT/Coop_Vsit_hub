import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isTokenExpired, clearSession } from '@/core/utils/authUtils';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const location = useLocation();

  // Retrieve token from localStorage (direct key or zustand persisted state)
  let token = localStorage.getItem('coop_access_token');
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem('coop_user') || 'null');
  } catch {
    user = null;
  }

  // Backward compatibility fallback to coop_auth_state
  if (!token || !user) {
    const authData = localStorage.getItem('coop_auth_state');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        if (!token) token = parsed?.state?.accessToken;
        if (!user) user = parsed?.state?.user;
      } catch {
        // ignore parse error
      }
    }
  }

  // If no token or user exists, immediately redirect to login
  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if token has expired
  if (isTokenExpired(token)) {
    clearSession();
    return <Navigate to="/login?expired=true" state={{ from: location }} replace />;
  }

  // Check role authorization if specified
  if (allowedRoles && allowedRoles.length > 0) {
    const checkRoleMatch = (targetRole) => {
      const targetClean = String(targetRole).replace(/^ROLE_/, '').toUpperCase();
      const matches = (val) => {
        if (!val) return false;
        const clean = String(val).replace(/^ROLE_/, '').toUpperCase();
        return clean === targetClean || String(val) === String(targetRole);
      };

      if (Array.isArray(user.roles)) {
        return user.roles.some((r) => {
          if (typeof r === 'string') return matches(r);
          if (typeof r === 'object' && r !== null) return matches(r.name || r.role || r.authority);
          return false;
        });
      }

      if (typeof user.role === 'string') return matches(user.role);
      return false;
    };

    const hasAllowedRole = allowedRoles.some((role) => checkRoleMatch(role));
    if (!hasAllowedRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
