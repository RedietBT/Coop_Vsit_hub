import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleGuard from './RoleGuard';
import DashboardLayout from '@/core/layouts/DashboardLayout';
import LoginPage from '@/modules/auth/pages/LoginPage';
import VerifyEmailPage from '@/modules/auth/pages/VerifyEmailPage';
import ResetPasswordPage from '@/modules/auth/pages/ResetPasswordPage';
import ExecutiveDashboardPage from '@/modules/analytics/pages/ExecutiveDashboardPage';
import VisitsListPage from '@/modules/visits/pages/VisitsListPage';
import VisitCalendarPage from '@/modules/visits/pages/VisitCalendarPage';

// Placeholder for upcoming modules
const WorkspacePlaceholder = ({ title, subtitle }) => (
  <div className="p-8 bg-white rounded-3xl border border-slate-200/90 shadow-xs text-left">
    <h2 className="font-heading font-black text-2xl text-[#000000]">{title}</h2>
    <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
  </div>
);

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected Routes inside Global DashboardLayout Shell */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['ROLE_ADMIN', 'ROLE_EXECUTIVE', 'ROLE_RELATIONSHIP_MANAGER']}>
              <DashboardLayout>
                <ExecutiveDashboardPage />
              </DashboardLayout>
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/visits"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['ROLE_ADMIN', 'ROLE_RELATIONSHIP_MANAGER', 'ROLE_APPROVER', 'ROLE_EMPLOYEE']}>
              <DashboardLayout>
                <VisitsListPage />
              </DashboardLayout>
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/visits/calendar"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['ROLE_ADMIN', 'ROLE_RELATIONSHIP_MANAGER', 'ROLE_APPROVER']}>
              <DashboardLayout>
                <VisitCalendarPage />
              </DashboardLayout>
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/security-desk"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['ROLE_SECURITY_DESK', 'ROLE_ADMIN']}>
              <DashboardLayout>
                <WorkspacePlaceholder
                  title="Front Desk Security Cockpit"
                  subtitle="Phase 6 Security Desk check-in badging and departure tracking will mount here."
                />
              </DashboardLayout>
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/organizations"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['ROLE_ADMIN', 'ROLE_RELATIONSHIP_MANAGER', 'ROLE_EXECUTIVE']}>
              <DashboardLayout>
                <WorkspacePlaceholder
                  title="Partner Organizations Intelligence"
                  subtitle="Phase 7 Corporate partner directory and health score analytics."
                />
              </DashboardLayout>
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/guests"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['ROLE_ADMIN', 'ROLE_RELATIONSHIP_MANAGER', 'ROLE_EXECUTIVE']}>
              <DashboardLayout>
                <WorkspacePlaceholder
                  title="VIP Individual Guests Intelligence"
                  subtitle="Phase 7 Individual VIP guest catalog and stats."
                />
              </DashboardLayout>
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['ROLE_ADMIN']}>
              <DashboardLayout>
                <WorkspacePlaceholder
                  title="Staff User & Access Control"
                  subtitle="Phase 9 Admin user onboarding, permissions, and role assignment."
                />
              </DashboardLayout>
            </RoleGuard>
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
