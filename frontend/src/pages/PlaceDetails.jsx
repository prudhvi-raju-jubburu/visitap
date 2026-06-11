import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchPlace, checkFavorite, getPlaceReviews, createReview, updateReview, deleteReview, getReviewStats, getMyReviewForPlace, savePlaceToCollection, removePlaceFromCollection, trackRecentlyViewed, trackClientEvent } from '../services/api';
import { useGeolocation } from '../hooks/useGeolocation';
import NearbyPlaces from '../components/NearbyPlaces';
import { useUserAuth } from '../context/AuthContext';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop';

const sanitizeImages = (cover, images) => {
  const candidates = [cover, ...(Array.isArray(images) ? images : [])];
  const valid = candidates.filter(url => 
    url && typeof url === 'string' && url.trim().length > 0
  ).map(url => url.trim());
  
  const unique = Array.from(new Set(valid));
  return unique.length > 0 ? unique : [DEFAULT_IMAGE];
};

const parseCoordinates = (location) => {
  const defaults = { lat: 15.0, lng: 80.0 };
  if (!location) return defaults;

  if (location.coordinates && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
    return {
      lat: parseFloat(location.coordinates[1]) ?? defaults.lat,
      lng: parseFloat(location.coordinates[0]) ?? defaults.lng
    };
  }

  const lat = parseFloat(location.lat ?? location.latitude);
  const lng = parseFloat(location.lng ?? location.longitude);

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

  // Simple Mode State
  const [isSimpleMode, setIsSimpleMode] = useState(
    () => localStorage.getItem('simpleMode') === 'true'
  );

  useEffect(() => {
    const syncMode = () => {
      setIsSimpleMode(localStorage.getItem('simpleMode') === 'true');
    };
    window.addEventListener('simpleModeChanged', syncMode);
    return () => window.removeEventListener('simpleModeChanged', syncMode);
  }, []);

  // Custom Hooks
  const { 
    location: userLocation, 
    loading: locLoading, 
    error: locError, 
    getLocation, 
    calculateDistance 
  } = useGeolocation();

  const navigate = useNavigate();
  const { isAuthenticated, setUser, user } = useUserAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Reviews States
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1);
  const [reviewsTotalCount, setReviewsTotalCount] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(null);
  const [editingReviewId, setEditingReviewId] = useState(null);

  // Statistics States
  const [stats, setStats] = useState({
    averageRating: 0,
    reviewCount: 0,
    distribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 }
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const loadReviews = useCallback(async (page = 1) => {
    setReviewsLoading(true);
    try {
      const res = await getPlaceReviews(place?._id || placeId, { page, limit: 5 });
      setReviews(res.data.reviews || []);
      setReviewsTotalPages(res.data.pages || 1);
      setReviewsTotalCount(res.data.total || 0);
      setReviewsPage(res.data.currentPage || page);
    } catch (err) {
      console.error('[PlaceDetails] Load Reviews Error:', err);
    } finally {
      setReviewsLoading(false);
    }
  }, [placeId, place?._id]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await getReviewStats(place?._id || placeId);
      if (res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('[PlaceDetails] Load Stats Error:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [placeId, place?._id]);

  const loadMyReview = useCallback(async () => {
    if (!isAuthenticated) {
      setReviewForm({ rating: 5, comment: '' });
      setEditingReviewId(null);
      return;
    }
    try {
      const res = await getMyReviewForPlace(place?._id || placeId);
      if (res.data && res.data.review) {
        setReviewForm({ rating: res.data.review.rating, comment: res.data.review.comment });
        setEditingReviewId(res.data.review._id);
      } else {
        setReviewForm({ rating: 5, comment: '' });
        setEditingReviewId(null);
      }
    } catch (err) {
      console.error('[PlaceDetails] Load My Review Error:', err);
    }
  }, [placeId, place?._id, isAuthenticated]);

  useEffect(() => {
    loadReviews(1);
    loadStats();
  }, [placeId, loadReviews, loadStats]);

  useEffect(() => {
    loadMyReview();
  }, [isAuthenticated, loadMyReview]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }
    setSubmittingReview(true);
    setReviewError(null);
    setReviewSuccess(null);
    try {
      if (editingReviewId) {
        await updateReview(editingReviewId, reviewForm);
        setReviewSuccess('Review updated successfully!');
      } else {
        await createReview(place?._id || placeId, reviewForm);
        setReviewSuccess('Review submitted successfully!');
      }
      await loadReviews(1);
      await loadStats();
      await loadMyReview();
      const placeRes = await fetchPlace(place?._id || placeId);
      const placeData = placeRes.data?.data || placeRes.data;
      if (placeData) setPlace(placeData);
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReviewDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete your review?')) return;
    try {
      await deleteReview(reviewId);
      setReviewSuccess('Review deleted successfully!');
      setReviewForm({ rating: 5, comment: '' });
      setEditingReviewId(null);
      await loadReviews(1);
      await loadStats();
      await loadMyReview();
      const placeRes = await fetchPlace(placeId);
      const placeData = placeRes.data?.data || placeRes.data;
      if (placeData) setPlace(placeData);
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to delete review.');
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      const cachePKey = `cached_place_details_${placeId}`;
      try {
        const cached = localStorage.getItem(cachePKey);
        if (cached) {
          setPlace(JSON.parse(cached));
          setLoading(false);
        }

        const response = await fetchPlace(placeId);
        if (isMounted) {
          const data = response.data?.data || response.data;
          if (!data) throw new Error('Resource not found');
          setPlace(data);
          localStorage.setItem(cachePKey, JSON.stringify(data));
          
          trackClientEvent('PLACE_VIEW', {
            placeId: data._id,
            districtId: data.districtId,
            category: data.category
          });
        }
      } catch (err) {
        if (isMounted) {
          const cached = localStorage.getItem(cachePKey);
          if (cached) {
            setPlace(JSON.parse(cached));
            setError(null);
          } else {
            setError(err.response?.status === 404 ? 'Place not found' : 'Failed to load details');
          }
          console.error('[PlaceDetails] Fetch Error:', err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    getLocation();

    return () => { isMounted = false; };
  }, [placeId, getLocation]);

  useEffect(() => {
    let isMounted = true;
    const getStatus = async () => {
      if (isAuthenticated && (place?._id || placeId)) {
        try {
          const res = await checkFavorite(place?._id || placeId);
          if (isMounted) {
            setIsFavorite(res.data.isFavorite);
          }
        } catch (err) {
          console.error('[PlaceDetails] Check Favorite Error:', err);
        }
      }
    };
    getStatus();
    return () => { isMounted = false; };
  }, [placeId, place?._id, isAuthenticated]);

  useEffect(() => {
    if (!place || !place._id) return;

    const recordVisit = async () => {
      if (isAuthenticated) {
        let guestRecentIds = [];
        try {
          const stored = localStorage.getItem('recentPlaces');
          if (stored) {
            guestRecentIds = JSON.parse(stored);
          }
        } catch (e) {
          console.error('[PlaceDetails] LocalStorage Parse Error:', e);
        }

        try {
          await trackRecentlyViewed(place._id, guestRecentIds);
          localStorage.removeItem('recentPlaces');
        } catch (err) {
          console.error('[PlaceDetails] Track Recent Error:', err);
        }
      } else {
        try {
          const stored = localStorage.getItem('recentPlaces');
          let recent = stored ? JSON.parse(stored) : [];
          if (!Array.isArray(recent)) recent = [];
          recent = recent.filter(id => id !== place._id);
          recent.unshift(place._id);
          if (recent.length > 20) {
            recent = recent.slice(0, 20);
          }
          localStorage.setItem('recentPlaces', JSON.stringify(recent));
        } catch (e) {
          console.error('[PlaceDetails] LocalStorage Save Error:', e);
        }
      }
    };

    recordVisit();
  }, [place, isAuthenticated]);

  const toggleFavorite = async (e) => {
    e?.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    const originalFavorite = isFavorite;
    const originalUser = user;

    setIsFavorite(!originalFavorite);
    setUser(currUser => {
      if (!currUser) return null;
      const targetId = place?._id || placeId;
      const updatedFavs = originalFavorite
        ? (currUser.favorites || []).filter(id => id !== targetId)
        : [...(currUser.favorites || []), targetId];
      const updatedUser = { ...currUser, favorites: updatedFavs };
      localStorage.setItem('visitap_user', JSON.stringify(updatedUser));
      return updatedUser;
    });

    setFavoriteLoading(true);
    try {
      if (originalFavorite) {
        await removePlaceFromCollection(place._id);
      } else {
        await savePlaceToCollection(place._id);
      }
    } catch (err) {
      console.error('[PlaceDetails] Toggle Favorite Error:', err);
      setIsFavorite(originalFavorite);
      setUser(originalUser);
      if (originalUser) {
        localStorage.setItem('visitap_user', JSON.stringify(originalUser));
      } else {
        localStorage.removeItem('visitap_user');
      }
    } finally {
      setFavoriteLoading(false);
    }
  };

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

  const distribution = useMemo(() => {
    const total = stats.reviewCount || 1;
    const result = {};
    [5, 4, 3, 2, 1].forEach(key => {
      const count = stats.distribution?.[key] || 0;
      result[key] = {
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      };
    });
    return result;
  }, [stats]);

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
      e.target.onerror = null;
      e.target.src = DEFAULT_IMAGE;
    }
  };

  const hasValidCoordinates = useMemo(() => {
    if (!place?.location) return false;
    const parsed = parseCoordinates(place.location);
    return (
      Number.isFinite(parsed.lat) &&
      Number.isFinite(parsed.lng) &&
      parsed.lat >= -90 &&
      parsed.lat <= 90 &&
      parsed.lng >= -180 &&
      parsed.lng <= 180 &&
      parsed.lat !== 0 &&
      parsed.lng !== 0
    );
  }, [place?.location]);

  const openInGoogleMaps = () => {
    window.open(`https://www.google.com/maps?q=${coords.lat},${coords.lng}`, '_blank');
  };

  const handleStartJourney = () => {
    if (!hasValidCoordinates) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = url;
    } else {
      window.open(url, '_blank');
    }
  };

  const scrollToReviews = () => {
    document.getElementById('review-form-card')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToNearby = () => {
    document.getElementById('nearby-places-section')?.scrollIntoView({ behavior: 'smooth' });
  };

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

  if (loading) {
    return (
      <div className="pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-[400px] skeleton animate-pulse rounded-[32px] bg-surfaceLight/50 mb-12"></div>
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
          <h2 className="text-2xl font-bold text-white mb-4">{error}</h2>
          <Link to="/districts" className="btn-primary inline-flex items-center gap-2">
            <span>←</span> Back to Exploration
          </Link>
        </div>
      </div>
    );
  }

  const ratingVal = stats.averageRating;
  const ratingCount = stats.reviewCount;

  return (
    <div className="pt-20 pb-20 min-h-screen bg-bg antialiased text-white">
      {/* Lightbox */}
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

      {/* Main Hero Gallery */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <motion.div 
          className="relative h-[300px] md:h-[500px] rounded-[36px] overflow-hidden group/gallery shadow-3xl cursor-pointer ring-1 ring-white/10"
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
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent opacity-85"></div>
          
          <div className="absolute bottom-6 left-6 md:left-10">
            <span className="bg-primary px-5 py-2.5 rounded-xl text-bg text-xs font-black uppercase tracking-widest shadow-2xl">
              {place.category || 'Travel'}
            </span>
          </div>

          {allImages.length > 1 && (
            <div className="absolute bottom-6 right-6 md:right-10 px-5 py-3 bg-black/70 backdrop-blur-md rounded-2xl border border-white/10 text-white text-sm font-bold transition-transform hover:scale-105 flex items-center gap-3">
              <span>See all {allImages.length} photos</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Detail Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          <div className="lg:col-span-2">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-textMuted mb-6">
              <Link to="/districts" className="hover:text-primary transition-colors">Districts</Link>
              <span className="opacity-20">/</span>
              <span className="text-white">{place.name}</span>
            </nav>

            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                  <h1 className="font-display text-4xl md:text-5xl font-black text-white tracking-tight mb-4 leading-tight">
                    {place.name}
                  </h1>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-white text-base font-bold flex items-center gap-1.5 bg-surfaceLight/50 px-4 py-2 rounded-xl border border-white/10">
                      📍 {place.districtName}
                    </span>
                    {distance && (
                      <span className="bg-primary/20 text-primary text-base font-black px-4 py-2 rounded-xl border border-primary/25">
                        🚗 {distance} km away
                      </span>
                    )}
                  </div>
                </div>

                {ratingVal > 0 && (
                  <div className="flex flex-col items-center bg-surfaceLight/40 p-5 rounded-[24px] border border-white/10 min-w-[120px] shadow-sm">
                    <span className="text-3xl text-primary mb-1">★</span>
                    <span className="text-white font-black text-2xl leading-none">{ratingVal.toFixed(1)}</span>
                    <span className="text-[10px] font-black uppercase text-textMuted mt-1.5">
                      {ratingCount > 0 ? `${ratingCount} Rating${ratingCount > 1 ? 's' : ''}` : 'Rating'}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="prose prose-invert max-w-none mb-10">
                <p className="text-white/95 text-lg md:text-xl leading-relaxed font-semibold">
                  {place.description}
                </p>
              </div>

              {/* Quick Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                {[
                  { label: 'Best Time to Visit', val: place.bestTimeToVisit, icon: '🗓️' },
                  { label: 'Entry Fee', val: place.entryFee, icon: '💰' },
                  { label: 'Timings', val: place.timings, icon: '🕐' }
                ].map((item, i) => item.val && (
                  <div key={i} className="bg-surfaceLight/35 border border-white/10 p-6 rounded-3xl hover:bg-surfaceLight/50 transition-all group">
                    <p className="text-textMuted text-xs font-black uppercase tracking-wider mb-2 opacity-75 group-hover:text-primary transition-colors">
                      {item.label}
                    </p>
                    <p className="text-white font-bold text-base flex items-center gap-2">
                       <span className="text-xl">{item.icon}</span> {item.val}
                    </p>
                  </div>
                ))}
              </div>

              {/* Tags Cloud */}
              {place.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2.5 mb-10">
                  {place.tags.map(tag => (
                    <span key={tag} className="bg-surfaceLight/40 text-textMuted text-xs font-bold px-4 py-2 rounded-full border border-white/10 hover:border-primary/30 hover:text-white transition-all">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Simplified Leaflet Map Preview */}
              <div className="relative rounded-[32px] overflow-hidden h-64 md:h-96 mb-16 border border-white/10 group shadow-lg">
                <iframe
                  title="Interactive Maps"
                  src={`https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=14&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0, filter: 'grayscale(0.1) contrast(1.1) brightness(0.9)' }}
                  allowFullScreen
                  loading="lazy"
                />
                <button 
                  onClick={openInGoogleMaps}
                  className="absolute bottom-4 right-4 bg-white text-bg px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl transition-transform hover:scale-105 active:scale-95"
                >
                  View in Google Maps ↗
                </button>
              </div>

              {/* Tourist Reviews and Rating distribution */}
              <section className="mt-16 border-t border-white/10 pt-12">
                <h3 className="font-display text-2xl font-black text-white mb-8">Tourist Reviews</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                  {/* Summary */}
                  <div className="bg-surfaceLight/30 p-6 rounded-[28px] border border-white/10 flex flex-col items-center justify-center text-center shadow-md">
                    <span className="text-xs font-black uppercase text-textMuted tracking-wider mb-2">Average Rating</span>
                    <span className="font-display text-5xl font-black text-primary mb-1">
                      {ratingVal > 0 ? ratingVal.toFixed(1) : '0.0'}
                    </span>
                    <div className="flex gap-1 mb-2 text-primary text-xl">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={star <= Math.round(ratingVal) ? 'opacity-100' : 'opacity-20'}>★</span>
                      ))}
                    </div>
                    <span className="text-xs text-textMuted font-bold">
                      Based on {ratingCount} review{ratingCount !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Rating distribution progress bars */}
                  <div className="bg-surfaceLight/30 p-6 rounded-[28px] border border-white/10 md:col-span-2 space-y-3 shadow-md">
                    <h4 className="text-sm font-bold text-white mb-2">Rating Distribution</h4>
                    {[5, 4, 3, 2, 1].map((star) => {
                      const percentage = distribution[star]?.percentage || 0;
                      const count = distribution[star]?.count || 0;
                      return (
                        <div key={star} className="flex items-center gap-3 text-xs sm:text-sm">
                          <span className="w-14 text-textMuted text-right font-bold">{star} star{star !== 1 ? 's' : ''}</span>
                          <div className="flex-1 h-3.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-amber-300 rounded-full transition-all" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="w-20 text-textMuted text-left font-bold">
                            {percentage}% ({count})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Review Form card */}
                <div id="review-form-card" className="bg-surfaceLight/30 p-6 sm:p-8 rounded-[32px] border border-white/10 mb-12 shadow-lg">
                  {isAuthenticated ? (
                    <form onSubmit={handleReviewSubmit} className="space-y-6">
                      <h4 className="font-display text-xl font-bold text-white">
                        {editingReviewId ? 'Edit Your Experience' : 'Share Your Experience'}
                      </h4>

                      {reviewError && (
                        <div className="p-4 bg-danger/10 border border-danger/20 text-danger text-sm font-bold rounded-2xl text-center">
                          {reviewError}
                        </div>
                      )}

                      {reviewSuccess && (
                        <div className="p-4 bg-success/10 border border-success/20 text-success text-sm font-bold rounded-2xl text-center">
                          {reviewSuccess}
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-black uppercase text-textMuted tracking-wider block mb-2">Your Rating</label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                              className="text-4xl transition-transform hover:scale-110 active:scale-95 focus:outline-none"
                              aria-label={`Rate ${star} Stars`}
                            >
                              <span className={star <= reviewForm.rating ? 'text-primary' : 'text-white/10'}>
                                ★
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-black uppercase text-textMuted tracking-wider block mb-2">
                          Review Comment
                        </label>
                        <textarea
                          rows={4}
                          value={reviewForm.comment}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                          maxLength={1000}
                          required
                          placeholder="What did you like or dislike? Describe your adventure..."
                          className="w-full bg-surfaceLight border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-primary text-base placeholder-textMuted/50 font-body"
                        />
                        <div className="text-right text-xs text-textMuted mt-1">
                          {reviewForm.comment.length} / 1000 characters
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <button
                          type="submit"
                          disabled={submittingReview}
                          className="w-full sm:w-auto bg-primary hover:bg-amber-400 text-bg font-black px-8 min-h-[48px] rounded-2xl shadow-xl transition-all uppercase tracking-wider text-base active:scale-95 disabled:opacity-50"
                        >
                          {submittingReview ? 'Submitting...' : 'Submit Review'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-textMuted mb-4 text-base font-semibold">Please login to write reviews.</p>
                      <Link to="/login" className="btn-primary inline-block font-bold py-3 px-6 rounded-xl">
                        Login
                      </Link>
                    </div>
                  )}
                </div>

                {/* Reviews List */}
                <div className="space-y-4">
                  {reviewsLoading ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-32 bg-surfaceLight/20 animate-pulse rounded-2xl"></div>
                      ))}
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-10 text-textMuted text-base font-semibold">
                      No visitor reviews yet. Be the first to share your experience!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((rev) => {
                        const isMyReview = user?._id === rev.user?._id || user?._id === rev.user;
                        const reviewerName = rev.userName || rev.user?.name || 'Visitor';
                        const reviewDate = rev.createdAt 
                          ? new Date(rev.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                          : 'N/A';
                        return (
                          <div key={rev._id} className="bg-surfaceLight/25 p-6 rounded-2xl border border-white/5 relative group hover:border-white/10 transition-colors shadow-sm">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-bg font-bold text-sm uppercase">
                                  {reviewerName[0]}
                                </div>
                                <div>
                                  <h5 className="font-bold text-white text-base flex items-center gap-2">
                                    {reviewerName}
                                    {isMyReview && (
                                      <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-0.5 rounded border border-primary/20">
                                        You
                                      </span>
                                    )}
                                  </h5>
                                  <p className="text-[11px] text-textMuted">{reviewDate}</p>
                                </div>
                              </div>
                              <div className="flex text-primary">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <span key={star} className={star <= rev.rating ? 'opacity-100' : 'opacity-20'}>★</span>
                                ))}
                              </div>
                            </div>
                            <p className="text-white/90 text-base leading-relaxed whitespace-pre-wrap break-words font-body font-light">
                              {rev.comment}
                            </p>
                            
                            {isMyReview && (
                              <div className="mt-4 pt-3 border-t border-white/5 flex gap-4">
                                <button
                                  onClick={() => {
                                    setReviewForm({ rating: rev.rating, comment: rev.comment });
                                    setEditingReviewId(rev._id);
                                    scrollToReviews();
                                  }}
                                  className="text-sm text-primary font-black hover:underline"
                                >
                                  Edit Review
                                </button>
                                <button
                                  onClick={() => handleReviewDelete(rev._id)}
                                  className="text-sm text-danger font-black hover:underline"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      
                      {reviewsTotalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-8 pt-4 border-t border-white/5">
                          <button
                            onClick={() => loadReviews(reviewsPage - 1)}
                            disabled={reviewsPage === 1}
                            className="px-5 py-3 text-sm font-bold bg-white/5 hover:bg-white/10 rounded-xl disabled:opacity-30 border border-white/10 transition-all text-white min-h-[48px]"
                          >
                            Previous
                          </button>
                          <span className="text-sm text-textMuted font-bold uppercase">
                            Page {reviewsPage} of {reviewsTotalPages}
                          </span>
                          <button
                            onClick={() => loadReviews(reviewsPage + 1)}
                            disabled={reviewsPage === reviewsTotalPages}
                            className="px-5 py-3 text-sm font-bold bg-white/5 hover:bg-white/10 rounded-xl disabled:opacity-30 border border-white/10 transition-all text-white min-h-[48px]"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* Discover Nearby */}
              <section id="nearby-places-section" className="pt-12 border-t border-white/10">
                <h3 className="font-display text-2xl font-black text-white mb-8">Nearby Places</h3>
                <NearbyPlaces placeId={place._id} coordinates={coords} />
              </section>
            </motion.div>
          </div>

          {/* Action Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-28 space-y-6">
              <motion.div 
                className="bg-surfaceLight/40 backdrop-blur-3xl border border-white/10 p-8 rounded-[40px] shadow-2xl relative overflow-hidden"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] rounded-full -mr-16 -mt-16"></div>
                
                <h3 className="font-display text-xl font-bold text-white mb-6 uppercase tracking-wider">Plan Your Trip</h3>

                {locError && (
                  <div className="mb-6 p-4 bg-danger/5 border border-danger/10 rounded-2xl">
                    <p className="text-danger text-[11px] font-medium leading-relaxed">{locError}</p>
                    <button onClick={getLocation} className="text-danger text-[10px] font-black uppercase underline mt-2">Retry GPS</button>
                  </div>
                )}

                {userLocation && (
                  <div className="mb-6 flex items-center gap-3 bg-success/5 border border-success/15 p-4 rounded-2xl">
                    <div className="w-2.5 h-2.5 bg-success rounded-full animate-pulse shadow-success"></div>
                    <span className="text-success text-[10px] font-black uppercase tracking-wider">GPS Enabled</span>
                  </div>
                )}

                {/* Route Summary Card */}
                <div className="mb-6 p-5 bg-white/[0.03] border border-white/10 rounded-3xl relative overflow-hidden font-body">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-primary text-base">📍</span>
                    <span className="text-white text-xs font-black uppercase tracking-wider">Route Summary</span>
                  </div>
                  
                  <button
                    onClick={handleStartJourney}
                    disabled={!hasValidCoordinates}
                    className={`w-full font-black min-h-[50px] rounded-2xl transition-all border flex items-center justify-center gap-3 active:scale-[0.98] text-base ${
                      hasValidCoordinates 
                        ? 'bg-gradient-to-r from-primary to-amber-500 hover:from-amber-400 hover:to-amber-600 text-bg border-transparent shadow-amber' 
                        : 'bg-white/5 text-textMuted border-white/5 opacity-50 cursor-not-allowed'
                    }`}
                    title={!hasValidCoordinates ? "Directions are currently unavailable for this destination." : "Start Navigation to Destination"}
                    aria-label="Start Journey Navigation using Google Maps"
                  >
                    <span>🧭</span>
                    <span>Start Journey</span>
                  </button>

                  {!hasValidCoordinates && (
                    <p className="text-danger text-[10px] text-center font-bold mb-3 leading-relaxed">
                      Directions are currently unavailable for this destination.
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3 font-mono text-[11px] leading-relaxed">
                    <div>
                      <p className="text-primary/50 text-[9px] font-black uppercase mb-0.5">Latitude</p>
                      <p className="text-text">{coords.lat.toFixed(5)}°N</p>
                    </div>
                    <div>
                      <p className="text-primary/50 text-[9px] font-black uppercase mb-0.5">Longitude</p>
                      <p className="text-text">{coords.lng.toFixed(5)}°E</p>
                    </div>
                  </div>
                </div>

                {/* Primary Actions (Touch targets >= 48px) */}
                <div className="space-y-4 font-body">
                  <button
                    onClick={toggleFavorite}
                    disabled={favoriteLoading}
                    className={`w-full font-black min-h-[52px] rounded-2xl transition-all border flex items-center justify-center gap-3 active:scale-[0.98] text-base ${
                      isFavorite 
                        ? 'bg-primary text-bg border-primary shadow-amber' 
                        : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                    }`}
                    aria-label={isFavorite ? "Saved Place" : "Save Place to Travel Collection"}
                  >
                    <span>{isFavorite ? '❤️' : '🤍'}</span>
                    <span>{isFavorite ? 'Saved Place' : 'Save Place'}</span>
                  </button>

                  <button
                    onClick={openInGoogleMaps}
                    className="w-full bg-white/5 hover:bg-white/10 text-white font-black min-h-[52px] rounded-2xl transition-all border border-white/10 flex items-center justify-center gap-3 active:scale-[0.98] text-base"
                    aria-label="Open location in standard Google Maps view"
                  >
                    <span>📍</span>
                    <span>Open in Maps</span>
                  </button>

                  <button
                    onClick={scrollToReviews}
                    className="w-full bg-white/5 hover:bg-white/10 text-white font-black min-h-[52px] rounded-2xl transition-all border border-white/10 flex items-center justify-center gap-3 active:scale-[0.98] text-base"
                    aria-label="Scroll to reviews submission form"
                  >
                    <span>⭐</span>
                    <span>Give Review</span>
                  </button>

                  <button
                    onClick={scrollToNearby}
                    className="w-full bg-white/5 hover:bg-white/10 text-white font-black min-h-[52px] rounded-2xl transition-all border border-white/10 flex items-center justify-center gap-3 active:scale-[0.98] text-base"
                    aria-label="Scroll to nearby places recommendations"
                  >
                    <span>🗺️</span>
                    <span>Nearby Places</span>
                  </button>
                </div>
              </motion.div>
              
              <div className="bg-accent/5 border border-accent/15 p-6 rounded-[28px] shadow-sm">
                <p className="text-accent text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-2">
                  <span>💡</span> Smart Tip
                </p>
                <p className="text-textMuted text-sm leading-relaxed font-semibold opacity-90">
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
