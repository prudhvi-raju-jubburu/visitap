import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { transformCloudinaryUrl } from '../utils/cloudinaryUtils';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';

export default function DistrictCard({ district, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.5 }}
      className="group relative rounded-3xl overflow-hidden bg-surface card-hover cursor-pointer border border-white/5 shadow-xl transition-all duration-500 hover:shadow-amber/20"
    >
      <Link to={`/district/${district.slug || district.name.toLowerCase().replace(/\s+/g, '-')}`}>
        {/* Image Section */}
        <div className="relative h-64 overflow-hidden">
          <img
            src={transformCloudinaryUrl(district.image || DEFAULT_IMAGE)}
            alt={district.name}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
            loading="lazy"
          />
          {/* Refined Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100"></div>

          {/* Badge */}
          <div className="absolute top-4 right-4 bg-primary/20 backdrop-blur-md border border-primary/30 text-primary text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full">
            Explore
          </div>

          {/* District name overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h3 className="font-display text-3xl font-black text-white group-hover:text-primary transition-colors flex items-center gap-2">
              <span className="truncate">{district.name}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex-shrink-0"></span>
            </h3>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          <p className="text-textMuted text-sm leading-relaxed line-clamp-2 min-h-[40px]">
            {district.shortDescription || district.description}
          </p>

          {/* Highlights */}
          {district.highlights?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {district.highlights.slice(0, 3).map((h) => (
                <span key={h} className="text-[10px] uppercase font-semibold bg-surfaceLight/50 text-textMuted border border-white/5 px-2.5 py-1 rounded-lg">
                  {h}
                </span>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
            <span className="text-primary text-xs font-bold uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
              Discover More
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
