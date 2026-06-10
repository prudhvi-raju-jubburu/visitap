import React from 'react';

export default function SearchAnalyticsTable({ data }) {
  const { metrics = {}, topSearches = [], topVoiceSearches = [], recentConversions = [] } = data;

  return (
    <div className="w-full bg-surface/30 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-md flex flex-col gap-6">
      <div>
        <h4 className="font-display text-sm font-black text-white uppercase tracking-wider">Search Intelligence</h4>
        <p className="text-[10px] text-textMuted mt-0.5">Keywords trend, search success, and conversion analysis</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
        <div className="flex flex-col">
          <span className="text-[10px] text-textMuted font-bold uppercase">Success Rate</span>
          <span className="text-xl font-display font-black text-emerald-400 mt-1">{metrics.successRate || 0}%</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-textMuted font-bold uppercase">Conversion Rate</span>
          <span className="text-xl font-display font-black text-primary mt-1">{metrics.clickConversionRate || 0}%</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-textMuted font-bold uppercase">Voice Queries</span>
          <span className="text-xl font-display font-black text-blue-400 mt-1">{metrics.voiceSearchesCount || 0}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-textMuted font-bold uppercase">Failed Searches</span>
          <span className="text-xl font-display font-black text-red-400 mt-1">{metrics.failSearchesCount || 0}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Keywords */}
        <div className="flex flex-col gap-3">
          <h5 className="text-xs font-black text-white uppercase tracking-wider">Top Search Terms</h5>
          <div className="overflow-x-auto border border-white/5 rounded-2xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-white/5 text-textMuted border-b border-white/5 font-bold">
                  <th className="p-3">Query</th>
                  <th className="p-3 text-right">Volume</th>
                </tr>
              </thead>
              <tbody>
                {topSearches.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="p-4 text-center text-textMuted">No searches recorded yet.</td>
                  </tr>
                ) : (
                  topSearches.map((s, i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="p-3 font-semibold text-text">"{s._id || 'Empty'}"</td>
                      <td className="p-3 text-right font-bold text-primary">{s.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Conversions */}
        <div className="flex flex-col gap-3">
          <h5 className="text-xs font-black text-white uppercase tracking-wider">Search conversions (clicks)</h5>
          <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scroll">
            {recentConversions.length === 0 ? (
              <div className="text-xs text-textMuted p-4 text-center">No search clicks recorded.</div>
            ) : (
              recentConversions.map((c, i) => {
                const targetName = c.placeId?.name || c.districtId?.name || 'Unknown Item';
                const type = c.metadata?.destinationType || 'Item';
                return (
                  <div key={i} className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between text-xs hover:border-white/10 transition-colors">
                    <div className="flex flex-col gap-0.5 overflow-hidden pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-text truncate">"{c.metadata?.searchQuery}"</span>
                        <span className="text-[9px] text-textMuted">→</span>
                        <span className="font-semibold text-primary truncate">{targetName}</span>
                      </div>
                      <span className="text-[9px] text-textMuted uppercase tracking-wider">{type} Conversion • {c.userId?.name || 'Guest User'}</span>
                    </div>
                    <span className="text-[9px] text-textMuted whitespace-nowrap">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
