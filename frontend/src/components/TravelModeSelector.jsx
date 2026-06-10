import React from 'react';

export default function TravelModeSelector({ travelMode, onChange, disabled = false }) {
  const modes = [
    { value: 'ROAD', label: 'Driving', icon: '🚗' },
    { value: 'CYCLING', label: 'Cycling', icon: '🚲' },
    { value: 'WALKING', label: 'Walking', icon: '🚶' }
  ];

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-bold text-textMuted uppercase tracking-wider">
        Travel Mode
      </label>
      <div className="flex items-center gap-1 bg-surfaceLight/30 border border-white/10 rounded-2xl p-1 shadow-inner self-start">
        {modes.map((mode) => (
          <button
            key={mode.value}
            disabled={disabled}
            onClick={() => onChange(mode.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
              travelMode === mode.value
                ? 'bg-primary text-bg shadow-lg scale-100 font-black'
                : 'text-textMuted hover:text-text hover:bg-white/5 disabled:opacity-50'
            }`}
          >
            <span>{mode.icon}</span>
            <span>{mode.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
