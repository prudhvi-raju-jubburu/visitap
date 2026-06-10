import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { transformCloudinaryUrl } from '../utils/cloudinaryUtils';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800';

const CATEGORY_ICONS = {
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
  Other: '📍'
};

export default function DistrictCard({ district, index = 0 }) {
  const placeCount = district.placeCount || 0;
  const categories = district.topCategories || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      className="group relative rounded-3xl overflow-hidden bg-surface/40 backdrop-blur-md border border-white/10 shadow-lg hover:shadow-2xl transition-all duration-500 flex flex-col justify-between"
    >
      <Link to={`/district/${district.slug || district.name.toLowerCase().replace(/\s+/g, '-')}`} className="flex flex-col h-full">
        {/* Image Section */}
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <img
            src={transformCloudinaryUrl(district.image || DEFAULT_IMAGE)}
            alt={district.name}
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            onError={(e) => { e.target.src = DEFAULT_IMAGE; }}
            loading="lazy"
          />
          {/* Readability Gradient Layer */}
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/30 to-transparent opacity-90 transition-opacity duration-500 group-hover:opacity-100"></div>

          {/* Place Count Statistics Badge */}
          <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md">
            <span>📍</span>
            <span>{placeCount} {placeCount === 1 ? 'Place' : 'Places'}</span>
          </div>

          {/* Top Categories Badges */}
          {categories.length > 0 && (
            <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-1.5 z-10">
              {categories.slice(0, 3).map((cat) => (
                <span 
                  key={cat} 
                  className="bg-white/10 backdrop-blur-md border border-white/10 text-white text-[10px] font-medium px-2 py-0.5 rounded-lg flex items-center gap-1"
                  title={cat}
                >
                  <span>{CATEGORY_ICONS[cat] || '📍'}</span>
                  <span className="truncate max-w-[80px]">{cat}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-6 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-baseline justify-between gap-2 mb-2">
              <h3 className="font-display text-2xl font-black text-white group-hover:text-primary transition-colors truncate">
                {district.name}
              </h3>
            </div>
            
            <p className="text-textMuted text-sm leading-relaxed line-clamp-2 min-h-[40px]">
              {district.shortDescription || district.description}
            </p>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
            <span className="text-primary text-xs font-black uppercase tracking-widest flex items-center gap-2 group-hover:gap-3 transition-all">
              Explore District
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
