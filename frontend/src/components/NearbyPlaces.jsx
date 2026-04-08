import { useState, useEffect } from 'react';
import { fetchNearbyPlaces } from '../services/api';
import PlaceCard from './PlaceCard';
import { CardSkeleton } from './SkeletonLoader';

export default function NearbyPlaces({ placeId, coordinates }) {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [radius, setRadius] = useState(20);

  useEffect(() => {
    const load = async () => {
      if (!coordinates?.coordinates) return;
      setLoading(true);
      try {
        const [lng, lat] = coordinates.coordinates;
        const res = await fetchNearbyPlaces({ lng, lat, radius, excludeId: placeId });
        setPlaces(res.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [placeId, coordinates, radius]);

  if (!coordinates) return null;

  return (
    <section className="mt-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-text">Nearby Attractions</h2>
          <p className="text-textMuted text-sm mt-1">Places within {radius}km</p>
        </div>

        {/* Radius filter */}
        <div className="flex items-center gap-2 bg-surface rounded-xl p-1 border border-white/10">
          {[5, 10, 20].map((r) => (
            <button
              key={r}
              onClick={() => setRadius(r)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                radius === r ? 'bg-primary text-bg' : 'text-textMuted hover:text-text'
              }`}
            >
              {r}km
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <CardSkeleton key={i} />)}
        </div>
      ) : places.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {places.map((place, i) => <PlaceCard key={place._id} place={place} index={i} />)}
        </div>
      ) : (
        <div className="text-center py-12 text-textMuted">
          <div className="text-4xl mb-3">🔍</div>
          <p>No nearby places found within {radius}km</p>
          <button
            onClick={() => setRadius(r => Math.min(r + 10, 50))}
            className="mt-3 text-primary text-sm hover:underline"
          >
            Expand search radius
          </button>
        </div>
      )}
    </section>
  );
}
