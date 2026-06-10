import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { transformCloudinaryUrl } from '../utils/cloudinaryUtils';
import { useUserAuth } from '../context/AuthContext';
import { addFavorite, removeFavorite } from '../services/api';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';

const categoryIcons = {
  'Temple / Religious': '🛕',
  Beach: '🏖️',
  'Hill Station': '⛰️',
  Historical: '🏛️',
  Nature: '🌿',
  Waterfalls: '🌊',
  Wildlife: '🦁',
  Adventure: '🧗',
  City: '🏙️',
  Culture: '🎭',
  Heritage: '🏯',
  Backwaters: '🛶',
  Tribal: '🛖',
  Pilgrimage: '🙏',
  default: '📍'
};

export default function PlaceCard({ place, index = 0 }) {
  const navigate = useNavigate();
  const { user, setUser, isAuthenticated } = useUserAuth();
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Sync Simple Mode settings
  const [isSimpleMode, setIsSimpleMode] = useState(
    () => localStorage.getItem('simpleMode') === 'true'
  );

  useEffect(() => {
    const syncMode = () => {
      setIsSimpleMode(localStorage.getItem('simpleMode') === 'true');
    };
    window.addEventListener('simpleModeChanged', syncMode);
    return () => window.removeEventListener('simpleModeChanged', syncMode);
  }, []);

  const ratingVal = place.rating
    ? (typeof place.rating === 'object' ? (place.rating.average || 0) : place.rating)
    : 0;

  const isFav = user?.favorites?.includes(place._id);

  const handleFavoriteToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (favoriteLoading) return;

    setFavoriteLoading(true);
    const originalFavorite = isFav;
    const updatedFavs = originalFavorite
      ? (user.favorites || []).filter(id => id !== place._id)
      : [...(user.favorites || []), place._id];
    
    const updatedUser = { ...user, favorites: updatedFavs };
    setUser(updatedUser);
    localStorage.setItem('visitap_user', JSON.stringify(updatedUser));

    try {
      if (originalFavorite) {
        await removeFavorite(place._id);
      } else {
        await addFavorite(place._id);
      }
    } catch (err) {
      console.error('Failed to toggle favorite on card', err);
      // rollback
      const rollbackFavs = originalFavorite
        ? [...(user.favorites || []), place._id]
        : (user.favorites || []).filter(id => id !== place._id);
      const rollbackUser = { ...user, favorites: rollbackFavs };
      setUser(rollbackUser);
      localStorage.setItem('visitap_user', JSON.stringify(rollbackUser));
    } finally {
      setFavoriteLoading(false);
    }
  };

  const catIcon = categoryIcons[place.category] || categoryIcons.default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
      className="group relative rounded-[32px] overflow-hidden bg-surface/50 backdrop-blur-md border border-white/10 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 flex flex-col justify-between"
    >
      <Link to={`/place/${place.slug || place._id}`} className="flex flex-col h-full">
        {/* Image Section */}
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <img
            src={transformCloudinaryUrl(place.coverImage || (place.images?.[0]) || DEFAULT_IMAGE)}
            alt={place.name}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent"></div>

          {/* Floating Favorite (Save) Button - Enlarge touch size */}
          <button
            onClick={handleFavoriteToggle}
            disabled={favoriteLoading}
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-black/75 backdrop-blur-md border border-white/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-all text-white hover:text-red-400 z-10"
            title={isFav ? "Remove from Saved Places" : "Save Place"}
            aria-label="Favorite Toggle"
          >
            {isFav ? (
              <span className="text-red-500 text-2xl">★</span>
            ) : (
              <span className="text-white hover:text-red-400 text-2xl">☆</span>
            )}
          </button>

          {/* Category overlay */}
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5">
            <span className="text-lg">{catIcon}</span>
            <span className="text-white text-xs font-bold uppercase tracking-wider">{place.category}</span>
          </div>
        </div>

        {/* Content Section - Simplified: name, rating, distance */}
        <div className="p-6 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-display font-black text-xl md:text-2xl text-white group-hover:text-primary transition-colors line-clamp-1 mb-3">
              {place.name}
            </h3>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              {/* Rating */}
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                <span className="text-amber-400 text-lg">★</span>
                <span className="text-white text-base font-black">{ratingVal > 0 ? ratingVal.toFixed(1) : '0.0'}</span>
              </div>

              {/* Distance badge */}
              {place.distance !== undefined ? (
                <span className="bg-primary/20 text-primary border border-primary/30 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-base">
                  <span>🚗</span>
                  <span>{place.distance.toFixed(1)} km away</span>
                </span>
              ) : (
                <span className="text-textMuted text-base font-bold flex items-center gap-1">
                  <span>📍</span>
                  <span>{place.districtName}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
