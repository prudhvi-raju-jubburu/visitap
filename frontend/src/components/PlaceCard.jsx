import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { transformCloudinaryUrl } from '../utils/cloudinaryUtils';

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

export default function PlaceCard({ place, index = 0 }) {
  const categoryClass = categoryColors[place.category] || categoryColors.default;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group relative rounded-3xl overflow-hidden bg-surface border border-white/5 transition-all duration-500 hover:shadow-glow hover:-translate-y-1"
    >
      <Link to={`/place/${place._id}`}>
        {/* Image Section */}
        <div className="relative h-56 overflow-hidden">
          <img
            src={transformCloudinaryUrl(place.coverImage || (place.images?.[0]) || DEFAULT_IMAGE)}
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
          {place.rating && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-bg/40 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full">
              <span className="text-primary text-xs">★</span>
              <span className="text-text text-xs font-bold">{place.rating}</span>
            </div>
          )}

          {/* Featured indicator */}
          {place.isFeatured && (
            <div className="absolute bottom-4 left-4 bg-primary text-bg text-[10px] uppercase font-black px-3 py-1 rounded-full shadow-lg">
              Featured
            </div>
          )}
          {/* Image count badge */}
          {place.images && place.images.length > 0 && (
            <div className="absolute bottom-4 right-4 bg-bg/60 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-full flex items-center gap-1 group-hover:bg-primary/20 transition-colors">
              <span className="text-primary text-[10px] font-bold">+{place.images.length}</span>
              <svg className="w-3 h-3 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h14a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-5">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-display font-bold text-xl text-text group-hover:text-primary transition-colors line-clamp-1">
              {place.name}
            </h3>
          </div>

          <p className="text-textMuted text-[11px] uppercase tracking-wider font-semibold mt-1.5 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
            {place.districtName}
          </p>

          <p className="text-textMuted text-sm mt-3 leading-relaxed line-clamp-2 min-h-[40px]">
            {place.shortDescription || place.description}
          </p>

          {/* Details Row */}
          <div className="flex items-center gap-4 mt-4">
            {place.bestTimeToVisit && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs grayscale group-hover:grayscale-0 transition-all">🗓</span>
                <span className="text-xs text-textMuted font-medium">{place.bestTimeToVisit}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-primary text-[10px] font-black uppercase tracking-tighter group-hover:translate-x-1 transition-transform">Details →</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
