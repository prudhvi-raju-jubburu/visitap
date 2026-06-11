import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=600&auto=format&fit=crop';

export default function SavedDistrictsSection({ districts, onRemove }) {
  if (!districts || districts.length === 0) {
    return (
      <div className="text-center py-16 bg-white/[0.01] border border-white/5 rounded-3xl p-8">
        <span className="text-5xl block mb-4">🗺️</span>
        <h4 className="text-base font-bold text-text mb-2">No Saved Districts</h4>
        <p className="text-textMuted text-xs mb-6 max-w-sm mx-auto">
          Add administrative districts of Andhra Pradesh to your wishlist to organize your regional travel planning!
        </p>
        <Link to="/districts" className="btn-primary py-2 px-5 text-xs inline-block">
          Explore Districts
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {districts.map(({ districtId: dist, savedAt }, index) => {
        if (!dist) return null;
        const coverImg = dist.image || DEFAULT_IMAGE;

        return (
          <motion.div
            key={dist._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className="group relative bg-surfaceLight/10 border border-white/5 rounded-[24px] overflow-hidden hover:border-white/10 transition-all flex flex-col sm:flex-row"
          >
            {/* Image side */}
            <div className="relative w-full sm:w-48 h-48 sm:h-auto overflow-hidden shrink-0">
              <img 
                src={coverImg} 
                alt={dist.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-bg/95 via-transparent to-transparent"></div>
              
              {/* Unsave button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(dist._id);
                }}
                className="absolute top-4 left-4 w-12 h-12 rounded-full bg-black/75 hover:bg-red-500/20 hover:text-red-400 text-white border border-white/15 flex items-center justify-center transition-all shadow-md active:scale-95 z-10"
                title="Remove from collection"
                aria-label="Remove from collection"
              >
                <span className="text-base">✕</span>
              </button>
            </div>

            {/* Content side */}
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <Link to={`/district/${dist.slug || dist.name}`} className="hover:text-primary transition-colors">
                  <h4 className="font-display font-bold text-lg text-text tracking-tight mb-2">
                    {dist.name} District
                  </h4>
                </Link>
                <p className="text-textMuted text-xs leading-relaxed line-clamp-3 mb-4 opacity-80">
                  {dist.shortDescription || dist.description}
                </p>

                {/* Highlights tags */}
                {dist.highlights?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {dist.highlights.slice(0, 3).map((h) => (
                      <span key={h} className="bg-white/5 text-textMuted text-[9px] px-2 py-0.5 rounded border border-white/5 font-semibold">
                        ✦ {h}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action and date */}
              <div className="flex items-center justify-between border-t border-white/5 pt-3 text-[10px]">
                <Link 
                  to={`/district/${dist.slug || dist.name}`} 
                  className="text-primary font-bold hover:underline inline-flex items-center gap-1"
                >
                  Explore Places <span>→</span>
                </Link>
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
