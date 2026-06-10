import { useState, useEffect } from 'react';
import { fetchNearbyPlaces } from '../services/api';
import PlaceCard from './PlaceCard';
import { CardSkeleton } from './SkeletonLoader';

function haversineDistance(coords1, coords2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const lon1 = coords1.lng;
  const lat1 = coords1.lat;
  const lon2 = coords2.lng;
  const lat2 = coords2.lat;

  const R = 6371; // km radius of Earth
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function NearbyPlaces({ placeId, coordinates }) {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(20);

  useEffect(() => {
    const load = async () => {
      let lat, lng;
      // Parse coordinates from parent details (could be { lat, lng } or GeoJSON coordinates array)
      if (coordinates?.lat !== undefined && coordinates?.lng !== undefined) {
        lat = coordinates.lat;
        lng = coordinates.lng;
      } else if (coordinates?.coordinates && Array.isArray(coordinates.coordinates) && coordinates.coordinates.length === 2) {
        lng = coordinates.coordinates[0];
        lat = coordinates.coordinates[1];
      } else {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await fetchNearbyPlaces({ lng, lat, radius, excludeId: placeId });
        const fetchedPlaces = res.data.data || [];

        // Attach calculated geospatial distance
        const placesWithDistance = fetchedPlaces.map((p) => {
          let pLat, pLng;
          if (p.location?.coordinates && Array.isArray(p.location.coordinates) && p.location.coordinates.length === 2) {
            pLng = p.location.coordinates[0];
            pLat = p.location.coordinates[1];
          } else if (p.location?.lat !== undefined && p.location?.lng !== undefined) {
            pLat = p.location.lat;
            pLng = p.location.lng;
          }

          if (pLat !== undefined && pLng !== undefined) {
            const dist = haversineDistance({ lat, lng }, { lat: pLat, lng: pLng });
            return { ...p, distance: dist };
          }
          return p;
        });

        // Sort by distance ascending
        placesWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));

        setPlaces(placesWithDistance);
      } catch (err) {
        console.error('Error fetching nearby places:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [placeId, coordinates, radius]);

  if (!coordinates) return null;

  return (
    <div className="mt-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h4 className="font-display text-xl font-bold text-white flex items-center gap-2">
            <span>✨</span> You May Also Like
          </h4>
          <p className="text-textMuted text-xs mt-1">Personalized recommendations based on proximity, ratings, and categories</p>
        </div>

        {/* Radius filter with 5, 10, 20, 50 km support */}
        <div className="flex items-center gap-1.5 bg-surfaceLight/30 rounded-2xl p-1 border border-white/10 self-start sm:self-auto shadow-md">
          {[5, 10, 20, 50].map((r) => (
            <button
              key={r}
              onClick={() => setRadius(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${
                radius === r
                  ? 'bg-primary text-bg shadow-lg font-black'
                  : 'text-textMuted hover:text-text hover:bg-white/5'
              }`}
            >
              {r} km
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : places.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {places.map((place, i) => (
            <PlaceCard key={place._id} place={place} index={i} />
          ))}
        </div>
      ) : (
        <div className="bg-surface/30 border border-white/10 rounded-[2rem] p-12 text-center text-textMuted flex flex-col items-center max-w-lg mx-auto shadow-lg">
          <div className="bg-white/5 border border-white/10 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-md">
            🔍
          </div>
          <p className="text-sm font-semibold">No nearby places found within {radius} km.</p>
          <p className="text-xs text-textMuted/70 mt-1">Try expanding the search radius using the filters above.</p>
          {radius < 50 && (
            <button
              onClick={() => setRadius((r) => (r === 5 ? 10 : r === 10 ? 20 : 50))}
              className="mt-4 text-xs font-bold text-primary hover:text-amber-400 bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl transition-all shadow-md active:scale-95"
            >
              Expand Search Radius
            </button>
          )}
        </div>
      )}
    </div>
  );
}
