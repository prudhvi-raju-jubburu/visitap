import React from 'react';
import { motion } from 'framer-motion';

export default function TravelProgressCard({ stats, achievements, travelInterestProgress, collectionSummary }) {
  const { districtsCount, placesCount, tripsCount, percentage } = travelInterestProgress || {
    districtsCount: 0,
    placesCount: 0,
    tripsCount: 0,
    percentage: 0
  };

  const badgeList = [
    {
      key: 'explorer',
      title: '🏅 Explorer',
      description: 'Saved 10+ Places',
      unlocked: achievements?.explorer || false,
      color: 'from-amber-400 to-orange-500 text-amber-950 border-amber-300/30'
    },
    {
      key: 'districtMaster',
      title: '🎖️ District Master',
      description: 'Saved 10+ Districts',
      unlocked: achievements?.districtMaster || false,
      color: 'from-blue-400 to-indigo-600 text-blue-950 border-blue-300/30'
    },
    {
      key: 'templeExplorer',
      title: '⛩️ Temple Explorer',
      description: 'Saved 10+ Temples',
      unlocked: achievements?.templeExplorer || false,
      color: 'from-red-400 to-rose-600 text-red-950 border-rose-300/30'
    },
    {
      key: 'beachExplorer',
      title: '🌊 Beach Explorer',
      description: 'Saved 10+ Beaches',
      unlocked: achievements?.beachExplorer || false,
      color: 'from-teal-400 to-emerald-600 text-teal-950 border-teal-300/30'
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
      {/* Hero Stats Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="lg:col-span-2 bg-surfaceLight/15 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 relative overflow-hidden flex flex-col justify-between"
      >
        <div className="absolute -top-16 -left-16 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-accent/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div>
          <h3 className="font-display text-2xl font-bold text-white mb-2">Travel Interest Progress</h3>
          <p className="text-textMuted text-xs font-semibold uppercase tracking-wider mb-6 opacity-60">
            Your journey mapping across Andhra Pradesh
          </p>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center">
              <span className="block text-2xl md:text-3xl font-black text-primary mb-1">
                {districtsCount}
              </span>
              <span className="text-[10px] md:text-xs font-bold text-textMuted uppercase tracking-wider">
                Districts Planned
              </span>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center">
              <span className="block text-2xl md:text-3xl font-black text-accent mb-1">
                {placesCount}
              </span>
              <span className="text-[10px] md:text-xs font-bold text-textMuted uppercase tracking-wider">
                Attractions Saved
              </span>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center">
              <span className="block text-2xl md:text-3xl font-black text-white mb-1">
                {tripsCount}
              </span>
              <span className="text-[10px] md:text-xs font-bold text-textMuted uppercase tracking-wider">
                Trips Created
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-textMuted">Progress Rate</span>
            <span className="text-primary">{percentage}% Complete</span>
          </div>
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[2px]">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-primary via-amber-400 to-accent rounded-full"
            ></motion.div>
          </div>
          <p className="text-[10px] text-textMuted mt-2 italic opacity-60">
            *Percentage indicates the fraction of 26 total districts bookmarked or included in trip itineraries.
          </p>
        </div>
      </motion.div>

      {/* Achievements Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="bg-surfaceLight/15 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 flex flex-col justify-between"
      >
        <div>
          <h3 className="font-display text-xl font-bold text-white mb-2">Travel Badges</h3>
          <p className="text-textMuted text-[10px] font-bold uppercase tracking-wider mb-6 opacity-60">
            Unlock achievements by saving items
          </p>

          <div className="grid grid-cols-2 gap-3">
            {badgeList.map((badge) => (
              <div 
                key={badge.key}
                className={`border rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all group relative ${
                  badge.unlocked 
                    ? `bg-gradient-to-br ${badge.color} shadow-lg shadow-black/20 hover:scale-102` 
                    : 'bg-white/[0.01] border-white/5 text-textMuted/40'
                }`}
              >
                <span className={`text-2xl mb-1 filter ${badge.unlocked ? '' : 'grayscale opacity-30'}`}>
                  {badge.title.split(' ')[0]}
                </span>
                <span className={`text-xs font-extrabold tracking-tight ${badge.unlocked ? '' : 'text-textMuted'}`}>
                  {badge.title.split(' ').slice(1).join(' ')}
                </span>
                <span className="text-[8px] mt-0.5 opacity-70">
                  {badge.description}
                </span>

                {/* Status dot */}
                <div className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${
                  badge.unlocked ? 'bg-bg/40' : 'bg-white/10'
                }`}></div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick summary totals */}
        <div className="border-t border-white/5 pt-4 mt-6 flex justify-between items-center text-xs">
          <span className="text-textMuted font-medium">Total Items Saved</span>
          <span className="font-bold text-white bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
            {collectionSummary?.totalSaved || 0}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
