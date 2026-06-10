import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function SavedTripsSection({ trips, onRemove }) {
  if (!trips || trips.length === 0) {
    return (
      <div className="text-center py-16 bg-white/[0.01] border border-white/5 rounded-3xl p-8">
        <span className="text-5xl block mb-4">📅</span>
        <h4 className="text-base font-bold text-text mb-2">No Saved Trips</h4>
        <p className="text-textMuted text-xs mb-6 max-w-sm mx-auto">
          Create complete travel itineraries using the Trip Planner or save public shared trips to keep them in your workspace!
        </p>
        <Link to="/trip-planner" className="btn-primary py-2 px-5 text-xs inline-block">
          Create a Trip Plan
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {trips.map(({ tripId: trip, savedAt }, index) => {
        if (!trip) return null;
        
        // Count total destinations across all days
        const totalPlacesCount = trip.days?.reduce((sum, day) => sum + (day.places?.length || 0), 0) || 0;

        return (
          <motion.div
            key={trip._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="group relative bg-surfaceLight/10 border border-white/5 rounded-[24px] p-6 hover:border-white/10 transition-all flex flex-col justify-between"
          >
            {/* Unsave button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(trip._id);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 hover:bg-red-500/20 hover:text-red-400 text-white/80 border border-white/10 flex items-center justify-center transition-colors z-10"
              title="Remove bookmark"
            >
              <span className="text-sm">✕</span>
            </button>

            <div>
              {/* Travel mode badge */}
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-primary/5 text-primary text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded border border-primary/10">
                  {trip.travelMode || 'ROAD'}
                </span>
                {trip.isPublic && (
                  <span className="bg-accent/5 text-accent text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded border border-accent/10">
                    Shared Publicly
                  </span>
                )}
              </div>

              <Link to={`/trips/${trip._id}`} className="hover:text-primary transition-colors">
                <h4 className="font-display font-bold text-base text-text tracking-tight mb-2 line-clamp-1">
                  {trip.title}
                </h4>
              </Link>
              <p className="text-textMuted text-xs mb-4 line-clamp-2 min-h-[2rem] opacity-80">
                {trip.description || 'Custom planned travel itinerary across Andhra Pradesh.'}
              </p>

              {/* Districts inline list */}
              {trip.districts?.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap mb-4">
                  <span className="text-[10px] text-textMuted font-medium">Districts:</span>
                  {trip.districts.slice(0, 3).map((d) => (
                    <span key={d} className="bg-white/5 text-textMuted text-[9px] px-2 py-0.5 rounded">
                      {d}
                    </span>
                  ))}
                  {trip.districts.length > 3 && (
                    <span className="text-[8px] text-textMuted italic">+{trip.districts.length - 3} more</span>
                  )}
                </div>
              )}
            </div>

            {/* Metrics footer row */}
            <div className="border-t border-white/5 pt-4 mt-2">
              <div className="grid grid-cols-3 gap-2 text-center text-textMuted text-[10px] mb-4">
                <div>
                  <span className="block text-white font-bold">{trip.days?.length || 0}</span>
                  <span>Days</span>
                </div>
                <div>
                  <span className="block text-white font-bold">{totalPlacesCount}</span>
                  <span>Places</span>
                </div>
                <div>
                  <span className="block text-white font-bold">{Math.round(trip.totalDistance || 0)} km</span>
                  <span>Distance</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] pt-1">
                <Link 
                  to={`/trips/${trip._id}`}
                  className="text-primary font-bold hover:underline inline-flex items-center gap-1"
                >
                  View Itinerary <span>→</span>
                </Link>
                <span className="text-textMuted italic opacity-60">
                  Bookmarked {new Date(savedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
