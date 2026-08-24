import React, { useState, useEffect } from 'react';
import { ShieldCheck, CalendarCheck, Clock, CheckCircle2 } from 'lucide-react';
import useSecurityStore from '../store/securityStore';

export const SecurityKpiBanner = () => {
  const { expectedArrivals, activeOnSite, recentDepartures } = useSecurityStore();
  const [timeStr, setTimeStr] = useState(new Date().toLocaleTimeString('en-US'));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString('en-US'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const onSiteCount = activeOnSite.length;
  const arrivalsCount = expectedArrivals.length;
  const departuresCount = recentDepartures.length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
      {/* 1. On-Premises Now */}
      <div className="p-5 rounded-3xl bg-white border border-amber-300 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e38524] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#e38524]" />
            </span>
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
              On-Premises Now
            </span>
          </div>
          <p className="font-heading font-black text-3xl text-[#000000]">
            {onSiteCount} <span className="text-xs font-semibold text-slate-500">Active Badges</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Visitors currently inside the building</p>
        </div>
        <div className="p-3 rounded-2xl bg-amber-50 text-[#e38524] border border-amber-200">
          <ShieldCheck className="w-5 h-5" />
        </div>
      </div>

      {/* 2. Expected Arrivals */}
      <div className="p-5 rounded-3xl bg-white border border-sky-200 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-[#00adef] uppercase tracking-wider">
            Expected Arrivals
          </span>
          <p className="font-heading font-black text-3xl text-[#000000] mt-1">
            {arrivalsCount} <span className="text-xs font-semibold text-slate-500">Scheduled</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Approved delegations awaiting check-in</p>
        </div>
        <div className="p-3 rounded-2xl bg-sky-50 text-[#00adef] border border-sky-200">
          <CalendarCheck className="w-5 h-5" />
        </div>
      </div>

      {/* 3. Checked-Out Today */}
      <div className="p-5 rounded-3xl bg-white border border-emerald-200 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
            Checked-Out Today
          </span>
          <p className="font-heading font-black text-3xl text-emerald-800 mt-1">
            {departuresCount} <span className="text-xs font-semibold text-slate-500">Visits</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Badges returned & surveys dispatched</p>
        </div>
        <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>

      {/* 4. Real-Time Front Desk Clock */}
      <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Local Digital Time
          </span>
          <p className="font-heading font-black text-2xl text-[#000000] mt-1 font-mono tracking-tight">
            {timeStr}
          </p>
          <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Front Desk Synchronized
          </p>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50 text-slate-700 border border-slate-200">
          <Clock className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default SecurityKpiBanner;
