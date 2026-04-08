import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchDistricts } from '../services/api';
import DistrictCard from '../components/DistrictCard';
import { GridSkeleton } from '../components/SkeletonLoader';

export default function Districts() {
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchDistricts();
        setDistricts(res.data.data || []);
      } catch {
        setError('Failed to load districts. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = districts.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-primary text-sm font-medium uppercase tracking-wider">Andhra Pradesh</span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-text mt-2 mb-4">
              Explore Districts
            </h1>
            <p className="text-textMuted text-lg max-w-2xl mx-auto">
              Discover the beautiful districts of Andhra Pradesh, each with its own unique culture, landmarks, and natural beauty.
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="relative max-w-md mx-auto mt-8"
          >
            <input
              type="text"
              placeholder="Search districts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-surface border border-white/10 rounded-2xl px-5 py-4 pl-12 text-text placeholder-textMuted focus:outline-none focus:border-primary transition-colors text-sm"
            />
            <svg className="absolute left-4 top-4 w-5 h-5 text-textMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </motion.div>
        </div>

        {/* Content */}
        {error ? (
          <div className="text-center py-16">
            <p className="text-danger mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="btn-primary">
              Try Again
            </button>
          </div>
        ) : loading ? (
          <GridSkeleton count={9} />
        ) : filtered.length > 0 ? (
          <>
            <p className="text-textMuted text-sm mb-6">{filtered.length} district{filtered.length !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((d, i) => <DistrictCard key={d._id} district={d} index={i} />)}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-display text-xl font-bold text-text mb-2">No Districts Found</h3>
            <p className="text-textMuted">No districts match "{search}"</p>
            <button onClick={() => setSearch('')} className="mt-4 text-primary hover:underline text-sm">
              Clear search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
