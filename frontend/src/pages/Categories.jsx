import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchCategories, fetchPlaces } from '../services/api';
import PlaceCard from '../components/PlaceCard';

const CATEGORY_META = {
  'Temple / Religious': { icon: '🛕', color: 'from-orange-500/20 to-amber-500/20', textColor: 'text-orange-300', image: 'https://res.cloudinary.com/ddipawlbg/image/upload/v1774693749/wealthiest-temples_cnohgs.jpg' },
  Beach: { icon: '🏖️', color: 'from-blue-500/20 to-cyan-500/20', textColor: 'text-blue-300', image: 'https://res.cloudinary.com/ddipawlbg/image/upload/v1774692929/photo-1507525428034-b723cf961d3e_xxu1kd.jpg' },
  'Hill Station': { icon: '⛰️', color: 'from-green-500/20 to-emerald-500/20', textColor: 'text-green-300', image: 'https://res.cloudinary.com/ddipawlbg/image/upload/v1774693924/small-house-built-peaceful-green-hill-high-up-mountains_181624-8241_gy6kvs.jpg' },
  Historical: { icon: '🏛️', color: 'from-amber-500/20 to-yellow-500/20', textColor: 'text-amber-300', image: 'https://res.cloudinary.com/ddipawlbg/image/upload/v1774693122/photo-1524492412937-b28074a5d7da_orj4om.jpg' },
  Nature: { icon: '🌿', color: 'from-lime-500/20 to-green-500/20', textColor: 'text-lime-300', image: 'https://res.cloudinary.com/ddipawlbg/image/upload/v1774693297/photo-1469474968028-56623f02e42e_jzjjaq.jpg' },
  Waterfalls: { icon: '🌊', color: 'from-cyan-500/20 to-blue-500/20', textColor: 'text-cyan-300', image: 'https://res.cloudinary.com/ddipawlbg/image/upload/v1774694009/Waterfall-1_hhirl6.png' },
  Wildlife: { icon: '🦁', color: 'from-emerald-500/20 to-teal-500/20', textColor: 'text-emerald-300', image: 'https://res.cloudinary.com/ddipawlbg/image/upload/v1774693392/photo-1549366021-9f761d450615_mutufq.jpg' },
  Adventure: { icon: '🧗', color: 'from-red-500/20 to-orange-500/20', textColor: 'text-red-300', image: 'https://res.cloudinary.com/ddipawlbg/image/upload/v1774693477/photo-1522163182402-834f871fd851_sluafx.jpg' },
  City: { icon: '🏙️', color: 'from-slate-500/20 to-gray-500/20', textColor: 'text-slate-300', image: 'https://res.cloudinary.com/ddipawlbg/image/upload/v1774693229/photo-1477959858617-67f85cf4f1df_mdmwwi.jpg' },
  Culture: { icon: '🎭', color: 'from-pink-500/20 to-rose-500/20', textColor: 'text-pink-300', image: 'https://res.cloudinary.com/ddipawlbg/image/upload/v1774694771/Festivals-In-Andhra-Pradesh-Cover-Image_11th-jan_ktjdgy.jpg' },
  Heritage: { icon: '🏯', color: 'from-amber-500/20 to-yellow-500/20', textColor: 'text-amber-300', image: 'https://res.cloudinary.com/ddipawlbg/image/upload/v1774632687/visit_ap/places/wex1bacvka478icoadgm.png' },
  Backwaters: { icon: '🛶', color: 'from-cyan-600/20 to-blue-600/20', textColor: 'text-cyan-400', image: 'https://res.cloudinary.com/ddipawlbg/image/upload/v1774693551/photo-1602216056096-3b40cc0c9944_pe3pic.jpg' },
  Tribal: { icon: '🛖', color: 'from-orange-700/20 to-amber-700/20', textColor: 'text-orange-400', image: 'https://res.cloudinary.com/ddipawlbg/image/upload/v1774695012/tribal_rlctdl.jpg' },
  Pilgrimage: { icon: '🙏', color: 'from-orange-400/20 to-red-400/20', textColor: 'text-orange-300', image: 'https://res.cloudinary.com/ddipawlbg/image/upload/v1774694153/Evening_prayers_at_Har-Ki-Pairi_Ghat_in_Haridwar_jsruae.jpg' },
  default: { icon: '📍', color: 'from-indigo-500/20 to-purple-500/20', textColor: 'text-indigo-300', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=800' },
};

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placesLoading, setPlacesLoading] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await fetchCategories();
        setCategories(res.data.data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      const loadPlaces = async () => {
        setPlacesLoading(true);
        try {
          const res = await fetchPlaces({ category: selectedCategory });
          setPlaces(res.data.data || []);
        } catch (err) {
          console.error('Error fetching filtered places:', err);
        } finally {
          setPlacesLoading(false);
        }
      };
      loadPlaces();
    }
  }, [selectedCategory]);

  if (loading) {
    return (
      <div className="pt-32 min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-white/5 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 min-h-screen px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-display font-black text-white mb-4"
        >
          Explore by <span className="text-primary">Category</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-textMuted max-w-2xl text-lg"
        >
          Discover Andhra Pradesh based on your interests. From spiritual journeys to adventurous escapes, find the perfect spot.
        </motion.p>
      </div>

      {/* Category Grid */}
      {!selectedCategory ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat, idx) => {
            const meta = CATEGORY_META[cat.name] || CATEGORY_META.default;
            return (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -8 }}
                className="cursor-pointer group relative h-72 rounded-[2rem] overflow-hidden shadow-card transition-all duration-500 hover:shadow-2xl border border-white/10"
                onClick={() => setSelectedCategory(cat.name)}
              >
                {/* Background Image */}
                <img 
                  src={meta.image} 
                  alt={cat.name} 
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                  loading="lazy"
                />
                
                {/* Gradient Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100"></div>
                <div className={`absolute inset-0 bg-gradient-to-br ${meta.color} opacity-40 mix-blend-overlay`}></div>

                <div className="absolute inset-0 p-8 flex flex-col justify-end z-10">
                  <div className="bg-black/40 backdrop-blur-md w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4 border border-white/10 transform group-hover:-translate-y-2 transition-transform duration-500 shadow-xl">
                    {meta.icon}
                  </div>
                  
                  <div className="transform group-hover:-translate-y-2 transition-transform duration-500 min-w-0 pr-12">
                    <h3 className="text-2xl font-display font-bold text-white mb-1 group-hover:text-primary transition-colors truncate">{cat.name}</h3>
                    <p className="text-white/80 text-sm font-medium flex items-center gap-2 truncate">
                       {cat.count} {cat.count === 1 ? 'Destination' : 'Destinations'}
                    </p>
                  </div>
                  
                  <div className="absolute top-8 right-8 w-10 h-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0 border border-white/20">
                    <span className="text-white">→</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div>
          {/* Active Filter Header */}
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={() => setSelectedCategory(null)}
              className="group flex items-center gap-2 text-textMuted hover:text-primary transition-colors"
            >
              <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
              <span className="font-semibold uppercase tracking-widest text-[10px]">Back to All Categories</span>
            </button>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{CATEGORY_META[selectedCategory]?.icon || '📍'}</span>
              <h2 className="text-2xl font-display font-bold text-white">{selectedCategory}</h2>
            </div>
          </div>

          {/* Places Grid */}
          <AnimatePresence mode="wait">
            {placesLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-96 rounded-3xl bg-surface/50 animate-pulse border border-white/5"></div>
                ))}
              </motion.div>
            ) : (
              <motion.div 
                key="places"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {places.map((place, idx) => (
                  <PlaceCard key={place._id} place={place} index={idx} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          
          {!placesLoading && places.length === 0 && (
            <div className="text-center py-20 text-textMuted">
              No places found in this category yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
