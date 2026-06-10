import React from 'react';

const EVENT_METADATA = {
  PLACE_VIEW: { label: 'Viewed attraction', icon: '👁️', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  DISTRICT_VIEW: { label: 'Viewed district', icon: '🗺️', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  SEARCH: { label: 'Searched query', icon: '🔍', color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' },
  VOICE_SEARCH: { label: 'Voice searched', icon: '🎤', color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' },
  SAVE_PLACE: { label: 'Saved attraction', icon: '💖', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  SAVE_DISTRICT: { label: 'Saved district', icon: '📍', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  CREATE_TRIP: { label: 'Generated itinerary', icon: '✈️', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  SHARE_TRIP: { label: 'Shared itinerary', icon: '🔗', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  REVIEW_SUBMITTED: { label: 'Submitted review', icon: '💬', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  USER_REGISTERED: { label: 'Registered account', icon: '👤', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  USER_LOGIN: { label: 'Logged in', icon: '🚪', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
  FEEDBACK_SUBMITTED: { label: 'Submitted feedback', icon: '📝', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' }
};

export default function RecentActivityFeed({ recentActivity = [], trendingAlerts = [] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      {/* Recent Activity Log */}
      <div className="lg:col-span-7 bg-surface/30 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-md flex flex-col gap-4 max-h-[420px] overflow-hidden">
        <div>
          <h4 className="font-display text-sm font-black text-white uppercase tracking-wider">Live System Logs</h4>
          <p className="text-[10px] text-textMuted mt-0.5">Real-time visitor interactions and platform events</p>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 custom-scroll">
          {recentActivity.length === 0 ? (
            <div className="text-xs text-textMuted text-center py-10">No recent activity detected.</div>
          ) : (
            recentActivity.map((event) => {
              const meta = EVENT_METADATA[event.eventType] || { label: 'Performed action', icon: '⚡', color: 'text-white bg-white/10' };
              const actor = event.userId?.name || 'Guest Visitor';
              const targetName = event.placeId?.name || event.districtId?.name || event.metadata?.searchQuery || '';
              
              return (
                <div key={event._id} className="flex items-center gap-3 p-3 bg-white/[0.01] border border-white/5 rounded-2xl hover:border-white/10 transition-colors">
                  <div className={`w-8 h-8 rounded-xl border flex items-center justify-center text-sm ${meta.color}`}>
                    {meta.icon}
                  </div>
                  <div className="flex-1 overflow-hidden pr-2">
                    <p className="text-xs font-bold text-text truncate">
                      {actor} <span className="text-textMuted font-normal">{meta.label}</span> {targetName && <span className="text-primary font-semibold">"{targetName}"</span>}
                    </p>
                    <p className="text-[9px] text-textMuted mt-0.5">
                      {new Date(event.createdAt).toLocaleDateString()} at {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Trending Alerts Panel */}
      <div className="lg:col-span-5 bg-surface/30 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-md flex flex-col gap-4 max-h-[420px] overflow-hidden">
        <div>
          <h4 className="font-display text-sm font-black text-white uppercase tracking-wider">Trending Now</h4>
          <p className="text-[10px] text-textMuted mt-0.5">7-day view volume spikes compared to previous period</p>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 custom-scroll">
          {trendingAlerts.length === 0 ? (
            <div className="text-xs text-textMuted text-center py-10 flex flex-col items-center gap-2">
              <span>📈</span>
              Waiting for engagement metrics spikes...
            </div>
          ) : (
            trendingAlerts.map((alert, i) => (
              <div key={i} className="flex justify-between items-center p-3.5 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl hover:border-emerald-500/30 transition-colors">
                <div className="flex flex-col gap-0.5 overflow-hidden pr-2">
                  <span className="text-xs font-bold text-white truncate">{alert.name}</span>
                  <span className="text-[9px] text-textMuted uppercase tracking-wider">{alert.currentViews} views this week</span>
                </div>
                <div className="flex flex-col items-end whitespace-nowrap">
                  <span className="text-xs font-black text-emerald-400">↑ {alert.percentage}%</span>
                  <span className="text-[8px] text-textMuted uppercase tracking-wider">spike</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
