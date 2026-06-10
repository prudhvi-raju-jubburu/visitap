import React from 'react';
import { motion } from 'framer-motion';

export default function AnalyticsStatCard({ title, value, icon, change, changeType, delay = 0 }) {
  const isPositive = changeType === 'positive';
  const isNegative = changeType === 'negative';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-surface/30 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-md flex justify-between items-center relative overflow-hidden group hover:border-white/20 transition-all duration-300"
    >
      {/* Background glow hover effect */}
      <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-500"></div>

      <div className="flex flex-col gap-1.5 z-10">
        <span className="text-xs font-semibold text-textMuted uppercase tracking-wider">{title}</span>
        <h3 className="text-3xl font-display font-black text-white">{value}</h3>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-1 text-xs">
            <span className={`font-bold ${isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-textMuted'}`}>
              {isPositive ? '↑' : isNegative ? '↓' : ''} {Math.abs(change)}%
            </span>
            <span className="text-[10px] text-textMuted">vs last week</span>
          </div>
        )}
      </div>

      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform duration-300 z-10">
        {icon}
      </div>
    </motion.div>
  );
}
