import React from 'react';
import { Building2, Users2, ArrowUpRight, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Badge from '@/shared/components/ui/Badge';

export const TopPartnersRankTable = ({ organizations = [], guests = [] }) => {
  const navigate = useNavigate();

  return (
    <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs text-left">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#e38524]" />
            <h3 className="font-heading font-black text-base text-[#000000]">
              Top Partner Organizations & VIP Guests
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Key corporate delegations and high-frequency visiting partners
          </p>
        </div>

        <button
          onClick={() => navigate('/organizations')}
          className="text-xs font-bold text-[#00adef] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>View Directory</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
              <th className="pb-3 pl-2">Entity Name</th>
              <th className="pb-3">Category</th>
              <th className="pb-3 text-center">Visits</th>
              <th className="pb-3 text-right pr-2">Relationship Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {organizations.length === 0 && guests.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-slate-400">
                  No visiting partner records yet
                </td>
              </tr>
            ) : (
              <>
                {/* Partner Organizations */}
                {organizations.slice(0, 4).map((org) => (
                  <tr
                    key={org.id}
                    onClick={() => navigate(`/organizations/${org.id}`)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 pl-2 font-bold text-[#000000] flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#00adef] flex items-center justify-center font-bold text-xs shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="truncate max-w-[180px]">
                        <p className="truncate group-hover:text-[#00adef] transition-colors">
                          {org.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-normal truncate">
                          {org.industrySector || 'Enterprise Partner'}
                        </p>
                      </div>
                    </td>

                    <td className="py-3.5">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-700">
                        Organization
                      </span>
                    </td>

                    <td className="py-3.5 text-center font-black text-[#000000]">
                      {org.totalVisitsCompleted || org.totalVisits || 1}
                    </td>

                    <td className="py-3.5 text-right pr-2">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-[#00adef] to-[#e38524] rounded-full"
                            style={{
                              width: `${Math.min(
                                100,
                                org.relationshipHealthScore || org.relationshipScore || 85
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-700">
                          {org.relationshipHealthScore || org.relationshipScore || 85}/100
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* VIP Guests */}
                {guests.slice(0, 2).map((guest) => (
                  <tr
                    key={guest.id}
                    onClick={() => navigate(`/guests/${guest.id}`)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 pl-2 font-bold text-[#000000] flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#e38524] flex items-center justify-center font-bold text-xs shrink-0">
                        <Users2 className="w-4 h-4" />
                      </div>
                      <div className="truncate max-w-[180px]">
                        <p className="truncate group-hover:text-[#00adef] transition-colors">
                          {guest.fullName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-normal truncate">
                          {guest.titlePosition || guest.affiliation || 'VIP Guest'}
                        </p>
                      </div>
                    </td>

                    <td className="py-3.5">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-orange-50 text-[#e38524] border border-orange-200">
                        VIP Delegate
                      </span>
                    </td>

                    <td className="py-3.5 text-center font-black text-[#000000]">
                      {guest.totalVisitsCompleted || guest.totalVisits || 1}
                    </td>

                    <td className="py-3.5 text-right pr-2">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-linear-to-r from-[#00adef] to-[#e38524] rounded-full"
                            style={{ width: `${guest.relationshipScore || 90}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-700">
                          {guest.relationshipScore || 90}/100
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopPartnersRankTable;
