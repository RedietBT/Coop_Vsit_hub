import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Landmark, TrendingUp, ShieldCheck } from 'lucide-react';

export const FinancialKpiSection = ({ isVisible, data }) => {
  if (!data) return null;

  const {
    totalPipelineValue = 0,
    realizedCompletedValue = 0,
    activePipelineValue = 0,
    pendingReviewValue = 0,
    averageDealSize = 0,
    currency = 'USD',
  } = data;

  const formatCurrency = (val) => {
    if (!val && val !== 0) return '$0';
    const num = Number(val);
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    }
    if (num >= 1000) {
      return `$${(num / 1000).toFixed(0)}K`;
    }
    return `$${num.toLocaleString()}`;
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden space-y-3 text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                <DollarSign className="w-4 h-4" />
              </div>
              <h3 className="font-heading font-black text-sm text-[#000000] uppercase tracking-wider">
                Financial Deal Pipeline Valuation ({currency})
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Confidential Leadership Metrics
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Pipeline */}
            <div className="p-5 rounded-3xl bg-linear-to-br from-slate-900 to-slate-800 text-white shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase">
                  Total Pipeline Value
                </span>
                <Landmark className="w-4 h-4 text-[#e38524]" />
              </div>
              <p className="font-heading font-black text-2xl text-white">
                {formatCurrency(totalPipelineValue)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Aggregated visit opportunities</p>
            </div>

            {/* Realized Completed Deals */}
            <div className="p-5 rounded-3xl bg-white border border-emerald-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-emerald-700 uppercase">
                  Realized / Completed
                </span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="font-heading font-black text-2xl text-emerald-700">
                {formatCurrency(realizedCompletedValue)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">From completed VIP delegations</p>
            </div>

            {/* Active in Progress */}
            <div className="p-5 rounded-3xl bg-white border border-[#00adef]/40 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-[#00adef] uppercase">
                  Active in Progress
                </span>
                <span className="w-2 h-2 rounded-full bg-[#00adef] animate-ping" />
              </div>
              <p className="font-heading font-black text-2xl text-[#00adef]">
                {formatCurrency(activePipelineValue)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Delegations currently visiting</p>
            </div>

            {/* Average Deal Size */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase">
                  Average Deal Size
                </span>
                <ShieldCheck className="w-4 h-4 text-[#e38524]" />
              </div>
              <p className="font-heading font-black text-2xl text-[#000000]">
                {formatCurrency(averageDealSize)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Per commercial opportunity</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FinancialKpiSection;
