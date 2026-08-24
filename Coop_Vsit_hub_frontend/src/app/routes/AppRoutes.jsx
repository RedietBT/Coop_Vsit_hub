import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleGuard from './RoleGuard';
import DashboardLayout from '@/core/layouts/DashboardLayout';
import LoginPage from '@/modules/auth/pages/LoginPage';
import VerifyEmailPage from '@/modules/auth/pages/VerifyEmailPage';
import ResetPasswordPage from '@/modules/auth/pages/ResetPasswordPage';
import ExecutiveDashboardPage from '@/modules/analytics/pages/ExecutiveDashboardPage';

// Placeholder for upcoming phases
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
                <WorkspacePlaceholder
                  title="Visits Management Workspace"
                  subtitle="Phase 5 Visits Lifecycle Management module will mount here."
                />
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
                <WorkspacePlaceholder
                  title="Smart Booking Calendar"
                  subtitle="Interactive visual scheduling with conflict detection."
                />
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
                  subtitle="Visitor check-in badging and check-out departure tracking."
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
                  subtitle="Corporate directory and relationship health score analytics."
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
                  subtitle="Tier 1 and Tier 2 VIP delegates directory."
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
                  subtitle="Admin user onboarding, permissions, and role assignment."
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
