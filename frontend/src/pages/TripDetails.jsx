import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fetchTrip, deleteTrip, exportTripPDF, shareTrip } from '../services/api';
import RouteSummary from '../components/RouteSummary';
import ItineraryTimeline from '../components/ItineraryTimeline';
import TripShareModal from '../components/TripShareModal';

export default function TripDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const loadTripData = async () => {
    try {
      setLoading(true);
      const res = await fetchTrip(id);
      setTrip(res.data.data);
    } catch (err) {
      console.error('Failed to load trip details:', err);
      alert('Could not find the requested trip plan.');
      navigate('/my-trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTripData();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this trip plan? This cannot be undone.')) return;
    try {
      await deleteTrip(id);
      alert('Trip plan deleted successfully.');
      navigate('/my-trips');
    } catch (err) {
      alert('Failed to delete trip plan.');
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      alert('Generating your itinerary PDF. Download will begin shortly...');
      const res = await exportTripPDF(id);
      
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

  const handleToggleSharePublic = async (nextPublicState) => {
    try {
      const res = await shareTrip(id, { isPublic: nextPublicState });
      setTrip({
        ...trip,
        isPublic: res.data.data.isPublic,
        shareId: res.data.data.shareId
      });
    } catch (err) {
      alert('Failed to update sharing permissions.');
    }
  };

  if (loading) return <div className="py-24 text-center text-textMuted">Loading itinerary details...</div>;
  if (!trip) return <div className="py-24 text-center text-textMuted">Trip plan not found.</div>;

  const currentPlacesCount = trip.days?.reduce((acc, d) => acc + (d.places ? d.places.length : 0), 0) || 0;

  return (
    <div className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen flex flex-col gap-8">
      {/* Back to dashboard */}
      <Link
        to="/my-trips"
        className="flex items-center gap-1 text-xs font-bold text-primary hover:text-amber-400 self-start transition-all"
      >
        <span>◀</span> Back to My Trips
      </Link>

      {/* Route Summary */}
      <RouteSummary
        title={trip.title}
        districts={trip.districts}
        placesCount={currentPlacesCount}
        distance={trip.totalDistance}
        duration={trip.estimatedDuration}
        travelMode={trip.travelMode}
      />

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center gap-3 bg-surface/30 border border-white/10 rounded-3xl p-4 shadow-md">
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-bg text-xs font-black hover:bg-amber-400 transition-all shadow-md active:scale-95 disabled:opacity-50"
        >
          <span>📄</span> {exporting ? 'Generating...' : 'Download Itinerary PDF'}
        </button>

        <button
          onClick={() => setShareModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-text hover:bg-white/10 transition-all shadow-md active:scale-95"
        >
          <span>🌐</span> Share Trip Plan
        </button>

        <Link
          to={`/trip-planner?edit=${trip._id}`}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-500 hover:text-amber-400 hover:bg-amber-500/20 transition-all shadow-md active:scale-95 text-center"
        >
          <span>✏️</span> Edit Itinerary
        </Link>

        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-danger/10 border border-danger/20 text-xs font-bold text-danger hover:text-red-400 hover:bg-danger/25 transition-all shadow-md active:scale-95 ml-auto"
        >
          <span>🗑️</span> Delete Plan
        </button>
      </div>

      {/* Timeline display */}
      <ItineraryTimeline
        days={trip.days}
        travelMode={trip.travelMode}
        readOnly={true}
      />

      {/* Share Modal */}
      <TripShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        tripId={trip._id}
        shareId={trip.shareId}
        isPublic={trip.isPublic}
        onTogglePublic={handleToggleSharePublic}
      />
    </div>
  );
}
