import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleGuard from './RoleGuard';
import DashboardLayout from '@/core/layouts/DashboardLayout';
import LoginPage from '@/modules/auth/pages/LoginPage';
import VerifyEmailPage from '@/modules/auth/pages/VerifyEmailPage';
import ResetPasswordPage from '@/modules/auth/pages/ResetPasswordPage';
import useAuthStore from '@/modules/auth/store/authStore';
import Card from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import {
  Sparkles,
  Calendar,
  Building2,
  Users2,
  ShieldCheck,
  LayoutDashboard,
} from 'lucide-react';

// Temporary Phase 3 Preview Page
const DashboardShellPreview = () => {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Welcome Banner */}
      <div className="p-8 rounded-3xl bg-linear-to-r from-[#00adef] to-[#0093cc] text-white shadow-lg shadow-sky-500/20 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/15 rounded-full blur-2xl" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#e38524]" />
            <span>CoopBank DxValley Live</span>
          </div>

          <h1 className="font-heading font-black text-3xl mb-2 text-white">
            Welcome back, {user?.fullName || 'Bank Officer'}!
          </h1>
          <p className="text-white/90 text-sm max-w-2xl leading-relaxed">
            CoopBank Visit Hub shell initialized with role-based navigation, live audio alerts, and staff notifications.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-white/80">Active Authorized Roles:</span>
            {user?.roles?.map((role) => (
              <span
                key={role}
                className="px-2.5 py-1 text-xs font-black rounded-lg bg-white text-[#000000] shadow-xs"
              >
                {role.replace('ROLE_', '')}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Preview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="hover:border-[#00adef] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase">Visits</span>
            <div className="p-2 rounded-xl bg-sky-50 text-[#00adef]">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="font-heading font-black text-2xl text-[#000000]">Active Hub</p>
          <p className="text-xs text-slate-500 mt-1">Multi-step booking wizard & conflict checks</p>
        </Card>

        <Card className="hover:border-[#e38524] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase">Front Desk</span>
            <div className="p-2 rounded-xl bg-orange-50 text-[#e38524]">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="font-heading font-black text-2xl text-[#000000]">Security Cockpit</p>
          <p className="text-xs text-slate-500 mt-1">1-click badge & check-in logging</p>
        </Card>

        <Card className="hover:border-[#00adef] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase">Partners</span>
            <div className="p-2 rounded-xl bg-sky-50 text-[#00adef]">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="font-heading font-black text-2xl text-[#000000]">Corporate Directory</p>
          <p className="text-xs text-slate-500 mt-1">Ethio Telecom, Visa Inc., Safaricom</p>
        </Card>

        <Card className="hover:border-[#e38524] transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase">VIP Guests</span>
            <div className="p-2 rounded-xl bg-orange-50 text-[#e38524]">
              <Users2 className="w-4 h-4" />
            </div>
          </div>
          <p className="font-heading font-black text-2xl text-[#000000]">VIP Intelligence</p>
          <p className="text-xs text-slate-500 mt-1">VIP Tier 1 & 2 individual delegates</p>
        </Card>
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

      {/* Protected Routes inside Global DashboardLayout Shell */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleGuard allowedRoles={['ROLE_ADMIN', 'ROLE_EXECUTIVE', 'ROLE_RELATIONSHIP_MANAGER']}>
              <DashboardLayout>
                <DashboardShellPreview />
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
                <DashboardShellPreview />
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
                <DashboardShellPreview />
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
                <DashboardShellPreview />
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
                <DashboardShellPreview />
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
                <DashboardShellPreview />
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
                <DashboardShellPreview />
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
