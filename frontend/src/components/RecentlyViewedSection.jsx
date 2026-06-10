import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=600&auto=format&fit=crop';

function formatRelativeTime(dateString) {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    
    if (diffMs < 0) return 'just now'; // timezone alignment safety
    if (diffMs < 60000) return 'just now';
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch (e) {
    return 'recently';
  }
}

export default function RecentlyViewedSection({ history }) {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-16 bg-white/[0.01] border border-white/5 rounded-3xl p-8">
        <span className="text-5xl block mb-4">👀</span>
        <h4 className="text-base font-bold text-text mb-2">No Viewing History</h4>
        <p className="text-textMuted text-xs max-w-sm mx-auto">
          Attractions you browse in Visit AP will appear here so you can easily revisit them later.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {history.map(({ placeId: place, viewedAt }, index) => {
        if (!place) return null;
        const coverImg = place.coverImage || DEFAULT_IMAGE;

        return (
          <motion.div
            key={`${place._id}-${index}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.04 }}
            className="group relative bg-surfaceLight/10 border border-white/5 rounded-[20px] overflow-hidden hover:border-white/10 transition-all flex flex-col justify-between"
          >
            {/* Small thumbnail image */}
            <div className="relative h-36 overflow-hidden">
              <img 
                src={coverImg} 
                alt={place.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg/95 via-transparent to-transparent"></div>
              
              {/* Category label */}
              <span className="absolute bottom-3 left-3 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-bold text-textMuted">
                {place.category}
              </span>
            </div>

            {/* Content text */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[9px] text-textMuted font-bold uppercase tracking-wider block mb-0.5">
                  {place.districtName}
                </span>
                <Link to={`/place/${place.slug || place._id}`} className="hover:text-primary transition-colors">
                  <h5 className="font-display font-bold text-sm text-text tracking-tight line-clamp-1">
                    {place.name}
                  </h5>
                </Link>
              </div>

              {/* Time indicator */}
              <div className="flex items-center justify-between border-t border-white/5 pt-2.5 mt-2.5 text-[9px] text-textMuted">
                <span className="flex items-center gap-1">
                  👁️ Viewed
                </span>
                <span className="font-semibold text-accent/80">
                  {formatRelativeTime(viewedAt)}
                </span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
