import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const STATUS_COLORS = {
  APPROVED: '#10b981', // Emerald
  IN_PROGRESS: '#00adef', // Cyan
  COMPLETED: '#0d9488', // Teal
  SUBMITTED: '#e38524', // Warm Orange
  UNDER_REVIEW: '#6366f1', // Indigo
  DRAFT: '#94a3b8', // Slate
  REJECTED: '#f43f5e', // Rose
  CANCELLED: '#e11d48',
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="p-3 bg-white rounded-2xl shadow-xl border border-slate-200 text-left text-xs">
        <p className="font-bold text-[#000000]">{item.name.replace('_', ' ')}</p>
        <p className="text-slate-500 mt-0.5">
          Count: <span className="font-black text-[#00adef]">{item.value}</span> visits
        </p>
      </div>
    );
  }
  return null;
};

export const StatusDonutChart = ({ visitsByStatus = {} }) => {
  const chartData = Object.entries(visitsByStatus || {})
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      name: status,
      value: count,
      color: STATUS_COLORS[status] || '#94a3b8',
    }));

  const total = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between text-left h-full">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-heading font-black text-base text-[#000000]">
            Visit Lifecycle Distribution
          </h3>
          <span className="text-xs font-bold text-slate-500">{total} Total</span>
        </div>
        <p className="text-xs text-slate-500">Live operational status breakdown</p>
      </div>

      <div className="h-64 my-2 relative">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            No visits recorded yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        )}

        {/* Center Total Counter */}
        {chartData.length > 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="font-heading font-black text-3xl text-[#000000]">{total}</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Visits
            </span>
          </div>
        )}
      </div>

      {/* Custom Legend */}
      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-slate-600 text-[11px] truncate font-medium">
                {item.name.replace('_', ' ')}
              </span>
            </div>
            <span className="font-black text-[11px] text-[#000000]">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StatusDonutChart;
