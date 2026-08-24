import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '@/modules/auth/pages/LoginPage';
import VerifyEmailPage from '@/modules/auth/pages/VerifyEmailPage';
import ResetPasswordPage from '@/modules/auth/pages/ResetPasswordPage';
import useAuthStore from '@/modules/auth/store/authStore';
import Button from '@/shared/components/ui/Button';
import CoopLogo from '@/core/assets/CoopLogo';
import { LogOut, LayoutDashboard, Calendar, Users, Building2 } from 'lucide-react';

// Temporary Phase 2 Demo Landing while building Phase 3 Shell
const DashboardPreview = () => {
  const { user, logout } = useAuthStore();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 shadow-md">
          <CoopLogo size="md" />
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-bold text-coop-navy dark:text-white">{user?.fullName}</p>
              <p className="text-xs text-slate-500">{user?.roles?.join(', ')}</p>
            </div>
            <Button variant="outline-gold" size="sm" icon={LogOut} onClick={logout}>
              Sign Out
            </Button>
          </div>
        </header>

        <div className="p-8 bg-coop-navy text-white rounded-3xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-coop-gold/15 rounded-full blur-3xl" />
          <h2 className="font-heading font-black text-3xl mb-2">Phase 2 Authentication Verified!</h2>
          <p className="text-slate-300 text-sm max-w-xl">
            You have successfully logged in via stateless JWT. Session tokens are securely cached in localStorage and refreshed automatically.
          </p>
        </div>
      </div>
    </div>
  );
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPreview />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
