import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const CustomBarTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="p-3 bg-white rounded-2xl shadow-xl border border-slate-200 text-left text-xs">
        <p className="font-bold text-[#000000]">{item.payload.department}</p>
        <p className="text-slate-500 mt-0.5">
          Delegations: <span className="font-black text-[#e38524]">{item.value}</span> visits
        </p>
      </div>
    );
  }
  return null;
};

export const DepartmentBarChart = ({ visitsByDepartment = {} }) => {
  const chartData = Object.entries(visitsByDepartment || {}).map(([dept, count]) => ({
    department: dept,
    shortDept: dept.length > 18 ? `${dept.slice(0, 16)}...` : dept,
    count,
  }));

  const total = chartData.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between text-left h-full">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-heading font-black text-base text-[#000000]">
            Visits by Bank Department
          </h3>
          <span className="text-xs font-bold text-[#00adef]">{chartData.length} Departments</span>
        </div>
        <p className="text-xs text-slate-500">Internal host department activity demand</p>
      </div>

      <div className="h-64 my-2">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-400">
            No department data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
            >
              <XAxis type="number" allowDecimals={false} stroke="#94a3b8" fontSize={11} />
              <YAxis
                type="category"
                dataKey="shortDept"
                stroke="#64748b"
                fontSize={11}
                width={120}
                tickLine={false}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index % 2 === 0 ? '#00adef' : '#e38524'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Strategic Delegation Demand</span>
        <span className="font-bold text-[#000000]">{total} Total Department Visits</span>
      </div>
    </div>
  );
};

export default DepartmentBarChart;
