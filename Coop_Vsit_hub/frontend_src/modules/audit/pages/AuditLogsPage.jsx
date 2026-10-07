import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  RotateCcw,
  Sparkles,
  Lock,
  UserCheck,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  FileCode,
} from 'lucide-react';
import useAuditStore from '../store/auditStore';
import Button from '@/shared/components/ui/Button';
import Spinner from '@/shared/components/ui/Spinner';

const EVENT_TYPES = [
  { label: 'All Events', value: '' },
  { label: 'Login Success', value: 'LOGIN_SUCCESS' },
  { label: 'Login Failed', value: 'LOGIN_FAILED' },
  { label: 'Password Changed', value: 'PASSWORD_CHANGED' },
  { label: 'User Registered', value: 'USER_REGISTERED' },
  { label: 'User Roles Updated', value: 'USER_ROLES_UPDATED' },
  { label: 'Visit Created', value: 'VISIT_CREATED' },
  { label: 'Visit Approved', value: 'VISIT_APPROVED' },
  { label: 'Visitor Checked In', value: 'VISITOR_CHECKED_IN' },
  { label: 'Visitor Checked Out', value: 'VISITOR_CHECKED_OUT' },
  { label: 'Feedback Submitted', value: 'FEEDBACK_SUBMITTED' },
];

export const AuditLogsPage = () => {
  const {
    logs,
    totalElements,
    totalPages,
    currentPage,
    isLoading,
    filters,
    fetchLogs,
    setFilters,
    resetFilters,
    setPage,
  } = useAuditStore();

  const [searchInput, setSearchInput] = useState(filters.search || '');

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters({ search: searchInput });
  };

  const getEventBadge = (eventType, status) => {
    const isSuccess = status === 'SUCCESS';
    if (eventType.includes('LOGIN_FAILED') || !isSuccess) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
          <ShieldAlert className="w-3 h-3" />
          {eventType}
        </span>
      );
    }
    if (eventType.includes('LOGIN_SUCCESS') || eventType.includes('REGISTERED')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-[#00adef] border border-sky-200 text-[10px] font-bold">
          <ShieldCheck className="w-3 h-3" />
          {eventType}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-[#e38524] border border-amber-200 text-[10px] font-bold">
        <Sparkles className="w-3 h-3" />
        {eventType}
      </span>
    );
  };

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-[#00adef] border border-sky-200 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Compliance & Security Audit Trail</span>
          </div>

          <h1 className="font-heading font-black text-2xl sm:text-3xl text-[#000000] tracking-tight">
            System & Security Activity Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Immutable audit record of all authentication events, administrative actions, and delegation milestones.
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={fetchLogs}
          disabled={isLoading}
          icon={RotateCcw}
        >
          Refresh Logs
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by username (e.g. admin, dalemu)..."
            className="w-full pl-10 pr-20 py-2.5 text-xs rounded-2xl bg-white border border-slate-200 shadow-xs placeholder:text-slate-400 text-slate-900 focus:outline-none focus:border-[#00adef]"
          />
          <button
            type="submit"
            className="absolute inset-y-1.5 right-1.5 px-3 rounded-xl bg-slate-100 hover:bg-[#00adef] hover:text-white text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2.5 shrink-0">
          <select
            value={filters.eventType || ''}
            onChange={(e) => setFilters({ eventType: e.target.value })}
            className="text-xs font-semibold py-2.5 px-3 rounded-2xl bg-white border border-slate-200 text-slate-700 shadow-xs focus:outline-none focus:border-[#00adef] cursor-pointer"
          >
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          {(filters.search || filters.eventType) && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                resetFilters();
              }}
              className="p-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
              title="Reset Filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <Spinner size="lg" color="navy" />
            <p className="text-xs text-slate-500 font-bold">Loading security audit records...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No audit events match your search criteria</p>
            <p className="text-xs text-slate-400 mt-1">Try broadening your search or resetting filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">Timestamp</th>
                  <th className="py-3.5 px-5">Event Type</th>
                  <th className="py-3.5 px-5">Staff User</th>
                  <th className="py-3.5 px-5">IP Address</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-5 font-mono text-slate-600 text-[11px] whitespace-nowrap">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      {getEventBadge(log.eventType || 'SYSTEM_EVENT', log.status)}
                    </td>
                    <td className="py-3.5 px-5">
                      <p className="font-bold text-slate-900">{log.username || 'Anonymous'}</p>
                      {log.userFullName && (
                        <p className="text-[10px] text-slate-400">{log.userFullName}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-500 text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          log.status === 'SUCCESS'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 max-w-xs truncate text-[11px]">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50 text-xs">
          <span className="text-slate-500 font-medium">
            Page <span className="font-bold text-slate-900">{currentPage + 1}</span> of{' '}
            <span className="font-bold text-slate-900">{Math.max(1, totalPages)}</span> ({totalElements} entries)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
