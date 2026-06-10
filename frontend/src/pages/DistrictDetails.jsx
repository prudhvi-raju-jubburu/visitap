import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchDistrict, fetchPlaces, trackClientEvent } from '../services/api';
import PlaceCard from '../components/PlaceCard';
import { GridSkeleton } from '../components/SkeletonLoader';
import { useUserAuth } from '../context/AuthContext';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200';

export default function DistrictDetails() {
  const { districtName } = useParams();
  const [district, setDistrict] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState('All');
  const [activeImage, setActiveImage] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const { isAuthenticated } = useUserAuth();
  const [isSavedDistrict, setIsSavedDistrict] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const cacheDKey = `cached_district_details_${districtName}`;
      const cachePKey = `cached_district_places_${districtName}`;
      try {
        const cachedD = localStorage.getItem(cacheDKey);
        const cachedP = localStorage.getItem(cachePKey);
        if (cachedD && cachedP) {
          setDistrict(JSON.parse(cachedD));
          setPlaces(JSON.parse(cachedP));
          setLoading(false);
        }

        const [dRes, pRes] = await Promise.all([
          fetchDistrict(districtName),
          fetchPlaces({ district: decodeURIComponent(districtName).replace(/-/g, ' ') }),
        ]);
        const dData = dRes.data.data;
        const pData = pRes.data.data || [];
        setDistrict(dData);
        setPlaces(pData);
        localStorage.setItem(cacheDKey, JSON.stringify(dData));
        localStorage.setItem(cachePKey, JSON.stringify(pData));
        trackClientEvent('DISTRICT_VIEW', { districtId: dData._id });

        if (isAuthenticated) {
          const { getCollectionDashboard } = await import('../services/api');
          const colRes = await getCollectionDashboard();
          if (colRes.data?.success && colRes.data?.data?.savedDistricts) {
            const saved = colRes.data.data.savedDistricts.some(
              sd => (sd.districtId?._id || sd.districtId) === dData._id
            );
            setIsSavedDistrict(saved);
          }
        }
        setError(null);
      } catch (err) {
        const cachedD = localStorage.getItem(cacheDKey);
        const cachedP = localStorage.getItem(cachePKey);
        if (cachedD && cachedP) {
          setDistrict(JSON.parse(cachedD));
          setPlaces(JSON.parse(cachedP));
          setError(null);
        } else {
          setError('District not found.');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [districtName, isAuthenticated]);

  const toggleSaveDistrict = async () => {
    if (!isAuthenticated) {
      window.location.href = `/login?from=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    setSaveLoading(true);
    try {
      const { saveDistrictToCollection, removeDistrictFromCollection } = await import('../services/api');
      if (isSavedDistrict) {
        await removeDistrictFromCollection(district._id);
        setIsSavedDistrict(false);
      } else {
        await saveDistrictToCollection(district._id);
        setIsSavedDistrict(true);
      }
    } catch (err) {
      console.error('[DistrictDetails] Toggle Save District Error:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const categories = ['All', ...new Set(places.map(p => p.category).filter(Boolean))];
  const filtered = category === 'All' ? places : places.filter(p => p.category === category);

  if (loading) {
    return (
      <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-64 skeleton rounded-3xl mb-8"></div>
        <GridSkeleton count={6} />
      </div>
    );
  }

  if (error || !district) {
    return (
      <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-danger mb-4">{error || 'District not found'}</p>
        <Link to="/districts" className="btn-primary">← Back to Districts</Link>
      </div>
    );
  }

  const allImages = [district.image, ...(district.images || [])].filter(Boolean);

  return (
    <div className="pt-24 pb-20 min-h-screen">
      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setLightbox(false)}
          >
            <img
              src={allImages[activeImage] || DEFAULT_IMAGE}
              alt={district.name}
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl"
              onError={e => e.target.src = DEFAULT_IMAGE}
            />
            <button onClick={() => setLightbox(false)} className="absolute top-4 right-4 text-white text-2xl hover:text-primary">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Banner */}
      <div className="relative h-[400px] md:h-[500px] overflow-hidden group/banner">
        <img
          src={allImages[activeImage] || DEFAULT_IMAGE}
          alt={district.name}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover/banner:scale-105"
          onError={e => e.target.src = DEFAULT_IMAGE}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-transparent"></div>
        
        {/* Content Overlay */}
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 w-full">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
              <Link to="/districts" className="inline-flex items-center gap-2 text-primary text-xs font-black uppercase tracking-widest mb-4 hover:gap-3 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/></svg>
                All Districts
              </Link>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                <div>
                  <h1 className="font-display text-5xl md:text-7xl font-black text-white tracking-tight uppercase">
                    {district.name}
                  </h1>
                  <div className="h-1.5 w-24 bg-primary rounded-full mt-2"></div>
                </div>

                <button
                  onClick={toggleSaveDistrict}
                  disabled={saveLoading}
                  className={`px-6 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 border backdrop-blur-xl shrink-0 self-start md:self-center ${
                    isSavedDistrict
                      ? 'bg-primary/20 border-primary/40 text-primary hover:bg-primary/30 shadow-[0_0_20px_rgba(251,191,36,0.15)] animate-pulse'
                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  <span className="text-lg">{isSavedDistrict ? '♥' : '♡'}</span>
                  <span>{isSavedDistrict ? 'Saved District' : 'Save District'}</span>
                </button>
              </div>
              <p className="text-white/80 text-lg md:text-xl max-w-2xl font-medium leading-relaxed italic border-l-4 border-primary/50 pl-6">
                "{district.shortDescription}"
              </p>
            </motion.div>
          </div>
        </div>
        
        {/* Search/Filter hint */}
        <div className="absolute top-8 right-8 bg-bg/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-3">
          <span className="text-primary font-black text-xl">{filtered.length}</span>
          <span className="text-text/70 text-[10px] uppercase font-bold tracking-widest leading-none">Places to<br/>Explore</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {/* About District Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <div className="lg:col-span-2">
            <h2 className="text-primary text-[10px] uppercase font-black tracking-[0.2em] mb-4 flex items-center gap-3">
              <span className="w-8 h-[2px] bg-primary"></span>
              About the District
            </h2>
            <p className="text-textMuted text-lg leading-relaxed mb-8">
              {district.description}
            </p>
            
            {/* Highlights Grid */}
            {district.highlights?.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {district.highlights.map(h => (
                  <div key={h} className="bg-surfaceLight/30 border border-white/5 p-4 rounded-2xl group hover:border-primary/30 transition-all">
                    <span className="text-primary text-xl mb-2 block group-hover:scale-125 transition-transform origin-left">✦</span>
                    <span className="text-text font-bold text-sm tracking-tight">{h}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Gallery Side Section */}
          <div className="space-y-4">
             <h2 className="text-text/30 text-[10px] uppercase font-black tracking-[0.2em] mb-4 flex items-center gap-3">
                <span className="w-8 h-[2px] bg-text/20"></span>
                Gallery
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => { setActiveImage(i); setLightbox(true); }}
                    className={`aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                      activeImage === i ? 'border-primary' : 'border-white/5 hover:border-white/20'
                    }`}
                  >
                    <img src={img} className="w-full h-full object-cover" alt="" />
                  </button>
                ))}
              </div>
          </div>
        </div>

        {/* Places header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="font-display text-2xl font-bold text-text">
            Tourist Places <span className="text-textMuted text-lg font-normal">({filtered.length})</span>
          </h2>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${category === c ? 'bg-primary text-bg' : 'bg-surface text-textMuted hover:text-text border border-white/10'
                  }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Places grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((p, i) => <PlaceCard key={p._id} place={p} index={i} />)}
          </div>
        ) : (
          <div className="text-center py-16 text-textMuted">
            <div className="text-5xl mb-4">🏕️</div>
            <p>No places found in this category. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
