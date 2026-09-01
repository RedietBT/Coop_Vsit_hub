import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleGuard from './RoleGuard';
import DashboardLayout from '@/core/layouts/DashboardLayout';
import LoginPage from '@/modules/auth/pages/LoginPage';
import ForgotPasswordPage from '@/modules/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/modules/auth/pages/ResetPasswordPage';
import VerifyEmailPage from '@/modules/auth/pages/VerifyEmailPage';
import ExecutiveDashboardPage from '@/modules/analytics/pages/ExecutiveDashboardPage';
import VisitsListPage from '@/modules/visits/pages/VisitsListPage';
import VisitCalendarPage from '@/modules/visits/pages/VisitCalendarPage';
import BookingManagementPage from '@/modules/booking/pages/BookingManagementPage';
import SecurityDeskPage from '@/modules/security/pages/SecurityDeskPage';
import ReportsAnalyticsPage from '@/modules/reports/pages/ReportsAnalyticsPage';
import OrganizationsPage from '@/modules/organizations/pages/OrganizationsPage';
import GuestsPage from '@/modules/guests/pages/GuestsPage';
import UsersPage from '@/modules/users/pages/UsersPage';
import AuditLogsPage from '@/modules/audit/pages/AuditLogsPage';
import PublicSurveyPage from '@/modules/feedback/pages/PublicSurveyPage';
import StaffTrackerPage from '@/modules/staff/pages/StaffTrackerPage';

import useAuthStore from '@/modules/auth/store/authStore';

const RootRedirect = () => {
  const { isAuthenticated, hasRole } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (hasRole('ROLE_ADMIN')) return <Navigate to="/dashboard" replace />;
  if (hasRole('ROLE_SECURITY_DESK')) return <Navigate to="/security-desk" replace />;
  return <Navigate to="/my-tracking" replace />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Auth & Guest Survey Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

      {/* Public Post-Visit Customer Satisfaction (CSAT) Survey */}
      <Route path="/feedback/:token" element={<PublicSurveyPage />} />
      <Route path="/feedback/verify/:token" element={<PublicSurveyPage />} />
      <Route path="/survey/:token" element={<PublicSurveyPage />} />

      {/* Protected Routes inside Global DashboardLayout Shell */}
      <Route
        path="/my-tracking"
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <StaffTrackerPage />
            </DashboardLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['ROLE_ADMIN', 'ROLE_APPROVER']}>
              <DashboardLayout>
                <ExecutiveDashboardPage />
              </DashboardLayout>
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/visits/book"
        element={<Navigate to="/security-desk" replace />}
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
        path="/bookings"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['ROLE_ADMIN', 'ROLE_RELATIONSHIP_MANAGER', 'ROLE_SECURITY_DESK', 'ROLE_APPROVER']}>
              <DashboardLayout>
                <BookingManagementPage />
              </DashboardLayout>
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/visits"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['ROLE_ADMIN', 'ROLE_RELATIONSHIP_MANAGER', 'ROLE_APPROVER']}>
              <DashboardLayout>
                <VisitsListPage />
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
        path="/reports"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['ROLE_ADMIN', 'ROLE_RELATIONSHIP_MANAGER', 'ROLE_APPROVER', 'ROLE_SECURITY_DESK']}>
              <DashboardLayout>
                <ReportsAnalyticsPage />
              </DashboardLayout>
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      <Route
        path="/organizations"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['ROLE_ADMIN', 'ROLE_RELATIONSHIP_MANAGER']}>
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
            <RoleGuard allowedRoles={['ROLE_ADMIN', 'ROLE_RELATIONSHIP_MANAGER']}>
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

      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['ROLE_ADMIN']}>
              <DashboardLayout>
                <AuditLogsPage />
              </DashboardLayout>
            </RoleGuard>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
