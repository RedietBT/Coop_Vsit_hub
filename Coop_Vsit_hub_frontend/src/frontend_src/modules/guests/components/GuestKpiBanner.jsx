import React from 'react';
import { Users2, Crown, Award, ShieldCheck } from 'lucide-react';
import useGuestStore from '../store/guestStore';

export const GuestKpiBanner = () => {
  const { totalElements, guestStats, guests } = useGuestStore();

  const tier1Count =
    guestStats?.tier1Count || guests.filter((g) => g.vipTier === 'TIER_1').length;
  const tier2Count =
    guestStats?.tier2Count || guests.filter((g) => g.vipTier === 'TIER_2').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
      {/* Total VIPs */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Total VIP Guests
          </span>
          <p className="font-heading font-black text-3xl text-[#000000] mt-1">
            {totalElements}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">High-profile individual delegates</p>
        </div>
        <div className="p-3 rounded-2xl bg-sky-50 text-[#00adef] border border-sky-200">
          <Users2 className="w-5 h-5" />
        </div>
      </div>

      {/* Tier 1 Executive VIPs */}
      <div className="p-5 rounded-3xl bg-white border border-amber-300 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-[#e38524] uppercase tracking-wider">
            VIP Tier 1 (Executive)
          </span>
          <p className="font-heading font-black text-3xl text-[#000000] mt-1">
            {tier1Count} <span className="text-xs font-semibold text-slate-500">Delegates</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">C-Level & Government Dignitaries</p>
        </div>
        <div className="p-3 rounded-2xl bg-amber-50 text-[#e38524] border border-amber-200">
          <Crown className="w-5 h-5" />
        </div>
      </div>

      {/* Tier 2 VIPs */}
      <div className="p-5 rounded-3xl bg-white border border-sky-200 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-[#00adef] uppercase tracking-wider">
            VIP Tier 2 (Strategic)
          </span>
          <p className="font-heading font-black text-3xl text-[#000000] mt-1">
            {tier2Count} <span className="text-xs font-semibold text-slate-500">Delegates</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Directors & Senior Advisors</p>
        </div>
        <div className="p-3 rounded-2xl bg-sky-50 text-[#00adef] border border-sky-200">
          <Award className="w-5 h-5" />
        </div>
      </div>

      {/* Verified ID Credentials */}
      <div className="p-5 rounded-3xl bg-white border border-emerald-200 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
            ID Credentials Verified
          </span>
          <p className="font-heading font-black text-3xl text-emerald-800 mt-1">
            100% <span className="text-xs font-semibold text-slate-500">Secured</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Passports & National IDs logged</p>
        </div>
        <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default GuestKpiBanner;
