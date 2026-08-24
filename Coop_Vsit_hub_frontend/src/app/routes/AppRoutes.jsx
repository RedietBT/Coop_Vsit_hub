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
import SecurityDeskPage from '@/modules/security/pages/SecurityDeskPage';
import OrganizationsPage from '@/modules/organizations/pages/OrganizationsPage';
import GuestsPage from '@/modules/guests/pages/GuestsPage';
import UsersPage from '@/modules/users/pages/UsersPage';

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
                <SecurityDeskPage />
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
                <OrganizationsPage />
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
                <GuestsPage />
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
                <UsersPage />
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
