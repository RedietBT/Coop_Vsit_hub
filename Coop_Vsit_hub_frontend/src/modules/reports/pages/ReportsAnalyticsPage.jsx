import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Filter,
  RotateCcw,
  Users,
  Building2,
  DollarSign,
  Clock,
  Star,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Search,
  CheckCircle,
  Calendar,
  Layers,
  DoorOpen,
} from 'lucide-react';
import useReportStore from '../store/reportStore';
import useMasterDataStore from '@/modules/master_data/store/masterDataStore';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Badge from '@/shared/components/ui/Badge';
import Spinner from '@/shared/components/ui/Spinner';

export const ReportsAnalyticsPage = () => {
  const {
    summary,
    reportItems,
    page,
    size,
    totalPages,
    totalElements,
    isLoading,
    isExporting,
    startDate,
    endDate,
    department,
    activeTab,
    setFilters,
    setActiveTab,
    setPage,
    fetchReportData,
    exportCsv,
    exportPdf,
  } = useReportStore();

  const { departments, fetchDepartments } = useMasterDataStore();

  const [localStart, setLocalStart] = useState(startDate);
  const [localEnd, setLocalEnd] = useState(endDate);
  const [localDept, setLocalDept] = useState(department || 'All Departments');

  useEffect(() => {
    fetchDepartments(true);
    fetchReportData();
  }, [fetchDepartments, fetchReportData]);

  const handleApplyFilter = (e) => {
    e.preventDefault();
    setFilters({
      startDate: localStart,
      endDate: localEnd,
      department: localDept,
    });
    fetchReportData();
  };

  const handleResetFilter = () => {
    setLocalStart('');
    setLocalEnd('');
    setLocalDept('All Departments');
    setFilters({
      startDate: '',
      endDate: '',
      department: 'All Departments',
    });
    fetchReportData();
  };

  const formatTimestamp = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#00adef] border border-blue-200 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Executive Audit & Reporting</span>
          </div>

          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#000000] tracking-tight">
            Visitor Report & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Detailed visitor logs, department engagement metrics, duration analysis, and executive exports.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={exportCsv}
            disabled={isExporting}
            icon={FileSpreadsheet}
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
          >
            Export CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exportPdf}
            disabled={isExporting}
            icon={FileText}
            className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300"
          >
            Export PDF
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchReportData}
            disabled={isLoading}
            icon={RotateCcw}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* 1. Report Filters Card (Matching Image 2) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800 border-b border-slate-100 pb-2.5">
          <Filter className="w-4 h-4 text-[#00adef]" />
          <span>Report Filters & Date Range</span>
        </div>

        <form onSubmit={handleApplyFilter} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Start Date
            </label>
            <Input
              type="date"
              value={localStart}
              onChange={(e) => setLocalStart(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              End Date
            </label>
            <Input
              type="date"
              value={localEnd}
              onChange={(e) => setLocalEnd(e.target.value)}
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Department
            </label>
            <select
              value={localDept}
              onChange={(e) => setLocalDept(e.target.value)}
              className="w-full px-3 py-2.5 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#00adef]"
            >
              <option value="All Departments">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
              <option value="Growth and Operations">Growth and Operations</option>
              <option value="Digital Banking & Technology">Digital Banking & Technology</option>
              <option value="Executive Secretariat">Executive Secretariat</option>
              <option value="Corporate Alliances">Corporate Alliances</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              variant="primary"
              size="md"
              icon={Filter}
              className="flex-1"
            >
              Apply Filter
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={handleResetFilter}
            >
              Reset
            </Button>
          </div>
        </form>
      </div>

      {/* 2. KPI Summary Highlights (Matching Image 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Visitors */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-[#00adef] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Total Visitors
            </p>
            <h3 className="font-heading font-black text-2xl text-[#000000] mt-0.5">
              {summary ? summary.totalVisitors : '—'}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Filtered time window
            </p>
          </div>
        </div>

        {/* Most Visited Meeting Room */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <DoorOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Most Visited Room
            </p>
            <h3 className="font-heading font-black text-sm text-[#000000] mt-0.5 truncate max-w-[160px]">
              {summary && summary.topMeetingRoom ? summary.topMeetingRoom : 'Executive Boardroom'}
            </h3>
            <p className="text-[10px] text-purple-600 font-bold mt-0.5">
              {summary && summary.topMeetingRoomVisitorsCount ? summary.topMeetingRoomVisitorsCount : 0} Reservations
            </p>
          </div>
        </div>

        {/* Pipeline Value ($M USD) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Pipeline Opportunity
            </p>
            <h3 className="font-heading font-black text-2xl text-[#000000] mt-0.5">
              ${summary && summary.totalOpportunityUSD
                ? (summary.totalOpportunityUSD / 1000000).toFixed(1)
                : '0.0'}M
            </h3>
            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">
              Strategic Deals in Flight
            </p>
          </div>
        </div>

        {/* Active In-Lobby Guests */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#e38524] flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Active In-Lobby
            </p>
            <h3 className="font-heading font-black text-2xl text-[#000000] mt-0.5">
              {summary ? summary.activeVisitorsCount : 0}
            </h3>
            <p className="text-[10px] text-[#e38524] font-bold mt-0.5">
              {summary ? summary.completedVisitorsCount : 0} Completed
            </p>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('detailed')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'detailed'
              ? 'bg-white text-[#000000] shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-[#00adef]" />
          <span>Detailed Report</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rooms')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'rooms' || activeTab === 'departments'
              ? 'bg-white text-[#000000] shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <DoorOpen className="w-3.5 h-3.5 text-[#e38524]" />
          <span>Room Activity</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('financials')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'financials'
              ? 'bg-white text-[#000000] shadow-xs'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          <span>Pipeline & Valuation</span>
        </button>
      </div>

      {/* 4. Tab 1: Detailed Visitor Report Table */}
      {activeTab === 'detailed' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-heading font-black text-base text-[#000000]">
              Visitor Check-In Log & Activity Report
            </h2>
            <span className="text-xs font-bold text-slate-500">
              Showing {reportItems.length} of {totalElements} Records (Latest First)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 pl-6">Visitor ID</th>
                  <th className="py-3 px-4">Visitor Name</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Meeting Room</th>
                  <th className="py-3 px-4">Meeting With</th>
                  <th className="py-3 px-4">Check-In Time</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Feedback Rating</th>
                  <th className="py-3 pr-6 text-right">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Spinner size="lg" color="navy" />
                        <p className="text-xs font-bold text-slate-500">Loading visitor reports...</p>
                      </div>
                    </td>
                  </tr>
                ) : reportItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-20 text-center text-slate-400">
                      <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-xs font-bold text-slate-600">No visitor records found for selected filters</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting date range or department filter</p>
                    </td>
                  </tr>
                ) : (
                  reportItems.map((item, idx) => {
                    const isSubmitted = item.feedback && item.feedback !== 'In Progress' && item.feedback.includes('★');
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Visitor ID */}
                        <td className="py-3.5 pl-6 font-mono font-bold text-[#00adef]">
                          {item.visitCode || `#${page * size + idx + 1}`}
                        </td>

                        {/* Visitor Name */}
                        <td className="py-3.5 px-4 font-bold text-[#000000]">
                          {item.name}
                        </td>

                        {/* Phone Number */}
                        <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-700">
                          {item.phone && item.phone !== '—' ? (
                            <span className="text-slate-800">{item.phone}</span>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>

                        {/* Meeting Room */}
                        <td className="py-3.5 px-4">
                          {item.floor && item.floor !== '—' && item.floor !== 'Lobby / Floor Visit' ? (
                            <div className="flex items-center gap-1.5 font-bold text-slate-900">
                              <DoorOpen className="w-3.5 h-3.5 text-[#00adef] shrink-0" />
                              <span>{item.floor}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic font-normal">—</span>
                          )}
                        </td>

                        {/* Meeting With */}
                        <td className="py-3.5 px-4 text-xs font-semibold">
                          {item.meetingWith && item.meetingWith !== '—' && item.meetingWith.trim() !== '' ? (
                            <span className="text-slate-900 font-bold">{item.meetingWith}</span>
                          ) : (
                            <span className="text-slate-400 italic font-normal">—</span>
                          )}
                        </td>

                        {/* Check-In Time */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                          {formatTimestamp(item.checkInTime)}
                        </td>

                        {/* Duration */}
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px]">
                            {item.duration || '—'}
                          </span>
                        </td>

                        {/* Feedback Rating or In Progress */}
                        <td className="py-3.5 px-4">
                          {isSubmitted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              <span>{item.feedback}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200/70">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>In Progress</span>
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 pr-6 text-right">
                          <Badge status={item.status} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page <span className="font-bold text-slate-800">{page + 1}</span> of{' '}
              <span className="font-bold text-slate-800">{totalPages}</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Meeting Room Stats */}
      {(activeTab === 'rooms' || activeTab === 'departments') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <DoorOpen className="w-5 h-5 text-[#00adef]" />
              <h3 className="font-heading font-black text-base text-[#000000]">
                Most Visited Meeting Rooms
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Live proportion of visiting executive delegations allocated across bank meeting facilities.
            </p>

            {(summary?.roomDistribution && summary.roomDistribution.length > 0) ||
            (summary?.departmentDistribution && summary.departmentDistribution.length > 0) ? (
              <div className="space-y-3 pt-2">
                {(summary.roomDistribution?.length ? summary.roomDistribution : summary.departmentDistribution).map((d, index) => {
                  const colors = ['bg-[#00adef]', 'bg-[#e38524]', 'bg-purple-600', 'bg-emerald-600', 'bg-sky-600'];
                  const color = colors[index % colors.length];
                  return (
                    <div key={d.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-800">
                        <span>{d.name}</span>
                        <span>{d.count} visit{d.count > 1 ? 's' : ''} ({d.pct})</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: d.pct }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No meeting room visit records found for this period.
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#e38524]" />
              <h3 className="font-heading font-black text-base text-[#000000]">
                Average Visit Duration by Room
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Live meeting dwell time and executive facility usage computed from actual visit timestamps.
            </p>

            {(summary?.roomDwellStats && summary.roomDwellStats.length > 0) ||
            (summary?.departmentDwellStats && summary.departmentDwellStats.length > 0) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {(summary.roomDwellStats?.length ? summary.roomDwellStats : summary.departmentDwellStats).map((d, index) => {
                  const styles = [
                    { bg: 'bg-sky-50/60', border: 'border-sky-100', text: 'text-sky-700', val: 'text-sky-900', sub: 'text-sky-600' },
                    { bg: 'bg-orange-50/60', border: 'border-orange-100', text: 'text-[#e38524]', val: 'text-orange-950', sub: 'text-orange-700' },
                    { bg: 'bg-purple-50/60', border: 'border-purple-100', text: 'text-purple-700', val: 'text-purple-950', sub: 'text-purple-700' },
                    { bg: 'bg-emerald-50/60', border: 'border-emerald-100', text: 'text-emerald-700', val: 'text-emerald-950', sub: 'text-emerald-700' },
                  ];
                  const style = styles[index % styles.length];
                  return (
                    <div key={d.name} className={`p-4 rounded-2xl ${style.bg} border ${style.border}`}>
                      <p className={`text-[10px] font-bold uppercase truncate ${style.text}`}>{d.name}</p>
                      <p className={`font-heading font-black text-xl mt-1 ${style.val}`}>{d.formattedDuration}</p>
                      <p className={`text-[10px] mt-0.5 ${style.sub}`}>{d.subtitle}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                No duration data recorded for this period.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Tab 3: Financial Pipeline Valuation (100% Real Dynamic Data) */}
      {activeTab === 'financials' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-6">
          <div>
            <h3 className="font-heading font-black text-base text-[#000000]">
              Strategic Opportunity & Financial Pipeline Valuation
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Real aggregated strategic alliance and deal value ($M USD) driven by high-level guest delegations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-left">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Total Active Pipeline</p>
              <p className="font-heading font-black text-3xl text-emerald-900 mt-1">
                ${summary && summary.totalOpportunityUSD ? (Number(summary.totalOpportunityUSD) / 1000000).toFixed(2) : '0.00'}M
              </p>
              <p className="text-[11px] text-emerald-700 mt-1">
                {summary?.totalDealsCount ?? 0} Active Strategic Deal{summary?.totalDealsCount === 1 ? '' : 's'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-sky-50 border border-sky-200 text-left">
              <p className="text-[10px] font-bold text-[#00adef] uppercase tracking-wider">Visit Completion Rate</p>
              <p className="font-heading font-black text-3xl text-sky-900 mt-1">
                {summary?.conversionRate ?? 0}%
              </p>
              <p className="text-[11px] text-sky-700 mt-1">
                {summary?.completedVisitorsCount ?? 0} Completed / {summary?.totalVisitors ?? 0} Total
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200 text-left">
              <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Avg Deal Size / Opportunity</p>
              <p className="font-heading font-black text-3xl text-purple-900 mt-1">
                ${summary && summary.avgDealSize ? (Number(summary.avgDealSize) / 1000000).toFixed(2) : '0.00'}M
              </p>
              <p className="text-[11px] text-purple-700 mt-1">Per visiting strategic partner</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsAnalyticsPage;
