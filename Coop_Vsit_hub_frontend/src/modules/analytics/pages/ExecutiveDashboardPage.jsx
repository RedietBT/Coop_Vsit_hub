import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RotateCcw,
  Plus,
  Eye,
  EyeOff,
  Sparkles,
  Calendar,
  Building2,
  Users2,
  Award,
} from 'lucide-react';
import useAnalyticsStore from '../store/analyticsStore';
import useAuthStore from '@/modules/auth/store/authStore';
import OperationalKpiGrid from '../components/OperationalKpiGrid';
import FinancialKpiSection from '../components/FinancialKpiSection';
import StatusDonutChart from '../components/StatusDonutChart';
import DepartmentBarChart from '../components/DepartmentBarChart';
import TopPartnersRankTable from '../components/TopPartnersRankTable';
import VisitorTestimonialsWidget from '../components/VisitorTestimonialsWidget';
import UpcomingScheduleWidget from '../components/UpcomingScheduleWidget';
import Button from '@/shared/components/ui/Button';
import Spinner from '@/shared/components/ui/Spinner';

export const ExecutiveDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    dashboardData,
    feedbackData,
    isLoading,
    showFinancials,
    fetchDashboard,
    toggleShowFinancials,
  } = useAnalyticsStore();

  useEffect(() => {
    fetchDashboard(false);
  }, [fetchDashboard]);

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Top Header & Executive Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 text-[#00adef] border border-sky-200 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#e38524]" />
            <span>CoopBank DxValley Intelligence</span>
          </div>

          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#000000] tracking-tight">
            Executive Analytics Cockpit
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time bank delegation volume, partner directories, and CSAT guest sentiment.
          </p>
        </div>

        {/* Action Buttons & Privacy Switch */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Financial Privacy Switch */}
          <Button
            variant={showFinancials ? 'orange' : 'outline-cyan'}
            size="sm"
            onClick={toggleShowFinancials}
            icon={showFinancials ? EyeOff : Eye}
          >
            {showFinancials ? 'Hide Financials' : 'Show Financial ($)'}
          </Button>

          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchDashboard(true)}
            disabled={isLoading}
            icon={RotateCcw}
          >
            Refresh
          </Button>

          {/* New Visit Request CTA */}
          <Button
            variant="orange"
            size="sm"
            onClick={() => navigate('/visits')}
            icon={Plus}
          >
            New Visit Request
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && !dashboardData && (
        <div className="py-32 flex flex-col items-center justify-center space-y-4">
          <Spinner size="xl" color="navy" />
          <p className="text-sm font-bold text-slate-700">Loading Executive Analytics...</p>
        </div>
      )}

      {/* Main Dashboard Content */}
      {dashboardData && (
        <div className="space-y-6">
          {/* 1. Operational Volume KPI Grid (Primary Focus) */}
          <OperationalKpiGrid data={dashboardData} />

          {/* 2. Financial Deal Pipeline (Collapsible based on user privacy toggle) */}
          <FinancialKpiSection isVisible={showFinancials} data={dashboardData} />

          {/* 3. Recharts Visualizations Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatusDonutChart visitsByStatus={dashboardData.visitsByStatus} />
            <DepartmentBarChart visitsByDepartment={dashboardData.visitsByDepartment} />
          </div>

          {/* 4. Top Partners Ranking & Upcoming Timetable */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TopPartnersRankTable
                organizations={dashboardData.topPartnerOrganizations}
                guests={dashboardData.topVipGuests}
              />
            </div>
            <div className="lg:col-span-1">
              <UpcomingScheduleWidget visits={dashboardData.upcomingScheduledVisits} />
            </div>
          </div>

          {/* 5. Curated Visitor Feedback & CSAT Testimonials */}
          <VisitorTestimonialsWidget
            feedbackReviews={feedbackData?.recentFeedbackReviews || []}
          />
        </div>
      )}
    </div>
  );
};

export default ExecutiveDashboardPage;
