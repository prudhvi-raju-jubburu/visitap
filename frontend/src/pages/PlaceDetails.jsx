import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchPlace } from '../services/api';
import { useGeolocation } from '../hooks/useGeolocation';
import NearbyPlaces from '../components/NearbyPlaces';

/**
 * PRODUCTION-READY PLACE DETAILS PAGE
 * 
 * Features:
 * - Robust error handling for images and data
 * - Optimized rendering with useMemo and useCallback
 * - Defensive location parsing for various schema formats
 * - Enhanced UX with smooth lightbox and polished visuals
 */

// --- Constants ---
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop';

// --- Pure Utility Helpers (Bonus) ---

/**
 * Validates image URLs and removes duplicates/empty strings
 */
const sanitizeImages = (cover, images) => {
  const candidates = [cover, ...(Array.isArray(images) ? images : [])];
  const valid = candidates.filter(url => 
    url && typeof url === 'string' && url.trim().length > 0
  ).map(url => url.trim());
  
  const unique = Array.from(new Set(valid));
  return unique.length > 0 ? unique : [DEFAULT_IMAGE];
};

/**
 * Safely parses location into { lat, lng } object
 */
const parseCoordinates = (location) => {
  const defaults = { lat: 15.0, lng: 80.0 }; // Regional fallback
  if (!location) return defaults;

  // Handle { lat, lng } schema specifically
  const lat = parseFloat(location.lat);
  const lng = parseFloat(location.lng);

  return {
    lat: isNaN(lat) ? defaults.lat : lat,
    lng: isNaN(lng) ? defaults.lng : lng
  };
};

export default function PlaceDetails() {
  const { placeId } = useParams();
  
  // State Management
  const [place, setPlace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Custom Hooks
  const { 
    location: userLocation, 
    loading: locLoading, 
    error: locError, 
    getLocation, 
    calculateDistance 
  } = useGeolocation();

  // --- Data Fetching ---
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchPlace(placeId);
        if (isMounted) {
          const data = response.data?.data || response.data;
          if (!data) throw new Error('Resource not found');
          setPlace(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.response?.status === 404 ? 'Place not found' : 'Failed to load details');
          console.error('[PlaceDetails] Fetch Error:', err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    getLocation(); // Initiates permission request for navigation features

    return () => { isMounted = false; };
  }, [placeId, getLocation]);

  // --- Performance: Memoized Derived States ---
  
  const allImages = useMemo(() => 
    sanitizeImages(place?.coverImage, place?.images), 
    [place?.coverImage, place?.images]
  );

  const coords = useMemo(() => 
    parseCoordinates(place?.location), 
    [place?.location]
  );
  
  const distance = useMemo(() => 
    calculateDistance(coords.lat, coords.lng), 
    [calculateDistance, coords.lat, coords.lng]
  );

  // --- Interaction Handlers ---

  const handleNextBtn = useCallback((e) => {
    e?.stopPropagation();
    setActiveImageIdx(prev => (prev + 1) % allImages.length);
  }, [allImages.length]);

  const handlePrevBtn = useCallback((e) => {
    e?.stopPropagation();
    setActiveImageIdx(prev => (prev - 1 + allImages.length) % allImages.length);
  }, [allImages.length]);

  const onImageError = (e) => {
    if (e.target.src !== DEFAULT_IMAGE) {
      e.target.onerror = null; // Prevent infinite loops
      e.target.src = DEFAULT_IMAGE;
    }
  };

  const startNavigation = useCallback(() => {
    const dest = `${coords.lat},${coords.lng}`;
    const start = userLocation ? `${userLocation.lat},${userLocation.lng}` : '';
    window.open(`https://www.google.com/maps/dir/${start}/${dest}`, '_blank', 'noopener,noreferrer');
  }, [coords, userLocation]);

  // Keyboard Support for Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeys = (e) => {
      if (e.key === 'ArrowRight') handleNextBtn();
      if (e.key === 'ArrowLeft') handlePrevBtn();
      if (e.key === 'Escape') setIsLightboxOpen(false);
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [isLightboxOpen, handleNextBtn, handlePrevBtn]);

  // --- Render Logic: Loading & Errors ---

  if (loading) {
    return (
      <div className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-[500px] skeleton animate-pulse rounded-[40px] bg-surfaceLight/50 mb-12"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-10 skeleton w-1/2 rounded-xl bg-surfaceLight/50"></div>
            <div className="h-20 skeleton w-full rounded-xl bg-surfaceLight/30"></div>
          </div>
          <div className="h-64 skeleton rounded-[32px] bg-surfaceLight/20"></div>
        </div>
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="min-h-screen pt-32 px-4 text-center bg-bg">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-6">🏝️</div>
          <h2 className="text-2xl font-bold text-text mb-4">{error}</h2>
          <Link to="/districts" className="btn-primary inline-flex items-center gap-2">
            <span>←</span> Back to Exploration
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-20 min-h-screen bg-bg antialiased">
      {/* --- Enhanced Lightbox --- */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/98 z-[200] flex items-center justify-center p-4 backdrop-blur-2xl"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button 
              className="absolute top-8 right-8 text-white/50 hover:text-white transition-all z-[210] p-2 hover:rotate-90"
              onClick={() => setIsLightboxOpen(false)}
              aria-label="Close"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>

            {allImages.length > 1 && (
              <div className="absolute inset-x-4 md:inset-x-12 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-[210]">
                <button 
                  className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-primary transition-all pointer-events-auto border border-white/5"
                  onClick={handlePrevBtn}
                  aria-label="Previous"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                </button>
                <button 
                  className="p-4 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-primary transition-all pointer-events-auto border border-white/5"
                  onClick={handleNextBtn}
                  aria-label="Next"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>
            )}

            <motion.div 
              key={activeImageIdx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 20 }}
              className="relative max-h-[80vh] max-w-[90vw]"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={allImages[activeImageIdx]}
                alt={place.name}
                className="max-h-[80vh] max-w-[90vw] object-contain rounded-2xl shadow-3xl border border-white/10"
                onError={onImageError}
              />
              <div className="absolute -bottom-14 inset-x-0 text-center">
                <span className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em] bg-white/5 py-1.5 px-6 rounded-full inline-block">
                  {activeImageIdx + 1} / {allImages.length}
                </span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Main Hero Gallery --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <motion.div 
          className="relative h-[450px] md:h-[650px] rounded-[40px] md:rounded-[56px] overflow-hidden group/gallery shadow-3xl cursor-pointer ring-1 ring-white/10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => { setActiveImageIdx(0); setIsLightboxOpen(true); }}
        >
          <img 
            src={allImages[0]} 
            className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover/gallery:scale-105" 
            alt={place.name}
            onError={onImageError}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent opacity-80"></div>
          
          <div className="absolute bottom-10 left-10 md:left-16">
            <span className="bg-primary px-5 py-2 rounded-full text-bg text-[10px] font-black uppercase tracking-widest shadow-2xl">
              {place.category || 'Travel'}
            </span>
          </div>

          {allImages.length > 1 && (
            <div className="absolute bottom-10 right-10 md:right-16 px-6 py-3 bg-black/60 backdrop-blur-2xl rounded-2xl border border-white/10 text-white text-xs font-bold transition-transform hover:scale-105 flex items-center gap-3">
              <span>See all {allImages.length} photos</span>
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7"/></svg>
            </div>
          )}
        </motion.div>
      </div>

      {/* --- Detail Content --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          
          <div className="lg:col-span-2">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-textMuted mb-8">
              <Link to="/districts" className="hover:text-primary transition-colors">Districts</Link>
              <span className="opacity-20">/</span>
              <Link to={`/district/${place.districtName?.toLowerCase()}`} className="hover:text-primary transition-colors">{place.districtName}</Link>
              <span className="opacity-20">/</span>
              <span className="text-text">{place.name}</span>
            </nav>

            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                  <h1 className="font-display text-4xl md:text-6xl font-bold text-text tracking-tight mb-4">
                    {place.name}
                  </h1>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-textMuted text-sm flex items-center gap-1.5 bg-surfaceLight/30 px-3 py-1.5 rounded-lg border border-white/5">
                      📍 {place.districtName}
                    </span>
                    {distance ? (
                      <span className="bg-primary/5 text-primary text-sm font-bold px-3 py-1.5 rounded-lg border border-primary/10">
                        🚗 {distance} km away
                      </span>
                    ) : (
                      <button onClick={getLocation} className="text-xs text-primary underline underline-offset-4 hover:text-accent">
                        Detect distance
                      </button>
                    )}
                  </div>
                </div>

                {place.rating && (
                  <div className="flex flex-col items-center bg-surfaceLight/20 p-4 rounded-[24px] border border-white/5 min-w-[100px]">
                    <span className="text-2xl text-primary mb-1">★</span>
                    <span className="text-text font-black text-lg leading-none">{place.rating}</span>
                    <span className="text-[9px] font-black uppercase text-textMuted mt-1">Rating</span>
                  </div>
                )}
              </div>

              <div className="prose prose-invert max-w-none">
                <p className="text-textMuted text-lg md:text-xl leading-relaxed font-light mb-12">
                  {place.description}
                </p>
              </div>

              {/* Utility Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
                {[
                  { label: 'Best Time', val: place.bestTimeToVisit, icon: '🗓️' },
                  { label: 'Entry Fee', val: place.entryFee, icon: '💰' },
                  { label: 'Timings', val: place.timings, icon: '🕐' }
                ].map((item, i) => item.val && (
                  <div key={i} className="bg-surfaceLight/20 border border-white/5 p-6 rounded-3xl hover:bg-surfaceLight/40 transition-all group">
                    <p className="text-textMuted text-[10px] font-black uppercase tracking-widest mb-3 opacity-60 group-hover:text-primary transition-colors">
                      {item.label}
                    </p>
                    <p className="text-text font-semibold text-sm flex items-center gap-2">
                       <span className="text-base">{item.icon}</span> {item.val}
                    </p>
                  </div>
                ))}
              </div>

              {/* Tag Cloud */}
              {place.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-12">
                  {place.tags.map(tag => (
                    <span key={tag} className="bg-surfaceLight/30 text-textMuted text-[10px] font-black uppercase px-4 py-2 rounded-full border border-white/5 hover:border-primary/20 hover:text-text transition-all">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Map Visualization */}
              <div className="relative rounded-[32px] overflow-hidden h-72 mb-16 border border-white/10 group shadow-lg">
                <iframe
                  title="Interactive Map"
                  src={`https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=15&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0, filter: 'grayscale(0.2) contrast(1.1) brightness(0.9)' }}
                  allowFullScreen
                  loading="lazy"
                />
                <button 
                  onClick={() => window.open(`https://www.google.com/maps?q=${coords.lat},${coords.lng}`, '_blank')}
                  className="absolute bottom-4 right-4 bg-white text-bg px-4 py-2 rounded-xl text-[10px] font-bold shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  View in Google Maps ↗
                </button>
              </div>

              {/* Nearby Recommendations */}
              <section className="pt-12 border-t border-white/5">
                <h3 className="font-display text-2xl font-bold text-text mb-8">Discover Nearby</h3>
                <NearbyPlaces placeId={place._id} coordinates={coords} />
              </section>
            </motion.div>
          </div>

          {/* --- Sidebar Action Panel --- */}
          <aside className="lg:col-span-1">
            <div className="sticky top-28 space-y-6">
              <motion.div 
                className="bg-surfaceLight/20 backdrop-blur-3xl border border-white/10 p-8 rounded-[40px] shadow-2xl relative overflow-hidden"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] rounded-full -mr-16 -mt-16"></div>
                
                <h3 className="font-display text-xl font-bold text-text mb-6">Plan Your Trip</h3>

                {locError && (
                  <div className="mb-6 p-4 bg-danger/5 border border-danger/10 rounded-2xl">
                    <p className="text-danger text-[11px] font-medium leading-relaxed">{locError}</p>
                    <button onClick={getLocation} className="text-danger text-[10px] font-black uppercase underline mt-2 decoration-danger/30">Retry detection</button>
                  </div>
                )}

                {userLocation && (
                  <div className="mb-6 flex items-center gap-3 bg-success/5 border border-success/10 p-4 rounded-2xl">
                    <div className="w-2 h-2 bg-success rounded-full animate-pulse shadow-[0_0_12px_rgba(34,197,94,0.6)]"></div>
                    <span className="text-success text-[10px] font-black uppercase tracking-wider">Live Travel Data Enabled</span>
                  </div>
                )}

                <div className="space-y-4">
                  <button
                    onClick={startNavigation}
                    disabled={locLoading}
                    className="w-full bg-primary hover:bg-primary/90 text-bg font-black py-4 rounded-2xl transition-all active:scale-[0.97] flex items-center justify-center gap-3 shadow-xl shadow-primary/20 disabled:opacity-50"
                  >
                    {locLoading ? (
                      <div className="w-5 h-5 border-3 border-bg border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span className="text-xl">🧭</span>
                        <span className="text-sm">Start Adventure</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => window.open(`https://www.google.com/maps?q=${coords.lat},${coords.lng}`, '_blank')}
                    className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl transition-all border border-white/10 flex items-center justify-center gap-3"
                  >
                    <span className="text-lg">🗺️</span>
                    <span className="text-sm">Open Maps</span>
                  </button>
                </div>

                <div className="mt-10 pt-8 border-t border-white/5">
                  <span className="text-textMuted text-[9px] font-black uppercase tracking-[0.3em] block mb-3 opacity-50">Location Data</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-primary/40 text-[9px] font-black uppercase mb-1">Latitude</p>
                      <p className="text-text text-xs font-mono">{coords.lat.toFixed(5)}°N</p>
                    </div>
                    <div>
                      <p className="text-primary/40 text-[9px] font-black uppercase mb-1">Longitude</p>
                      <p className="text-text text-xs font-mono">{coords.lng.toFixed(5)}°E</p>
                    </div>
                  </div>
                </div>
              </motion.div>
              
              <div className="bg-accent/5 border border-accent/10 p-6 rounded-[32px]">
                <p className="text-accent text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span className="text-sm">💡</span> Smart Tip
                </p>
                <p className="text-textMuted text-xs leading-relaxed opacity-80">
                  Always check for local events or festivals before visiting, as timings may vary and crowds may increase.
                </p>
              </div>
            </div>
          </aside>
          
        </div>
      </div>
    </div>
  );
}
