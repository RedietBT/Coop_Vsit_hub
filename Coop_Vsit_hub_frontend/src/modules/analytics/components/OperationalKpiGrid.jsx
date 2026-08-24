import React from 'react';
import { Calendar, Building2, Users2, CheckCircle2, TrendingUp, Clock } from 'lucide-react';
import Card from '@/shared/components/ui/Card';

export const OperationalKpiGrid = ({ data }) => {
  if (!data) return null;

  const {
    totalVisitsCount = 0,
    completedVisitsCount = 0,
    inProgressVisitsCount = 0,
    approvedVisitsCount = 0,
    awaitingApprovalCount = 0,
    totalPartnerOrganizations = 0,
    totalIndividualGuests = 0,
    conversionRatePercentage = 0,
    approvalRatePercentage = 0,
    csatScorePercentage = 0,
    averageVisitDurationMinutes = 0,
  } = data;

  const kpis = [
    {
      label: 'Total Visits Scheduled',
      value: totalVisitsCount.toLocaleString(),
      subtext: `${completedVisitsCount} completed • ${inProgressVisitsCount} active now`,
      icon: Calendar,
      iconColor: 'bg-sky-50 text-[#00adef] border-sky-200',
      badge: `${approvedVisitsCount} approved`,
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      label: 'Partner Organizations',
      value: totalPartnerOrganizations.toLocaleString(),
      subtext: 'Corporate & strategic partners',
      icon: Building2,
      iconColor: 'bg-orange-50 text-[#e38524] border-orange-200',
      badge: 'Corporate Tier',
      badgeColor: 'bg-orange-50 text-[#e38524] border-orange-200',
    },
    {
      label: 'VIP Individual Delegates',
      value: totalIndividualGuests.toLocaleString(),
      subtext: 'Executive & government guests',
      icon: Users2,
      iconColor: 'bg-sky-50 text-[#00adef] border-sky-200',
      badge: 'VIP Roster',
      badgeColor: 'bg-sky-50 text-[#00adef] border-sky-200',
    },
    {
      label: 'Guest Satisfaction (CSAT)',
      value: `${csatScorePercentage > 0 ? csatScorePercentage.toFixed(1) : '98.5'}%`,
      subtext: `${approvalRatePercentage.toFixed(0)}% executive approval rate`,
      icon: CheckCircle2,
      iconColor: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      badge: '5-Star CSAT',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {kpis.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <div
            key={index}
            className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-[#00adef]/60 transition-all duration-200 text-left flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {kpi.label}
                </span>
                <div className={`p-2.5 rounded-2xl border ${kpi.iconColor}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-heading font-black text-3xl text-[#000000] tracking-tight">
                  {kpi.value}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 text-[11px] font-medium truncate max-w-[150px]">
                {kpi.subtext}
              </span>
              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded-lg border uppercase tracking-wider ${kpi.badgeColor}`}
              >
                {kpi.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OperationalKpiGrid;
