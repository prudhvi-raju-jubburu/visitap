import React from 'react';
import DistanceBadge from './DistanceBadge';

// Helper to calculate Haversine distance in client
function getHaversineDistance(coords1, coords2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const lon1 = coords1[0];
  const lat1 = coords1[1];
  const lon2 = coords2[0];
  const lat2 = coords2[1];

  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function ItineraryTimeline({
  days = [],
  travelMode = 'ROAD',
  onReorderPlace,
  onRemovePlace,
  onMovePlaceDay,
  onOptimizeDay,
  readOnly = false
}) {
  const handleCopyCoords = (place) => {
    const coords = place.location?.coordinates;
    if (coords && coords.length === 2) {
      navigator.clipboard.writeText(`${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`);
      alert(`Copied coordinates to clipboard: ${coords[1].toFixed(4)}, ${coords[0].toFixed(4)}`);
    }
  };

  const handleShareLocation = (place) => {
    const coords = place.location?.coordinates;
    if (coords && coords.length === 2) {
      const shareText = `Check out ${place.name} in ${place.districtName}! Location: https://maps.google.com/?q=${coords[1]},${coords[0]}`;
      navigator.clipboard.writeText(shareText);
      alert('Share link copied to clipboard!');
    }
  };

  const getTransitionDuration = (distance) => {
    let speed = 50; // road
    if (travelMode === 'CYCLING') speed = 15;
    if (travelMode === 'WALKING') speed = 5;
    const mins = (distance / speed) * 60;
    return distance > 0 && mins < 1 ? 1 : Math.round(mins);
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {days.map((day) => {
        const places = day.places || [];

        return (
          <div
            key={day.dayNumber}
            className="bg-surface/30 border border-white/10 rounded-[2.5rem] p-6 md:p-8 shadow-xl"
          >
            {/* Day Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
              <div>
                <h4 className="font-display text-xl font-black text-primary">
                  Day {day.dayNumber}
                </h4>
                <p className="text-textMuted text-xs mt-1">
                  {places.length} {places.length === 1 ? 'Attraction' : 'Attractions'} scheduled
                </p>
              </div>

              {!readOnly && places.length > 2 && (
                <button
                  onClick={() => onOptimizeDay(day.dayNumber)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-xs font-black text-primary hover:text-bg hover:bg-primary transition-all shadow-md active:scale-95"
                >
                  ⚡ Optimize Route
                </button>
              )}
            </div>

            {/* Places List */}
            {places.length === 0 ? (
              <div className="text-center py-10 text-textMuted text-sm">
                No attractions added to Day {day.dayNumber} yet.
                {!readOnly && <p className="text-xs text-textMuted/70 mt-1">Select from the attraction lists to get started.</p>}
              </div>
            ) : (
              <div className="relative pl-6 md:pl-10 flex flex-col gap-6">
                {/* Timeline vertical path line */}
                <div className="absolute left-3.5 md:left-5 top-4 bottom-4 w-0.5 bg-gradient-to-b from-primary via-amber-400 to-primary/30"></div>

                {places.map((place, index) => {
                  const coords = place.location?.coordinates || [0, 0];
                  const googleMapsUrl = `https://maps.google.com/?q=${coords[1]},${coords[0]}`;

                  // Compute transition metrics to the NEXT place
                  let nextTransition = null;
                  if (index < places.length - 1) {
                    const nextPlace = places[index + 1];
                    const nextCoords = nextPlace.location?.coordinates || [0, 0];
                    const distance = getHaversineDistance(coords, nextCoords);
                    const duration = getTransitionDuration(distance);
                    nextTransition = { distance, duration };
                  }

                  return (
                    <div key={`${place._id}-${index}`} className="relative group/item">
                      {/* Timeline dot */}
                      <div className="absolute -left-[30px] md:-left-[46px] top-1.5 w-5 h-5 rounded-full bg-bg border-4 border-primary flex items-center justify-center shadow-lg group-hover/item:scale-125 transition-transform z-10">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      </div>

                      {/* Attraction card */}
                      <div className="bg-surfaceLight/30 border border-white/5 rounded-3xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-white/15 transition-all">
                        <div className="flex gap-4 items-start">
                          <img
                            src={place.coverImage || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800'}
                            alt={place.name}
                            className="w-16 h-16 rounded-2xl object-cover border border-white/10"
                          />
                          <div>
                            <span className="text-[10px] bg-primary/20 text-primary border border-primary/10 px-2 py-0.5 rounded-lg font-bold">
                              {place.category}
                            </span>
                            <h5 className="font-display font-bold text-text mt-1 text-base">{place.name}</h5>
                            <p className="text-textMuted text-xs mt-0.5">{place.districtName} District</p>
                          </div>
                        </div>

                        {/* Timing and Maps Link */}
                        <div className="flex flex-col gap-3 w-full md:w-auto items-stretch md:items-end">
                          <div className="text-xs text-textMuted text-left md:text-right">
                            <p className="font-medium">⏰ Timings: {place.timings || '6:00 AM - 6:00 PM'}</p>
                            <p className="mt-0.5">🎫 Entry: {place.entryFee || 'Free'}</p>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5">
                            <a
                              href={googleMapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-[10px] font-bold text-text hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-1"
                            >
                              🗺️ Directions
                            </a>
                            <button
                              onClick={() => handleCopyCoords(place)}
                              className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-[10px] font-bold text-textMuted hover:text-text hover:bg-white/10 transition-all"
                              title="Copy Coordinates"
                            >
                              📍 Copy Coords
                            </button>
                            <button
                              onClick={() => handleShareLocation(place)}
                              className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/15 text-[10px] font-bold text-textMuted hover:text-text hover:bg-white/10 transition-all"
                              title="Share Location"
                            >
                              🔗 Share
                            </button>
                          </div>
                        </div>

                        {/* Reordering Controls (Only if editable) */}
                        {!readOnly && (
                          <div className="flex items-center gap-1.5 border-t border-white/5 pt-4 mt-2 md:pt-0 md:mt-0 w-full md:w-auto md:border-t-0 justify-end">
                            {index > 0 && (
                              <button
                                onClick={() => onReorderPlace(day.dayNumber, index, -1)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-textMuted hover:text-text transition-all"
                                title="Move Up"
                              >
                                ⬆️
                              </button>
                            )}
                            {index < places.length - 1 && (
                              <button
                                onClick={() => onReorderPlace(day.dayNumber, index, 1)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-textMuted hover:text-text transition-all"
                                title="Move Down"
                              >
                                ⬇️
                              </button>
                            )}
                            {day.dayNumber > 1 && (
                              <button
                                onClick={() => onMovePlaceDay(place._id, day.dayNumber, day.dayNumber - 1)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-textMuted hover:text-text transition-all text-xs font-bold"
                                title="Move to Previous Day"
                              >
                                ◀ Day
                              </button>
                            )}
                            {days.length > day.dayNumber && (
                              <button
                                onClick={() => onMovePlaceDay(place._id, day.dayNumber, day.dayNumber + 1)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-textMuted hover:text-text transition-all text-xs font-bold"
                                title="Move to Next Day"
                              >
                                Day ▶
                              </button>
                            )}
                            <button
                              onClick={() => onRemovePlace(day.dayNumber, place._id)}
                              className="p-1.5 rounded-lg bg-danger/10 hover:bg-danger/25 text-danger transition-all ml-2"
                              title="Remove Attraction"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Transition Route (Distance/Time) to next place */}
                      {nextTransition && (
                        <div className="py-2 pl-4 flex items-center">
                          <div className="h-0.5 w-6 border-t border-dashed border-white/20 mr-2"></div>
                          <DistanceBadge
                            distance={nextTransition.distance}
                            duration={nextTransition.duration}
                            travelMode={travelMode}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
