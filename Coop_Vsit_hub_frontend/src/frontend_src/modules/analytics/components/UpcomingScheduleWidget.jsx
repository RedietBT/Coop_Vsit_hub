import React from 'react';
import { CalendarDays, MapPin, Users, ArrowUpRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Badge from '@/shared/components/ui/Badge';

export const UpcomingScheduleWidget = ({ visits = [] }) => {
  const navigate = useNavigate();

  const formatScheduleTime = (isoString) => {
    if (!isoString) return 'TBD';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs text-left h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#00adef]" />
            <h3 className="font-heading font-black text-base text-[#000000]">
              Upcoming Scheduled Delegations
            </h3>
          </div>

          <button
            onClick={() => navigate('/visits')}
            className="text-xs font-bold text-[#00adef] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>All Visits</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {visits.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No upcoming scheduled visits on the calendar
            </div>
          ) : (
            visits.slice(0, 4).map((visit) => (
              <div
                key={visit.id}
                onClick={() => navigate(`/visits/${visit.id}`)}
                className="p-4 rounded-2xl bg-slate-50/70 hover:bg-sky-50/40 border border-slate-200/80 hover:border-[#00adef]/40 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="font-mono text-[10px] font-bold text-[#00adef]">
                    {visit.visitCode || 'VIS-2026'}
                  </span>
                  <Badge variant={visit.status} size="sm">
                    {visit.status}
                  </Badge>
                </div>

                <h4 className="font-bold text-xs text-[#000000] group-hover:text-[#00adef] transition-colors truncate">
                  {visit.title}
                </h4>

                <div className="mt-2 pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{formatScheduleTime(visit.scheduledStartTime)}</span>
                  </div>

                  <div className="flex items-center gap-1 text-slate-600 font-medium truncate max-w-[140px]">
                    <MapPin className="w-3 h-3 text-[#e38524] shrink-0" />
                    <span className="truncate">{visit.locationRoom || 'Lobby / Floor Visit'}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-4">
        <span>CoopBank Smart Scheduler</span>
        <span className="font-bold text-[#000000]">{visits.length} Scheduled</span>
      </div>
    </div>
  );
};

export default UpcomingScheduleWidget;
