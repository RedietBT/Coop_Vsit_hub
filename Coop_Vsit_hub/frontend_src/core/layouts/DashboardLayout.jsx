import React from 'react';
import Sidebar from '@/shared/components/navigation/Sidebar';
import Topbar from '@/shared/components/navigation/Topbar';
import Breadcrumbs from '@/shared/components/navigation/Breadcrumbs';
import NotificationDrawer from '@/modules/notifications/components/NotificationDrawer';

export const DashboardLayout = ({ children }) => {
  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* Role-Aware Left Sidebar */}
      <Sidebar />

      {/* Main App Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky Topbar */}
        <Topbar />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <Breadcrumbs />
            {children}
          </div>
        </main>
      </div>

      {/* Global Slide-out Notification Drawer */}
      <NotificationDrawer />
    </div>
  );
};

export default DashboardLayout;
