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
import MeetingRoomsBarChart from '../components/MeetingRoomsBarChart';
import RecentVisitsTable from '../components/RecentVisitsTable';
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
    refreshAll,
  } = useAnalyticsStore();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading font-black text-2xl text-[#000000]">
              Executive Analytics Cockpit
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#00adef]/10 text-[#00adef] uppercase tracking-wider">
              Realtime
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise visit intelligence, deal pipeline valuations, and guest satisfaction metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Privacy Toggle for Strategic Deal Valuations */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleShowFinancials}
            icon={showFinancials ? EyeOff : Eye}
            className="text-xs"
          >
            {showFinancials ? 'Hide Deal Values' : 'Show Deal Values'}
          </Button>

          {/* Hard Refresh Data */}
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshAll}
            icon={RotateCcw}
            className="text-xs"
          >
            Refresh
          </Button>

          {/* Direct Visit Booking Action */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/visits/calendar')}
            icon={Plus}
            className="text-xs"
          >
            Schedule Visit
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && !dashboardData && (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Spinner size="lg" color="navy" />
          <p className="text-xs font-bold text-slate-500">Aggregating executive cockpit telemetry...</p>
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
            <MeetingRoomsBarChart visitsByRoom={dashboardData.visitsByMeetingRoom} />
          </div>

          {/* 4. Recent Visits Stream & Upcoming Timetable */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RecentVisitsTable visits={dashboardData.recentVisits || []} />
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
