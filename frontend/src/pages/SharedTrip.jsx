import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchSharedTrip, exportTripPDF } from '../services/api';
import RouteSummary from '../components/RouteSummary';
import ItineraryTimeline from '../components/ItineraryTimeline';

export default function SharedTrip() {
  const { shareId } = useParams();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadSharedData = async () => {
    try {
      setLoading(true);
      const res = await fetchSharedTrip(shareId);
      setTrip(res.data.data);
    } catch (err) {
      console.error('Failed to load shared trip:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSharedData();
  }, [shareId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = async () => {
    if (!trip) return;
    try {
      setExporting(true);
      alert('Generating your itinerary PDF. Download will begin shortly...');
      // PDF export allows guest access if trip is public
      const res = await exportTripPDF(trip.shareId);
      
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `VisitAP-Trip-${trip.title.replace(/\s+/g, '-')}.pdf`;
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <div className="py-24 text-center text-textMuted">Loading shared itinerary...</div>;

  if (!trip) {
    return (
      <div className="py-24 px-4 text-center text-textMuted flex flex-col items-center max-w-md mx-auto">
        <span className="text-4xl mb-4">🔍</span>
        <h3 className="font-display text-lg font-bold text-white">Shared Trip Not Found</h3>
        <p className="text-xs text-textMuted/70 mt-1">
          This itinerary may have been deleted, set to private, or the link provided is invalid.
        </p>
        <Link
          to="/"
          className="mt-6 btn-primary !px-5 !py-2.5 !rounded-xl text-xs font-black shadow-md"
        >
          Go to Home
        </Link>
      </div>
    );
  }

  const currentPlacesCount = trip.days?.reduce((acc, d) => acc + (d.places ? d.places.length : 0), 0) || 0;

  return (
    <div className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen flex flex-col gap-8">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-extrabold uppercase tracking-wider">
            Shared Travel Plan 🌐
          </span>
          <h1 className="font-display text-4xl font-black text-white mt-3 tracking-tight">
            Shared Itinerary
          </h1>
          <p className="text-textMuted text-sm mt-1">
            View this traveler's custom travel roadmap for Andhra Pradesh
          </p>
        </div>

        <Link
          to="/trip-planner"
          className="btn-primary !px-6 !py-3 !rounded-2xl text-xs font-black flex items-center gap-2 shadow-lg self-start sm:self-auto"
        >
          Plan Your Own Trip
        </Link>
      </div>

      {/* Route Summary */}
      <RouteSummary
        title={trip.title}
        districts={trip.districts}
        placesCount={currentPlacesCount}
        distance={trip.totalDistance}
        duration={trip.estimatedDuration}
        travelMode={trip.travelMode}
      />

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 bg-surface/30 border border-white/10 rounded-3xl p-4 shadow-md">
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-bg text-xs font-black hover:bg-amber-400 transition-all shadow-md active:scale-95 disabled:opacity-50"
        >
          <span>📄</span> {exporting ? 'Generating...' : 'Download Itinerary PDF'}
        </button>

        <button
          onClick={handleCopyLink}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 border ${
            copied
              ? 'bg-emerald-500 text-bg border-emerald-500'
              : 'bg-white/5 border-white/10 text-text hover:bg-white/10'
          }`}
        >
          <span>🔗</span> {copied ? 'Link Copied! ✓' : 'Copy Shareable Link'}
        </button>
      </div>

      {/* Timeline display */}
      <ItineraryTimeline
        days={trip.days}
        travelMode={trip.travelMode}
        readOnly={true}
      />
    </div>
  );
}
