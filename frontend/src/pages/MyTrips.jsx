import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchTrips, deleteTrip, exportTripPDF, getFavorites } from '../services/api';
import TripCard from '../components/TripCard';
import PlaceCard from '../components/PlaceCard';
import { CardSkeleton } from '../components/SkeletonLoader';

export default function MyTrips() {
  const [trips, setTrips] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingFavs, setLoadingFavs] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const loadData = async () => {
    try {
      setLoadingTrips(true);
      const res = await fetchTrips();
      setTrips(res.data.data || []);
    } catch (err) {
      console.error('Failed to load trips:', err);
    } finally {
      setLoadingTrips(false);
    }

    try {
      setLoadingFavs(true);
      const res = await getFavorites();
      setFavorites(res.data.data || []);
    } catch (err) {
      console.error('Failed to load favorites:', err);
    } finally {
      setLoadingFavs(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteTrip = async (id) => {
    if (!window.confirm('Are you sure you want to delete this trip plan? This action cannot be undone.')) return;
    try {
      setDeletingId(id);
      await deleteTrip(id);
      setTrips(trips.filter(t => t._id !== id));
    } catch (err) {
      alert('Failed to delete trip plan. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownloadPDF = async (id) => {
    try {
      alert('Generating your itinerary PDF. Download will begin shortly...');
      const res = await exportTripPDF(id);
      
      // Handle binary stream download
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `VisitAP-Trip.pdf`;
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      alert('Failed to generate PDF. Please try again later.');
    }
  };

  // Calculate Statistics
  const totalTrips = trips.length;
  const totalDistance = trips.reduce((acc, t) => acc + (t.totalDistance || 0), 0);
  const totalAttractions = trips.reduce((acc, t) => {
    if (!t.days) return acc;
    return acc + t.days.reduce((sum, d) => sum + (d.places ? d.places.length : 0), 0);
  }, 0);

  return (
    <div className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen flex flex-col gap-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] bg-primary/20 text-primary border border-primary/20 px-3 py-1 rounded-full font-extrabold uppercase tracking-wider">
            Traveler Dashboard
          </span>
          <h1 className="font-display text-4xl font-black text-white mt-3 tracking-tight">
            My Travel Plans
          </h1>
          <p className="text-textMuted text-sm mt-1">
            Create, manage, and share your personalized itineraries for Andhra Pradesh
          </p>
        </div>
        <Link
          to="/trip-planner"
          className="btn-primary !px-6 !py-3 !rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg self-start md:self-auto"
        >
          <span>➕</span> Create New Plan
        </Link>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-surface/30 border border-white/5 p-6 rounded-[2rem] shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl shadow-md">
            📅
          </div>
          <div>
            <p className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Total Itineraries</p>
            <p className="font-display text-2xl font-black text-text mt-0.5">{totalTrips}</p>
          </div>
        </div>

        <div className="bg-surface/30 border border-white/5 p-6 rounded-[2rem] shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl shadow-md">
            🗺️
          </div>
          <div>
            <p className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Distance Covered</p>
            <p className="font-display text-2xl font-black text-emerald-400 mt-0.5">
              {totalDistance.toFixed(1)} <span className="text-xs font-bold">km</span>
            </p>
          </div>
        </div>

        <div className="bg-surface/30 border border-white/5 p-6 rounded-[2rem] shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl shadow-md">
            ✨
          </div>
          <div>
            <p className="text-[10px] text-textMuted font-bold uppercase tracking-wider">Attractions Planned</p>
            <p className="font-display text-2xl font-black text-amber-400 mt-0.5">{totalAttractions}</p>
          </div>
        </div>
      </div>

      {/* Trips Grid */}
      <div>
        <h3 className="font-display text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span>✈️</span> Saved Itineraries
        </h3>
        
        {loadingTrips ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : trips.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <TripCard
                key={trip._id}
                trip={trip}
                onDelete={handleDeleteTrip}
                onExport={handleDownloadPDF}
              />
            ))}
          </div>
        ) : (
          <div className="bg-surface/20 border border-white/5 rounded-[2.5rem] p-12 text-center text-textMuted flex flex-col items-center max-w-lg mx-auto shadow-md">
            <div className="bg-white/5 border border-white/10 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-md">
              🧳
            </div>
            <p className="text-sm font-semibold">No travel plans saved yet</p>
            <p className="text-xs text-textMuted/70 mt-1">
              Start building your first day-by-day travel map for Andhra Pradesh!
            </p>
            <Link
              to="/trip-planner"
              className="mt-6 btn-primary !px-5 !py-2.5 !rounded-xl text-xs font-black shadow-md"
            >
              Open Trip Planner
            </Link>
          </div>
        )}
      </div>

      {/* Favorites / Saved Places */}
      <div className="border-t border-white/5 pt-10">
        <h3 className="font-display text-xl font-bold text-white mb-6 flex items-center gap-2">
          <span>💖</span> Saved Places
        </h3>

        {loadingFavs ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : favorites.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((place, i) => (
              <PlaceCard key={place._id} place={place} index={i} />
            ))}
          </div>
        ) : (
          <div className="bg-surface/20 border border-white/5 rounded-[2.5rem] p-10 text-center text-textMuted flex flex-col items-center max-w-lg mx-auto">
            <span className="text-3xl block mb-2">⭐</span>
            <p className="text-sm font-semibold">No saved places found</p>
            <p className="text-xs text-textMuted/70 mt-1">
              Bookmark attractions while browsing districts to see them here!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
