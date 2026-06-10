import React from 'react';

export default function DistanceBadge({ distance, duration, travelMode = 'ROAD' }) {
  const getTravelModeIcon = () => {
    switch (travelMode.toUpperCase()) {
      case 'CYCLING': return '🚲';
      case 'WALKING': return '🚶';
      case 'ROAD':
      default: return '🚗';
    }
  };

  const formatDuration = (mins) => {
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  };

  return (
    <div className="flex items-center gap-2 bg-gradient-to-r from-surfaceLight/30 to-surface/20 border border-white/5 rounded-full px-4 py-2 text-xs text-textMuted shadow-md backdrop-blur-md hover:border-white/10 transition-all">
      <span className="text-sm">{getTravelModeIcon()}</span>
      <span className="font-semibold text-text">{distance.toFixed(1)} km</span>
      <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
      <span>Est. {formatDuration(duration)}</span>
    </div>
  );
}
