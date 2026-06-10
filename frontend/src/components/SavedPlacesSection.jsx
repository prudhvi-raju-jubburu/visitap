import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=600&auto=format&fit=crop';

export default function SavedPlacesSection({ places, onRemove }) {
  if (!places || places.length === 0) {
    return (
      <div className="text-center py-16 bg-white/[0.01] border border-white/5 rounded-3xl p-8">
        <span className="text-5xl block mb-4">📍</span>
        <h4 className="text-base font-bold text-text mb-2">No Saved Places Yet</h4>
        <p className="text-textMuted text-xs mb-6 max-w-sm mx-auto">
          Start exploring Andhra Pradesh's attractions and save them to your collection to plan your next trip!
        </p>
        <Link to="/districts" className="btn-primary py-2 px-5 text-xs inline-block">
          Explore Attractions
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {places.map(({ placeId: place, savedAt }, index) => {
        if (!place) return null;
        const coverImg = place.coverImage || DEFAULT_IMAGE;
        
        return (
          <motion.div
            key={place._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="group relative bg-surfaceLight/10 border border-white/5 rounded-[24px] overflow-hidden hover:border-white/10 transition-all flex flex-col justify-between"
          >
            {/* Image container */}
            <div className="relative h-48 overflow-hidden">
              <img 
                src={coverImg} 
                alt={place.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg/90 via-transparent to-transparent"></div>
              
              {/* Category tag */}
              <span className="absolute top-4 left-4 bg-bg/85 backdrop-blur-md border border-white/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider text-primary">
                {place.category || 'Attraction'}
              </span>

              {/* Unsave button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(place._id);
                }}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 hover:bg-red-500/20 hover:text-red-400 text-white/80 border border-white/10 flex items-center justify-center transition-colors"
                title="Remove from collection"
              >
                <span className="text-sm">✕</span>
              </button>
            </div>

            {/* Info container */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider block mb-1">
                  📍 {place.districtName}
                </span>
                <Link to={`/place/${place.slug || place._id}`} className="hover:text-primary transition-colors">
                  <h4 className="font-display font-bold text-base text-text tracking-tight mb-2 line-clamp-1">
                    {place.name}
                  </h4>
                </Link>
                <p className="text-textMuted text-xs leading-relaxed line-clamp-2 mb-4 opacity-80">
                  {place.shortDescription || place.description}
                </p>
              </div>

              {/* Footer row */}
              <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-2 text-[10px]">
                <div className="flex items-center gap-1">
                  <span className="text-primary">★</span>
                  <span className="text-text font-bold">{place.rating?.average?.toFixed(1) || '0.0'}</span>
                  <span className="text-textMuted">({place.rating?.count || 0})</span>
                </div>
                <span className="text-textMuted italic opacity-60">
                  Saved {new Date(savedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
