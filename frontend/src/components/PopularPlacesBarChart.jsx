import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function PopularPlacesBarChart({ data }) {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-surface/90 border border-white/10 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-card flex flex-col gap-1">
          <p className="text-xs font-bold text-white">{item.name}</p>
          <p className="text-[10px] text-textMuted uppercase tracking-wider">{item.category} • {item.districtName}</p>
          <div className="border-t border-white/5 my-1"></div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
            <span className="text-textMuted">Popularity:</span>
            <span className="font-bold text-primary text-right">{item.popularityScore}</span>
            <span className="text-textMuted">Views:</span>
            <span className="font-bold text-white text-right">{item.views}</span>
            <span className="text-textMuted">Saves:</span>
            <span className="font-bold text-white text-right">{item.saves}</span>
            <span className="text-textMuted">Reviews:</span>
            <span className="font-bold text-white text-right">{item.reviews}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-80 bg-surface/30 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-md">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="font-display text-sm font-black text-white uppercase tracking-wider">Top Popular Attractions</h4>
          <p className="text-[10px] text-textMuted mt-0.5">Ranked by composite score (Views, Saves, Reviews, Trips)</p>
        </div>
      </div>
      <div className="w-full h-[calc(100%-3rem)]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#94a3b8"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => val.length > 12 ? `${val.slice(0, 10)}...` : val}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.02)' }} />
            <Bar
              dataKey="popularityScore"
              fill="#fbbf24"
              radius={[6, 6, 0, 0]}
              maxBarSize={35}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
