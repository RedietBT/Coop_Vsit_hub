import React from 'react';
import { Building2, Award, Globe, TrendingUp, Sparkles } from 'lucide-react';
import useOrganizationStore from '../store/organizationStore';

export const OrganizationKpiBanner = () => {
  const { totalElements, portfolioStats, organizations } = useOrganizationStore();

  const avgScore =
    portfolioStats?.averageRelationshipScore ||
    (organizations.length > 0
      ? (
          organizations.reduce(
            (acc, curr) => acc + (curr.relationshipScore || 85),
            0
          ) / organizations.length
        ).toFixed(1)
      : '88.0');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
      {/* Total Partners */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total Partner Orgs
          </span>
          <p className="font-heading font-black text-3xl text-[#000000] mt-1">
            {totalElements}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Strategic & enterprise alliances</p>
        </div>
        <div className="p-3 rounded-2xl bg-sky-50 text-[#00adef] border border-sky-200">
          <Building2 className="w-5 h-5" />
        </div>
      </div>

      {/* Average Relationship Health Score */}
      <div className="p-5 rounded-3xl bg-white border border-orange-200 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-[#e38524] uppercase tracking-wider">
            Relationship Health Index
          </span>
          <p className="font-heading font-black text-3xl text-[#000000] mt-1">
            {avgScore} <span className="text-xs font-semibold text-slate-500">/ 100</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Average across partner portfolio</p>
        </div>
        <div className="p-3 rounded-2xl bg-orange-50 text-[#e38524] border border-orange-200">
          <Award className="w-5 h-5" />
        </div>
      </div>

      {/* Global / Market Reach */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Market Sectors
          </span>
          <p className="font-heading font-black text-3xl text-[#000000] mt-1">
            {portfolioStats?.totalSectorsCount || 6} <span className="text-xs font-semibold text-slate-500">Industries</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Telecom, FinTech, Government</p>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 text-slate-700 border border-slate-200">
          <Globe className="w-5 h-5" />
        </div>
      </div>

      {/* Active Pipeline Engagement */}
      <div className="p-5 rounded-3xl bg-white border border-emerald-200 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
            Active Delegations
          </span>
          <p className="font-heading font-black text-3xl text-emerald-800 mt-1">
            100% <span className="text-xs font-semibold text-slate-500">Verified</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">High-affinity corporate partners</p>
        </div>
        <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
          <TrendingUp className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default OrganizationKpiBanner;
