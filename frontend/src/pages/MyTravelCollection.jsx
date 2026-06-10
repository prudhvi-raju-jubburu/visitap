import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getCollectionDashboard, 
  removePlaceFromCollection, 
  removeDistrictFromCollection, 
  removeTripFromCollection 
} from '../services/api';
import TravelProgressCard from '../components/TravelProgressCard';
import SavedPlacesSection from '../components/SavedPlacesSection';
import SavedDistrictsSection from '../components/SavedDistrictsSection';
import SavedTripsSection from '../components/SavedTripsSection';
import RecentlyViewedSection from '../components/RecentlyViewedSection';

export default function MyTravelCollection() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('places');

  const loadDashboard = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const cached = localStorage.getItem('cached_travel_collection_dashboard');
      if (cached) {
        setData(JSON.parse(cached));
        setLoading(false);
      }

      const res = await getCollectionDashboard();
      if (res.data?.success) {
        setData(res.data.data);
        localStorage.setItem('cached_travel_collection_dashboard', JSON.stringify(res.data.data));
        setError(null);
      } else {
        throw new Error('Failed to load traveler dashboard data');
      }
    } catch (err) {
      console.error(err);
      const cached = localStorage.getItem('cached_travel_collection_dashboard');
      if (cached) {
        setData(JSON.parse(cached));
        setError(null);
      } else {
        setError(err.response?.data?.message || 'Failed to fetch collection dashboard.');
      }
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard(true);
  }, []);

  const handleRemovePlace = async (placeId) => {
    try {
      const res = await removePlaceFromCollection(placeId);
      if (res.data?.success) {
        setData(res.data.data);
        localStorage.setItem('cached_travel_collection_dashboard', JSON.stringify(res.data.data));
      }
    } catch (err) {
      console.error('[MyTravelCollection] Remove Place Error:', err);
    }
  };

  const handleRemoveDistrict = async (districtId) => {
    try {
      const res = await removeDistrictFromCollection(districtId);
      if (res.data?.success) {
        setData(res.data.data);
        localStorage.setItem('cached_travel_collection_dashboard', JSON.stringify(res.data.data));
      }
    } catch (err) {
      console.error('[MyTravelCollection] Remove District Error:', err);
    }
  };

  const handleRemoveTrip = async (tripId) => {
    try {
      const res = await removeTripFromCollection(tripId);
      if (res.data?.success) {
        setData(res.data.data);
        localStorage.setItem('cached_travel_collection_dashboard', JSON.stringify(res.data.data));
      }
    } catch (err) {
      console.error('[MyTravelCollection] Remove Trip Error:', err);
    }
  };

  if (loading) {
    return (
      <div className="pt-32 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center min-h-[60vh] flex flex-col justify-center items-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-textMuted text-sm font-semibold">Loading Traveler Workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-32 pb-20 max-w-xl mx-auto px-4 text-center min-h-[60vh] flex flex-col justify-center items-center">
        <span className="text-5xl mb-4">🚧</span>
        <h3 className="text-xl font-bold text-text mb-2">Workspace Unavailable</h3>
        <p className="text-danger text-sm mb-6 font-semibold">{error}</p>
        <button onClick={() => loadDashboard(true)} className="btn-primary px-6 py-2.5 text-xs">
          Retry Connection
        </button>
      </div>
    );
  }

  const { stats, achievements, travelInterestProgress, collectionSummary, savedPlaces, savedDistricts, savedTrips, recentlyViewed } = data || {};

  const tabs = [
    { id: 'places', label: 'Places', count: savedPlaces?.length || 0, icon: '📍' },
    { id: 'districts', label: 'Districts', count: savedDistricts?.length || 0, icon: '🗺️' },
    { id: 'trips', label: 'Trips', count: savedTrips?.length || 0, icon: '📅' },
    { id: 'history', label: 'Recently Viewed', count: recentlyViewed?.length || 0, icon: '👀' }
  ];

  return (
    <div className="pt-28 pb-20 min-h-screen bg-bg antialiased">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Hero Section */}
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
          <div>
            <h1 className="font-display text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
              My Travel Collection
            </h1>
            <p className="text-textMuted text-sm font-medium opacity-80 max-w-xl">
              Track your destinations progress, saved trips, unlocked milestones, and physical exploration highlights.
            </p>
          </div>
          
          {/* Quick stats badge summary */}
          {stats?.lastSavedPlace && (
            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl hidden md:flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-lg">
                📌
              </div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-textMuted">
                <span>Last Activity</span>
                <span className="block text-white font-extrabold truncate max-w-[120px]">
                  {stats.lastSavedPlace?.name || 'Saved Place'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Progress & Achievements Panel */}
        <TravelProgressCard 
          stats={stats} 
          achievements={achievements} 
          travelInterestProgress={travelInterestProgress}
          collectionSummary={collectionSummary}
        />

        {/* Workspace Tabbed Panel */}
        <div className="mb-8 border-b border-white/5 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 rounded-t-2xl font-bold text-xs md:text-sm transition-all flex items-center gap-2 border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary text-primary bg-primary/5 font-extrabold'
                  : 'border-transparent text-textMuted hover:text-text hover:bg-white/[0.02]'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-normal ${
                activeTab === tab.id 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-white/5 text-textMuted'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Animated Subsections */}
        <div className="mt-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'places' && (
                <SavedPlacesSection places={savedPlaces} onRemove={handleRemovePlace} />
              )}
              {activeTab === 'districts' && (
                <SavedDistrictsSection districts={savedDistricts} onRemove={handleRemoveDistrict} />
              )}
              {activeTab === 'trips' && (
                <SavedTripsSection trips={savedTrips} onRemove={handleRemoveTrip} />
              )}
              {activeTab === 'history' && (
                <RecentlyViewedSection history={recentlyViewed} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
