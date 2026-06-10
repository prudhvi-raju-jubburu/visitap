import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function RegistrationsLineChart({ data }) {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface/90 border border-white/10 backdrop-blur-xl px-4 py-2.5 rounded-2xl shadow-card">
          <p className="text-[10px] text-textMuted font-bold uppercase tracking-wider">{payload[0].payload.month}</p>
          <p className="text-sm font-black text-primary mt-0.5">
            {payload[0].value} <span className="text-xs text-text font-normal">Registrations</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-80 bg-surface/30 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-md">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="font-display text-sm font-black text-white uppercase tracking-wider">User Registration Growth</h4>
          <p className="text-[10px] text-textMuted mt-0.5">Monthly registrations trend for last 6 months</p>
        </div>
      </div>
      <div className="w-full h-[calc(100%-3rem)]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="month"
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255, 255, 255, 0.05)', strokeWidth: 2 }} />
            <Line
              type="monotone"
              dataKey="registrations"
              stroke="#f59e0b" // Primary theme color
              strokeWidth={3}
              dot={{ fill: '#f59e0b', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#fbbf24' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
