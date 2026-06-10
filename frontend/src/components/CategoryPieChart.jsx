import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

export default function CategoryPieChart({ data }) {
  const [metric, setMetric] = useState('views'); // 'views' | 'saves' | 'reviews'

  // Map backend keys to data
  const chartData = metric === 'views' 
    ? data.mostViewedCategories 
    : (metric === 'saves' ? data.mostSavedCategories : data.mostReviewedCategories);

  // Take top 5 categories, group rest as "Other"
  const getProcessedData = () => {
    if (!chartData || chartData.length === 0) return [];
    
    const sorted = [...chartData].sort((a, b) => b.count - a.count);
    if (sorted.length <= 5) return sorted;

    const top = sorted.slice(0, 4);
    const rest = sorted.slice(4);
    const restCount = rest.reduce((acc, c) => acc + c.count, 0);

    return [
      ...top,
      { category: 'Other', count: restCount }
    ];
  };

  const processedData = getProcessedData();

  // Curated color palette
  const COLORS = ['#fbbf24', '#60a5fa', '#34d399', '#f87171', '#c084fc', '#fb7185', '#94a3b8'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface/90 border border-white/10 backdrop-blur-xl px-4 py-2 rounded-2xl shadow-card">
          <p className="text-xs font-bold text-white">{payload[0].name}</p>
          <p className="text-sm font-black text-primary mt-0.5">
            {payload[0].value} <span className="text-xs text-text font-normal">{metric}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-80 bg-surface/30 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-md flex flex-col justify-between">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h4 className="font-display text-sm font-black text-white uppercase tracking-wider">Category Shares</h4>
          <p className="text-[10px] text-textMuted mt-0.5">Distribution of engagement across categories</p>
        </div>
        
        {/* Toggle Controls */}
        <div className="flex bg-white/5 border border-white/10 rounded-xl p-0.5">
          {['views', 'saves', 'reviews'].map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                metric === m
                  ? 'bg-primary text-bg shadow-md'
                  : 'text-textMuted hover:text-text'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full h-[calc(100%-3rem)] flex items-center justify-center">
        {processedData.length === 0 ? (
          <div className="text-xs text-textMuted">No category engagement recorded yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={processedData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="count"
                nameKey="category"
              >
                {processedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                layout="vertical" 
                align="right" 
                verticalAlign="middle"
                iconSize={8}
                iconType="circle"
                formatter={(value) => <span className="text-[10px] text-text font-medium">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
