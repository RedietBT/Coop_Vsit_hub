import React from 'react';
import { Building2, Users2, ArrowUpRight, Star, Clock, DoorOpen, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const getRatingLabel = (score) => {
  if (!score) return 'In Progress';
  if (score >= 4.5) return 'Exceptional';
  if (score >= 3.8) return 'Very Good';
  if (score >= 3.0) return 'Standard';
  return 'Fair';
};

export const RecentVisitsTable = ({ visits = [] }) => {
  const navigate = useNavigate();

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs text-left">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#00adef]" />
            <h3 className="font-heading font-black text-base text-[#000000]">
              Recent Executive Visits & Guest Experience
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Latest visitor delegations, room allocations, and direct satisfaction ratings
          </p>
        </div>

        <button
          onClick={() => navigate('/visits')}
          className="text-xs font-bold text-[#00adef] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>View All Visits</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
              <th className="pb-3 pl-2">Visitor / Delegation</th>
              <th className="pb-3">Meeting Room</th>
              <th className="pb-3">Date & Time</th>
              <th className="pb-3 text-right pr-2">Guest Rating</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visits.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400">
                  No recent visit records found
                </td>
              </tr>
            ) : (
              visits.slice(0, 6).map((visit) => {
                const isOrg = visit.guestCategory === 'ORGANIZATION';
                const hasFeedback = Boolean(visit.feedbackSubmitted);
                const starScore = hasFeedback && visit.guestRating ? Number(visit.guestRating) : null;

                return (
                  <tr
                    key={visit.id}
                    onClick={() => navigate(`/visits?highlight=${visit.visitCode || visit.id}`)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    {/* Visitor / Delegation */}
                    <td className="py-3.5 pl-2 font-bold text-[#000000] flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isOrg ? 'bg-sky-50 text-[#00adef]' : 'bg-orange-50 text-[#e38524]'
                        }`}
                      >
                        {isOrg ? <Building2 className="w-4 h-4" /> : <Users2 className="w-4 h-4" />}
                      </div>
                      <div className="truncate max-w-[200px]">
                        <p className="truncate group-hover:text-[#00adef] transition-colors font-bold text-slate-900">
                          {visit.guestDisplayName || visit.title || 'Executive Visitor'}
                        </p>
                        <p className="text-[10px] text-slate-400 font-normal truncate">
                          {visit.visitCode} • {visit.requestingDepartment || 'Bank Host'}
                        </p>
                      </div>
                    </td>

                    {/* Room */}
                    <td className="py-3.5">
                      {visit.locationRoom ? (
                        <div className="inline-flex items-center gap-1 text-slate-700 font-semibold text-[11px]">
                          <DoorOpen className="w-3.5 h-3.5 text-[#00adef] shrink-0" />
                          <span className="truncate max-w-[130px]">{visit.locationRoom}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">—</span>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 font-mono text-[11px] text-slate-600">
                      {formatDate(visit.scheduledStartTime || visit.createdAt)}
                    </td>

                    {/* Rating or In Progress */}
                    <td className="py-3.5 text-right pr-2">
                      {hasFeedback && starScore ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-900 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-mono">{starScore.toFixed(1)}</span>
                          <span className="text-[10px] text-amber-700 font-medium">({getRatingLabel(starScore)})</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200/70">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>In Progress</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentVisitsTable;
