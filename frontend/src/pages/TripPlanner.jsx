import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  fetchDistricts,
  fetchPlaces,
  createTrip,
  updateTrip,
  fetchTrip,
  fetchNearbyPlaces,
  trackClientEvent
} from '../services/api';
import TravelModeSelector from '../components/TravelModeSelector';
import RouteSummary from '../components/RouteSummary';
import ItineraryTimeline from '../components/ItineraryTimeline';
import RecommendationCarousel from '../components/RecommendationCarousel';
import { CardSkeleton } from '../components/SkeletonLoader';

// Client-side Haversine distance calculator
function getDistance(coords1, coords2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const lon1 = coords1[0];
  const lat1 = coords1[1];
  const lon2 = coords2[0];
  const lat2 = coords2[1];

  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Client-side TSP solver / Nearest Neighbor route optimizer
function optimizePlacesList(places) {
  if (!places || places.length <= 2) return places;
  
  const startPlace = places[0];
  const remaining = places.slice(1);
  let best = [];

  const getPathDist = (path) => {
    let d = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const c1 = path[i].location?.coordinates;
      const c2 = path[i + 1].location?.coordinates;
      if (c1 && c2) d += getDistance(c1, c2);
    }
    return d;
  };

  if (remaining.length <= 6) {
    // Brute force
    let minDist = Infinity;
    const permute = (arr, memo = []) => {
      if (arr.length === 0) {
        const path = [startPlace, ...memo];
        const d = getPathDist(path);
        if (d < minDist) {
          minDist = d;
          best = path;
        }
        return;
      }
      for (let i = 0; i < arr.length; i++) {
        const curr = arr.slice();
        const next = curr.splice(i, 1);
        permute(curr, memo.concat(next));
      }
    };
    permute(remaining);
  } else {
    // Nearest Neighbor
    best = [startPlace];
    const unvisited = [...remaining];
    let current = startPlace;

    while (unvisited.length > 0) {
      let nearestIdx = -1;
      let minDist = Infinity;
      const currentCoords = current.location?.coordinates;

      if (!currentCoords) {
        best.push(unvisited.shift());
        current = best[best.length - 1];
        continue;
      }

      for (let i = 0; i < unvisited.length; i++) {
        const candCoords = unvisited[i].location?.coordinates;
        if (!candCoords) continue;
        const d = getDistance(currentCoords, candCoords);
        if (d < minDist) {
          minDist = d;
          nearestIdx = i;
        }
      }

      if (nearestIdx !== -1) {
        const nextPlace = unvisited.splice(nearestIdx, 1)[0];
        best.push(nextPlace);
        current = nextPlace;
      } else {
        best.push(unvisited.shift());
        current = best[best.length - 1];
      }
    }
  }
  return best;
}

export default function TripPlanner() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editTripId = searchParams.get('edit');

  // Input states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [travelMode, setTravelMode] = useState('ROAD');
  
  // Itinerary structure: [{ dayNumber: 1, places: [] }]
  const [days, setDays] = useState([{ dayNumber: 1, places: [] }]);
  const [selectedDistricts, setSelectedDistricts] = useState([]);

  // Selections from database
  const [districts, setDistricts] = useState([]);
  const [availablePlaces, setAvailablePlaces] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load initial districts list
  useEffect(() => {
    const loadDistricts = async () => {
      try {
        const res = await fetchDistricts();
        setDistricts(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch districts:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDistricts();
  }, []);

  // Fetch edit details if editing
  useEffect(() => {
    if (!editTripId) return;

    const loadEditTrip = async () => {
      try {
        setLoading(true);
        const res = await fetchTrip(editTripId);
        const trip = res.data.data;
        if (trip) {
          setTitle(trip.title);
          setDescription(trip.description || '');
          setTravelMode(trip.travelMode || 'ROAD');
          setSelectedDistricts(trip.districts || []);
          
          // Re-map days and place objects
          const mappedDays = trip.days.map(d => ({
            dayNumber: d.dayNumber,
            places: d.places.filter(Boolean)
          }));
          setDays(mappedDays);
        }
      } catch (err) {
        console.error('Failed to load editing trip:', err);
        alert('Could not find the requested trip plan.');
      } finally {
        setLoading(false);
      }
    };
    loadEditTrip();
  }, [editTripId]);

  // Load places for selected districts
  useEffect(() => {
    if (selectedDistricts.length === 0) {
      setAvailablePlaces([]);
      return;
    }

    const loadDistrictPlaces = async () => {
      try {
        setLoadingPlaces(true);
        // Fetch places for all selected districts
        const placesList = [];
        for (const distName of selectedDistricts) {
          const res = await fetchPlaces({ district: distName });
          placesList.push(...(res.data.data || []));
        }
        
        // Remove duplicates if any
        const unique = placesList.filter((p, index, self) =>
          self.findIndex(t => t._id === p._id) === index
        );
        setAvailablePlaces(unique);
      } catch (err) {
        console.error('Failed to fetch places:', err);
      } finally {
        setLoadingPlaces(false);
      }
    };

    loadDistrictPlaces();
  }, [selectedDistricts]);

  // Load smart recommendations whenever attractions are added or modified
  useEffect(() => {
    // Get last added place across all days
    const allAddedPlaces = days.flatMap(d => d.places).filter(Boolean);
    if (allAddedPlaces.length === 0) {
      setRecommendations([]);
      return;
    }

    const lastPlace = allAddedPlaces[allAddedPlaces.length - 1];
    const lastCoords = lastPlace.location?.coordinates;
    if (!lastCoords || lastCoords.length !== 2) return;

    const loadRecommendations = async () => {
      try {
        setLoadingRecs(true);
        const res = await fetchNearbyPlaces({
          lng: lastCoords[0],
          lat: lastCoords[1],
          radius: 50,
          excludeId: lastPlace._id
        });
        
        // Exclude places already in itinerary
        const filtered = (res.data.data || []).filter(
          rec => !allAddedPlaces.some(added => added._id === rec._id)
        );
        setRecommendations(filtered);
      } catch (err) {
        console.error('Failed to load recommendations:', err);
      } finally {
        setLoadingRecs(false);
      }
    };

    const delay = setTimeout(loadRecommendations, 500);
    return () => clearTimeout(delay);
  }, [days]);

  // Toggle district selections
  const handleToggleDistrict = (distName) => {
    if (selectedDistricts.includes(distName)) {
      setSelectedDistricts(selectedDistricts.filter(d => d !== distName));
    } else {
      setSelectedDistricts([...selectedDistricts, distName]);
    }
  };

  // Add attraction to a specific day
  const handleAddPlaceToDay = (place, dayNumber = 1) => {
    const allAdded = days.flatMap(d => d.places);
    if (allAdded.some(p => p._id === place._id)) {
      alert(`${place.name} is already in your itinerary!`);
      return;
    }

    setDays(days.map(d => {
      if (d.dayNumber === dayNumber) {
        return { ...d, places: [...d.places, place] };
      }
      return d;
    }));
  };

  // Remove attraction from a day
  const handleRemovePlaceFromDay = (dayNumber, placeId) => {
    setDays(days.map(d => {
      if (d.dayNumber === dayNumber) {
        return { ...d, places: d.places.filter(p => p._id !== placeId) };
      }
      return d;
    }));
  };

  // Reassign place to a different day
  const handleMovePlaceDay = (placeId, sourceDay, targetDay) => {
    // Find the place object first
    const source = days.find(d => d.dayNumber === sourceDay);
    const place = source?.places.find(p => p._id === placeId);
    if (!place) return;

    setDays(days.map(d => {
      if (d.dayNumber === sourceDay) {
        return { ...d, places: d.places.filter(p => p._id !== placeId) };
      }
      if (d.dayNumber === targetDay) {
        return { ...d, places: [...d.places, place] };
      }
      return d;
    }));
  };

  // Reorder attraction locally inside a day (index change)
  const handleReorderPlace = (dayNumber, index, direction) => {
    setDays(days.map(d => {
      if (d.dayNumber === dayNumber) {
        const places = [...d.places];
        const targetIndex = index + direction;
        if (targetIndex >= 0 && targetIndex < places.length) {
          // Swap positions
          const temp = places[index];
          places[index] = places[targetIndex];
          places[targetIndex] = temp;
        }
        return { ...d, places };
      }
      return d;
    }));
  };

  // Optimize a specific day's travel sequence using TSP/Nearest Neighbor solver
  const handleOptimizeDay = (dayNumber) => {
    setDays(days.map(d => {
      if (d.dayNumber === dayNumber) {
        const optimized = optimizePlacesList(d.places);
        return { ...d, places: optimized };
      }
      return d;
    }));
  };

  // Add/Remove Days
  const handleAddDay = () => {
    const nextDayNum = days.length + 1;
    setDays([...days, { dayNumber: nextDayNum, places: [] }]);
  };

  const handleRemoveDay = () => {
    if (days.length === 1) return;
    const lastDay = days[days.length - 1];
    
    // Warn if places are in the last day
    if (lastDay.places.length > 0) {
      if (!window.confirm('Deleting the last day will remove its attractions. Proceed?')) return;
    }
    setDays(days.slice(0, -1));
  };

  // Metrics calculations
  const calculateTotalDistance = () => {
    let dist = 0;
    days.forEach(d => {
      if (d.places.length > 1) {
        for (let i = 0; i < d.places.length - 1; i++) {
          const c1 = d.places[i].location?.coordinates;
          const c2 = d.places[i + 1].location?.coordinates;
          if (c1 && c2) dist += getDistance(c1, c2);
        }
      }
    });
    return dist;
  };

  const calculateTotalDuration = (totalDist) => {
    let speed = 50; // road
    if (travelMode === 'CYCLING') speed = 15;
    if (travelMode === 'WALKING') speed = 5;

    const transitionMins = (totalDist / speed) * 60;
    const placeCount = days.reduce((acc, d) => acc + d.places.length, 0);
    // 60 minutes stay per place
    return Math.round(transitionMins) + (placeCount * 60);
  };

  const currentDistance = calculateTotalDistance();
  const currentDuration = calculateTotalDuration(currentDistance);
  const currentPlacesCount = days.reduce((acc, d) => acc + d.places.length, 0);

  // Submit Itinerary to DB
  const handleSaveTrip = async () => {
    if (!title.trim()) {
      alert('Please enter a trip name before saving.');
      return;
    }

    if (currentPlacesCount === 0) {
      alert('Please add at least one attraction to your itinerary.');
      return;
    }

    setSaving(true);
    try {
      // Format payload (extract _ids)
      const daysPayload = days.map(d => ({
        dayNumber: d.dayNumber,
        places: d.places.map(p => p._id)
      }));

      const payload = {
        title,
        description,
        districts: selectedDistricts,
        days: daysPayload,
        travelMode
      };

      if (editTripId) {
        await updateTrip(editTripId, payload);
        alert('Trip itinerary updated successfully!');
      } else {
        const res = await createTrip(payload);
        const newTrip = res.data.data;
        if (newTrip && newTrip._id) {
          trackClientEvent('CREATE_TRIP', {
            metadata: { tripId: newTrip._id, travelMode }
          });
        }
        alert('Trip itinerary saved successfully!');
      }
      navigate('/my-trips');
    } catch (err) {
      alert('Failed to save itinerary. Please check your inputs.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-24 text-center text-textMuted">Loading Trip Planner...</div>;

  return (
    <div className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen flex flex-col gap-10">
      
      {/* Route Summary */}
      <RouteSummary
        title={title || 'My Unsaved Route'}
        districts={selectedDistricts}
        placesCount={currentPlacesCount}
        distance={currentDistance}
        duration={currentDuration}
        travelMode={travelMode}
      />

      {/* Grid workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Sidebar (Attraction lists and selectors) */}
        <div className="lg:col-span-4 flex flex-col gap-6 h-full lg:sticky lg:top-24">
          
          {/* Districts Selector */}
          <div className="bg-surface/30 border border-white/10 rounded-[2rem] p-6 shadow-lg">
            <h4 className="font-display text-sm font-black text-white uppercase tracking-wider mb-4">
              Select Districts
            </h4>
            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-2 custom-scroll">
              {districts.map((d) => {
                const isSelected = selectedDistricts.includes(d.name);
                return (
                  <button
                    key={d._id}
                    onClick={() => handleToggleDistrict(d.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'bg-white/5 text-textMuted border border-white/5 hover:text-text hover:bg-white/10'
                    }`}
                  >
                    {d.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Attraction Listing */}
          <div className="bg-surface/30 border border-white/10 rounded-[2.5rem] p-6 shadow-lg flex-1 flex flex-col max-h-[500px] overflow-hidden">
            <div className="mb-4">
              <h4 className="font-display text-sm font-black text-white uppercase tracking-wider">
                Available Attractions
              </h4>
              <p className="text-[10px] text-textMuted mt-0.5">Click to append to your active Day itinerary</p>
            </div>

            {loadingPlaces ? (
              <div className="flex-1 flex items-center justify-center py-10 text-textMuted text-xs">
                Loading places...
              </div>
            ) : selectedDistricts.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-textMuted text-xs gap-2">
                <span className="text-2xl">🗺️</span>
                Select districts above to load local sightseeing spots
              </div>
            ) : availablePlaces.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-textMuted text-xs">
                No places found in this region.
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 custom-scroll">
                {availablePlaces.map((place) => (
                  <div
                    key={place._id}
                    className="flex justify-between items-center p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all group"
                  >
                    <div className="flex gap-3 items-center overflow-hidden">
                      <img
                        src={place.coverImage}
                        alt={place.name}
                        className="w-10 h-10 rounded-xl object-cover border border-white/10"
                      />
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-text truncate">{place.name}</p>
                        <p className="text-[10px] text-textMuted truncate">{place.districtName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAddPlaceToDay(place, 1)}
                        className="w-8 h-8 rounded-lg bg-primary text-bg font-black text-xs hover:bg-amber-400 active:scale-95 transition-all shadow-md flex items-center justify-center"
                        title="Add to Day 1"
                      >
                        +
                      </button>
                      {days.length > 1 && (
                        <select
                          onChange={(e) => {
                            handleAddPlaceToDay(place, parseInt(e.target.value));
                            e.target.value = '';
                          }}
                          className="bg-surface border border-white/10 text-[10px] font-bold text-text rounded-lg px-1 py-2 focus:outline-none focus:border-primary"
                          defaultValue=""
                        >
                          <option value="" disabled>Day...</option>
                          {days.map(d => (
                            <option key={d.dayNumber} value={d.dayNumber}>Day {d.dayNumber}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Columns (Itinerary form and days timeline) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Trip settings form */}
          <div className="bg-surface/30 border border-white/10 rounded-[2.5rem] p-6 md:p-8 shadow-lg flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-textMuted uppercase tracking-wider">
                  Trip Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vizag Weekend Tour"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-surfaceLight/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary transition-all shadow-inner"
                />
              </div>

              <TravelModeSelector travelMode={travelMode} onChange={setTravelMode} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-textMuted uppercase tracking-wider">
                Trip Description (Optional)
              </label>
              <textarea
                placeholder="Describe your trip details, highlights, or group members..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full bg-surfaceLight/30 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text focus:outline-none focus:border-primary transition-all shadow-inner resize-none"
              />
            </div>

            <div className="flex justify-between items-center border-t border-white/5 pt-4">
              <div className="flex gap-2">
                <button
                  onClick={handleAddDay}
                  className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-textMuted hover:text-text hover:bg-white/10 transition-all active:scale-95 shadow-md"
                >
                  ➕ Add Day
                </button>
                {days.length > 1 && (
                  <button
                    onClick={handleRemoveDay}
                    className="px-4 py-2 bg-danger/10 border border-danger/20 rounded-xl text-xs font-bold text-danger hover:text-red-400 hover:bg-danger/20 transition-all active:scale-95 shadow-md"
                  >
                    ➖ Delete Last Day
                  </button>
                )}
              </div>

              <button
                disabled={saving}
                onClick={handleSaveTrip}
                className="px-6 py-2.5 rounded-xl bg-primary text-bg font-black text-xs hover:bg-amber-400 transition-all active:scale-95 shadow-lg shadow-primary/10 hover:shadow-primary/25 disabled:opacity-50"
              >
                {saving ? 'Saving...' : '💾 Save Itinerary'}
              </button>
            </div>
          </div>

          {/* Days Timeline display */}
          <ItineraryTimeline
            days={days}
            travelMode={travelMode}
            onReorderPlace={handleReorderPlace}
            onRemovePlace={handleRemovePlaceFromDay}
            onMovePlaceDay={handleMovePlaceDay}
            onOptimizeDay={handleOptimizeDay}
            readOnly={false}
          />

          {/* Personalized Recommendations carousel */}
          <RecommendationCarousel
            recommendations={recommendations}
            onAddPlace={(place) => handleAddPlaceToDay(place, 1)}
            loading={loadingRecs}
          />
        </div>

      </div>

    </div>
  );
}
