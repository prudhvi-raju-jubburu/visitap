import React from 'react';
import { Link } from 'react-router-dom';

export default function TripCard({ trip, onDelete, onExport }) {
  // 1. Resolve cover image dynamically: first attraction or highest rated
  const getCoverImage = () => {
    if (!trip.days || trip.days.length === 0) return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800'; // Default AP placeholder
    
    // Find all populated places across all days
    const allPlaces = trip.days.flatMap(d => d.places || []).filter(Boolean);
    if (allPlaces.length === 0) return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800';

    // Try first place
    const firstPlace = allPlaces[0];
    if (firstPlace.coverImage) return firstPlace.coverImage;

    // Try finding the highest rated place
    const sorted = [...allPlaces].sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0));
    if (sorted[0]?.coverImage) return sorted[0].coverImage;

    return 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800';
  };

  const getAttractionsCount = () => {
    if (!trip.days) return 0;
    return trip.days.reduce((acc, d) => acc + (d.places ? d.places.length : 0), 0);
  };

  const formatDuration = (mins) => {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours === 0) return `${remainingMins}m`;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  };

  const formattedDate = new Date(trip.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="bg-surface/30 border border-white/10 rounded-[2rem] overflow-hidden group hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 flex flex-col h-full">
      {/* Cover Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={getCoverImage()}
          alt={trip.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-black/30"></div>
        
        {/* Visibility Badge */}
        <span className={`absolute top-4 right-4 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border backdrop-blur-md shadow-md ${
          trip.isPublic
            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            : 'bg-white/10 text-textMuted border-white/10'
        }`}>
          {trip.isPublic ? '🌐 Shared' : '🔒 Private'}
        </span>
        
        {/* Day Count Badge */}
        <span className="absolute bottom-4 left-4 bg-primary text-bg text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-md">
          {trip.days?.length || 0} {trip.days?.length === 1 ? 'Day' : 'Days'}
        </span>
      </div>

      {/* Details */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-display text-lg font-bold text-text group-hover:text-primary transition-colors line-clamp-1">
            {trip.title}
          </h4>
          <p className="text-textMuted text-xs mt-1 line-clamp-2">
            {trip.description || 'No description provided.'}
          </p>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 border-t border-b border-white/5 py-3 my-4 text-center">
            <div>
              <p className="text-[9px] text-textMuted font-bold uppercase tracking-wider">Places</p>
              <p className="font-display text-sm font-black text-text mt-0.5">{getAttractionsCount()}</p>
            </div>
            <div>
              <p className="text-[9px] text-textMuted font-bold uppercase tracking-wider">Distance</p>
              <p className="font-display text-sm font-black text-emerald-400 mt-0.5">{trip.totalDistance} <span className="text-[10px] font-semibold">km</span></p>
            </div>
            <div>
              <p className="text-[9px] text-textMuted font-bold uppercase tracking-wider">Time</p>
              <p className="font-display text-sm font-black text-amber-400 mt-0.5">{formatDuration(trip.estimatedDuration)}</p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-[10px] text-textMuted mb-4">
            <span>Mode: {trip.travelMode}</span>
            <span>Created {formattedDate}</span>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              to={`/trips/${trip._id}`}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold text-textMuted hover:text-text hover:bg-white/10 transition-all text-center"
            >
              <span>👁️</span> View
            </Link>
            <button
              onClick={() => onExport(trip._id)}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-primary/10 border border-primary/20 text-xs font-bold text-primary hover:text-amber-400 hover:bg-primary/25 transition-all"
            >
              <span>📄</span> PDF
            </button>
            <Link
              to={`/trip-planner?edit=${trip._id}`}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-500 hover:text-amber-400 hover:bg-amber-500/20 transition-all text-center col-span-2 mt-1"
            >
              <span>✏️</span> Edit Itinerary
            </Link>
            <button
              onClick={() => onDelete(trip._id)}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-danger/10 border border-danger/20 text-xs font-bold text-danger hover:text-red-400 hover:bg-danger/20 transition-all col-span-2 mt-1"
            >
              <span>🗑️</span> Delete Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
