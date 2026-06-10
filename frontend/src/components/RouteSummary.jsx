import React from 'react';

export default function RouteSummary({ title, districts = [], placesCount = 0, distance = 0, duration = 0, travelMode = 'ROAD' }) {
  const getTravelModeLabel = () => {
    switch (travelMode.toUpperCase()) {
      case 'CYCLING': return 'Cycling 🚲';
      case 'WALKING': return 'Walking 🚶';
      case 'ROAD':
      default: return 'Road Trip 🚗';
    }
  };

  const formatDuration = (mins) => {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours === 0) return `${remainingMins} mins`;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  };

  return (
    <div className="bg-surface/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-[10px] bg-primary/20 text-primary border border-primary/20 px-3 py-1 rounded-full font-extrabold uppercase tracking-wider">
            {getTravelModeLabel()}
          </span>
          <h3 className="font-display text-2xl font-black text-text mt-3 tracking-tight">
            {title || 'Unsaved Itinerary'}
          </h3>
          <p className="text-textMuted text-xs mt-1">
            Districts: {districts.length > 0 ? districts.join(', ') : 'None selected'}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-6 w-full md:w-auto border-t md:border-t-0 md:border-l border-white/5 pt-4 md:pt-0 md:pl-8">
          <div className="text-center md:text-left">
            <p className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Attractions</p>
            <p className="font-display text-2xl font-black text-primary mt-1">{placesCount}</p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Distance</p>
            <p className="font-display text-2xl font-black text-emerald-400 mt-1">{distance.toFixed(1)} <span className="text-xs font-semibold">km</span></p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Duration</p>
            <p className="font-display text-2xl font-black text-amber-400 mt-1">{formatDuration(duration)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
