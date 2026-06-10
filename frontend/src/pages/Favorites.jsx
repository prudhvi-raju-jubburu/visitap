import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getFavorites, removeFavorite } from '../services/api';
import { useUserAuth } from '../context/AuthContext';
import { transformCloudinaryUrl } from '../utils/cloudinaryUtils';
import PageLoader from '../components/PageLoader';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';

const categoryColors = {
  'Temple / Religious': 'bg-orange-500/20 text-orange-300',
  Beach: 'bg-blue-500/20 text-blue-300',
  'Hill Station': 'bg-green-500/20 text-green-300',
  Historical: 'bg-amber-500/20 text-amber-300',
  Nature: 'bg-lime-500/20 text-lime-300',
  Waterfalls: 'bg-cyan-500/20 text-cyan-300',
  Wildlife: 'bg-emerald-500/20 text-emerald-300',
  Adventure: 'bg-red-500/20 text-red-300',
  City: 'bg-slate-500/20 text-slate-300',
  Culture: 'bg-pink-500/20 text-pink-300',
  Heritage: 'bg-yellow-500/20 text-yellow-300',
  Backwaters: 'bg-sky-600/20 text-sky-300',
  Tribal: 'bg-amber-700/20 text-amber-400',
  Pilgrimage: 'bg-rose-500/20 text-rose-300',
  default: 'bg-indigo-500/20 text-indigo-300',
};

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { setUser } = useUserAuth();

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const res = await getFavorites();
        setFavorites(res.data.favorites || []);
      } catch (err) {
        setError('Failed to fetch favorite places.');
      } finally {
        setLoading(false);
      }
    };
    loadFavorites();
  }, []);

  const handleRemove = async (placeId, e) => {
    e.preventDefault(); // Prevent navigating to details card on click
    e.stopPropagation();

    // Optimistic UI update: instantly filter out place
    const previousFavorites = [...favorites];
    setFavorites(curr => curr.filter(item => item._id !== placeId));
    setMessage('Removed from favorites');
    setTimeout(() => setMessage(''), 3000);

    // Update user state favorites count in AuthContext dynamically
    setUser(currUser => {
      if (!currUser) return null;
      const updatedFavs = (currUser.favorites || []).filter(id => id !== placeId);
      const updatedUser = { ...currUser, favorites: updatedFavs };
      localStorage.setItem('visitap_user', JSON.stringify(updatedUser));
      return updatedUser;
    });

    try {
      await removeFavorite(placeId);
    } catch (err) {
      // Revert if API failed
      setFavorites(previousFavorites);
      setError('Failed to remove from favorites.');
      setTimeout(() => setError(''), 3000);
      
      // Revert context user state
      setUser(currUser => {
        if (!currUser) return null;
        const updatedFavs = [...(currUser.favorites || []), placeId];
        const updatedUser = { ...currUser, favorites: updatedFavs };
        localStorage.setItem('visitap_user', JSON.stringify(updatedUser));
        return updatedUser;
      });
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="min-h-screen bg-bg pt-28 pb-20 relative">
      {/* Toast Messages */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium bg-success/90 text-white"
          >
            {message}
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium bg-danger/90 text-white"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="font-display text-3xl md:text-5xl font-bold text-text uppercase">My Wishlist</h1>
          <p className="text-textMuted mt-2 text-sm">Review your saved travel destinations in Andhra Pradesh</p>
        </div>

        {favorites.length === 0 ? (
          /* Premium Empty State */
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card max-w-xl mx-auto p-10 text-center border-white/5 mt-12"
          >
            <div className="text-6xl mb-6">❤️</div>
            <h2 className="text-2xl font-bold text-text mb-3">No favorite places yet.</h2>
            <p className="text-textMuted text-sm mb-8 leading-relaxed">
              Save destinations you want to visit later.
            </p>
            <Link to="/districts" className="btn-primary inline-block">
              Explore Andhra Pradesh
            </Link>
          </motion.div>
        ) : (
          /* Favorites Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((place, index) => {
              const categoryClass = categoryColors[place.category] || categoryColors.default;
              const ratingVal = place.rating
                ? (typeof place.rating === 'object' ? (place.rating.average || 0) : place.rating)
                : 0;
              return (
                <motion.div
                  layout
                  key={place._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative rounded-3xl overflow-hidden bg-surface border border-white/5 transition-all duration-500 hover:shadow-glow hover:-translate-y-1"
                >
                  <Link to={`/place/${place.slug}`}>
                    {/* Image Section */}
                    <div className="relative h-56 overflow-hidden">
                      <img
                        src={transformCloudinaryUrl(place.coverImage || DEFAULT_IMAGE)}
                        alt={place.name}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                        onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/20 to-transparent"></div>

                      {/* Category overlay */}
                      <div className={`absolute top-4 left-4 text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full backdrop-blur-md border border-white/10 ${categoryClass}`}>
                        {place.category}
                      </div>

                      {/* Rating Badge */}
                      {ratingVal > 0 && (
                        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-bg/40 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full">
                          <span className="text-primary text-xs">★</span>
                          <span className="text-text text-xs font-bold">{ratingVal.toFixed(1)}</span>
                        </div>
                      )}

                      {/* Remove Button Overlay */}
                      <button
                        onClick={(e) => handleRemove(place._id, e)}
                        className="absolute bottom-4 right-4 bg-black/60 hover:bg-danger/80 backdrop-blur-md border border-white/10 p-2.5 rounded-full transition-all group-hover:scale-110 shadow-lg text-white hover:text-white"
                        title="Remove from favorites"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                        </svg>
                      </button>
                    </div>

                    {/* Content Section */}
                    <div className="p-5">
                      <h3 className="font-display font-bold text-xl text-text group-hover:text-primary transition-colors line-clamp-1">
                        {place.name}
                      </h3>

                      <p className="text-textMuted text-[11px] uppercase tracking-wider font-semibold mt-1.5 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {place.districtName}
                      </p>

                      <p className="text-textMuted text-sm mt-3 leading-relaxed line-clamp-2 min-h-[40px]">
                        {place.shortDescription || place.description}
                      </p>

                      <div className="flex items-center gap-1.5 mt-4 text-primary text-[10px] font-black uppercase tracking-tighter group-hover:translate-x-1 transition-transform">
                        Explore Place →
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
