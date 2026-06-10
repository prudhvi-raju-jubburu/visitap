import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { fetchDistricts, fetchPlaces } from '../services/api';
import { useGeolocation } from '../hooks/useGeolocation';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom gold marker
const amberIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// AP bounds
const AP_BOUNDS = [[12.5, 76.7], [19.5, 84.8]];
const AP_CENTER = [15.9129, 79.7400];

function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom || 8);
  }, [center, zoom, map]);
  return null;
}

const DISTRICT_COORDS = {
  Srikakulam: [18.2949, 83.8935],
  'Parvathipuram Manyam': [18.7946, 83.4219],
  Vizianagaram: [18.1066, 83.3956],
  Visakhapatnam: [17.6868, 83.2185],
  'Alluri Sitharama Raju': [18.0673, 82.6844],
  Anakapalli: [17.6896, 83.0024],
  Kakinada: [16.9891, 82.2475],
  'East Godavari': [17.3194, 81.7800],
  'West Godavari': [16.5445, 81.5212],
  Eluru: [16.7107, 81.1035],
  'Dr. B.R. Ambedkar Konaseema': [16.5165, 81.8973],
  Krishna: [16.1675, 81.1320],
  NTR: [16.5062, 80.6480],
  Guntur: [16.3008, 80.4428],
  Palnadu: [16.3500, 79.7100],
  Bapatla: [15.9044, 80.4686],
  Prakasam: [15.5057, 80.0493],
  'SPSR Nellore': [14.4426, 79.9865],
  Kurnool: [15.8281, 78.0373],
  Nandyal: [15.4847, 78.4812],
  Anantapur: [14.6819, 77.6006],
  'Sri Sathya Sai': [14.1670, 77.8100],
  'YSR Kadapa': [14.4674, 78.8241],
  Annamayya: [14.0500, 78.7500],
  Tirupati: [13.6288, 79.4192],
  Chittoor: [13.2172, 79.1003],
};

export default function InteractiveMap() {
  const { t } = useTranslation();
  const [districts, setDistricts] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [mapCenter, setMapCenter] = useState(AP_CENTER);
  const [mapZoom, setMapZoom] = useState(7);
  const [filter, setFilter] = useState('All');
  const navigate = useNavigate();

  // Geolocation features
  const { location: userLocation, loading: locLoading, error: locError, getLocation, calculateDistance } = useGeolocation();
  const [showNearbyOnly, setShowNearbyOnly] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [dRes, pRes] = await Promise.all([fetchDistricts(), fetchPlaces()]);
        setDistricts(dRes.data.data || []);
        setPlaces(pRes.data.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
    getLocation(); // Start fetching user location
  }, [getLocation]);

  // Handle Quick Geolocation Centering
  const centerUserLocation = () => {
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng]);
      setMapZoom(12);
    } else {
      getLocation();
      alert(locError || "Detecting your location, please wait...");
    }
  };

  const handleDistrictClick = (district) => {
    const coords = DISTRICT_COORDS[district.name];
    if (coords) {
      setMapCenter(coords);
      setMapZoom(11);
    }
    setSelected(district);
  };

  const districtPlaces = selected
    ? places.filter(p => p.districtName === selected.name)
    : [];

  const categories = ['All', ...new Set(places.map(p => p.category).filter(Boolean))];
  
  // Filtering Places based on Category AND Nearby Radius toggle
  let filteredPlaces = filter === 'All' ? places : places.filter(p => p.category === filter);
  
  if (showNearbyOnly && userLocation) {
    filteredPlaces = filteredPlaces.filter(p => {
      if (!p.location?.coordinates) return false;
      const [lng, lat] = p.location.coordinates;
      const dist = calculateDistance(lat, lng);
      return dist && parseFloat(dist) <= 50; // Filter within 50km
    });
  }

  const getDirections = (lat, lng) => {
    const start = userLocation ? `${userLocation.lat},${userLocation.lng}` : '';
    window.open(`https://www.google.com/maps/dir/${start}/${lat},${lng}`, '_blank');
  };

  return (
    <div className="pt-16 min-h-screen text-white bg-bg select-none pb-16 md:pb-0">
      {/* Header */}
      <div className="bg-surface/90 backdrop-blur border-b border-white/10 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-black text-white uppercase tracking-tight">Interactive AP Map</h1>
            <p className="text-textMuted text-xs font-bold uppercase tracking-wider">{t('legendPlaces')}</p>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
                  filter === c ? 'bg-primary text-bg shadow-amber' : 'bg-surfaceLight border border-white/10 text-textMuted hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-140px)] relative">
        {/* Sidebar */}
        <div className="w-72 lg:w-80 flex-shrink-0 bg-surface border-r border-white/10 overflow-y-auto custom-scroll hidden md:block">
          <div className="p-4">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider mb-3">{t('districts')}</h3>
            <div className="space-y-1.5">
              {districts.map(d => {
                const placeCount = places.filter(p => p.districtName === d.name).length;
                return (
                  <button
                    key={d._id}
                    onClick={() => handleDistrictClick(d)}
                    className={`w-full text-left px-4 py-3 rounded-2xl transition-all text-sm font-semibold border ${
                      selected?._id === d._id
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'border-transparent hover:bg-white/5 text-textMuted hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{d.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        selected?._id === d._id ? 'bg-primary/35' : 'bg-surfaceLight'
                      }`}>{placeCount}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected district info */}
          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mx-4 mb-4 p-5 glass-card border-primary/25"
            >
              <h4 className="font-display font-black text-primary text-lg mb-2">{selected.name}</h4>
              <p className="text-textMuted text-xs leading-relaxed mb-4 font-semibold">{selected.shortDescription}</p>

              {districtPlaces.length > 0 && (
                <div className="space-y-2 mb-4 border-t border-white/5 pt-3">
                  {districtPlaces.slice(0, 5).map(p => (
                    <button
                      key={p._id}
                      onClick={() => navigate(`/place/${p.slug || p._id}`)}
                      className="w-full text-left text-sm text-textMuted hover:text-primary py-1.5 flex items-center gap-2 font-bold"
                    >
                      <span>📍</span>
                      <span className="truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => navigate(`/district/${selected.slug}`)}
                className="w-full btn-primary text-xs py-3 rounded-xl font-bold uppercase tracking-wider"
              >
                Explore District →
              </button>
            </motion.div>
          )}
        </div>

        {/* Map Panel */}
        <div className="flex-1 relative h-full">
          {/* STAGE 4: MAP ACCESSIBILITY ACTIONS CONTROLLER */}
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2.5 max-w-xs select-none">
            <button
              onClick={centerUserLocation}
              disabled={locLoading}
              className="bg-bg/95 backdrop-blur-md border border-white/10 px-4.5 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-white font-bold text-sm hover:border-primary transition-all min-h-[48px] active:scale-[0.98]"
            >
              <span>📍</span>
              <span>{t('myLocation')}</span>
            </button>

            <button
              onClick={() => setShowNearbyOnly(!showNearbyOnly)}
              className={`px-4.5 py-3 rounded-xl shadow-2xl flex items-center gap-2 font-bold text-sm transition-all border min-h-[48px] active:scale-[0.98] ${
                showNearbyOnly 
                  ? 'bg-primary text-bg border-primary' 
                  : 'bg-bg/95 border-white/10 text-white hover:border-primary'
              }`}
            >
              <span>🏖️</span>
              <span>{t('nearbyAttractions')} (50km)</span>
            </button>
          </div>

          {loading ? (
            <div className="h-full flex items-center justify-center bg-bg">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-white/5 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-textMuted text-sm font-semibold">{t('loadingMap')}</p>
              </div>
            </div>
          ) : (
            <MapContainer
              center={AP_CENTER}
              zoom={mapZoom}
              bounds={AP_BOUNDS}
              style={{ height: '100%', width: '100%', background: '#090f1e' }}
              zoomControl={true}
            >
              <MapController center={mapCenter} zoom={mapZoom} />

              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />

              {/* Pulsing GPS user location marker */}
              {userLocation && (
                <CircleMarker
                  center={[userLocation.lat, userLocation.lng]}
                  radius={12}
                  pathOptions={{
                    color: '#3b82f6',
                    fillColor: '#3b82f6',
                    fillOpacity: 0.9,
                    weight: 3
                  }}
                >
                  <Popup>
                    <div className="p-2 bg-surface text-white rounded-lg">
                      <p className="font-bold text-sm">{t('legendCurrentLoc')}</p>
                      <p className="text-xs text-textMuted">Accuracy: {userLocation.accuracy?.toFixed(1)}m</p>
                    </div>
                  </Popup>
                </CircleMarker>
              )}

              {/* District center markers */}
              {districts.map(d => {
                const coords = DISTRICT_COORDS[d.name];
                if (!coords) return null;
                const dPlaces = places.filter(p => p.districtName === d.name);
                const isSelected = selected?._id === d._id;
                
                return (
                  <CircleMarker
                    key={d._id}
                    center={coords}
                    radius={isSelected ? 20 : 14}
                    pathOptions={{
                      color: isSelected ? '#f59e0b' : '#6366f1',
                      fillColor: isSelected ? '#f59e0b' : '#6366f1',
                      fillOpacity: 0.7,
                      weight: isSelected ? 4 : 2,
                      dashArray: isSelected ? '5, 5' : null,
                    }}
                    eventHandlers={{ 
                      click: () => handleDistrictClick(d)
                    }}
                  >
                    <Popup className="custom-popup">
                      <div className="p-3.5 min-w-[240px] bg-surface text-white rounded-2xl border border-white/10 font-body">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-display font-black text-lg text-primary">{d.name}</h4>
                          <span className="bg-primary/20 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">
                            {dPlaces.length} Places
                          </span>
                        </div>
                        <p className="text-textMuted text-xs leading-normal mb-3 font-semibold italic">
                          {d.shortDescription}
                        </p>
                        
                        {dPlaces.length > 0 && (
                          <div className="space-y-1.5 mb-4 border-t border-white/5 pt-2">
                            <p className="text-[9px] uppercase tracking-widest font-black text-text/50">Top Destinations</p>
                            {dPlaces.slice(0, 3).map(p => (
                              <p key={p._id} className="text-xs text-textMuted flex items-center gap-2 font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/45"></span>
                                {p.name}
                              </p>
                            ))}
                          </div>
                        )}
                        
                        <button
                          onClick={() => navigate(`/district/${d.slug}`)}
                          className="w-full bg-primary text-bg text-xs font-black uppercase py-2.5 rounded-xl hover:bg-amber-400 transition-colors tracking-widest"
                        >
                          Explore Now
                        </button>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}

              {/* Place markers */}
              {filteredPlaces.map(p => {
                if (!p.location?.coordinates) return null;
                const [lng, lat] = p.location.coordinates;
                return (
                  <Marker
                    key={p._id}
                    position={[lat, lng]}
                    icon={amberIcon}
                  >
                    <Popup>
                      <div className="p-2 min-w-[180px] bg-surface text-white rounded-xl border border-white/10 font-body">
                        <h4 className="font-bold text-sm mb-1">{p.name}</h4>
                        <p className="text-xs text-textMuted mb-2 font-semibold">📍 {p.districtName}</p>
                        
                        <div className="flex flex-col gap-2 mt-3 border-t border-white/5 pt-2.5">
                          <button
                            onClick={() => getDirections(lat, lng)}
                            className="bg-primary text-bg font-black py-2 rounded-lg text-xs uppercase tracking-wide transition-all text-center flex items-center justify-center gap-1.5"
                          >
                            <span>🧭</span> {t('getDirections')}
                          </button>

                          <button
                            onClick={() => navigate(`/place/${p.slug || p._id}`)}
                            className="bg-white/5 hover:bg-white/10 text-white font-bold py-2 rounded-lg text-xs uppercase tracking-wide transition-all border border-white/10 text-center"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-bg/90 backdrop-blur-md rounded-xl p-3 text-xs text-textMuted border border-white/10 z-10 font-bold space-y-1.5 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-indigo-500"></div>
              <span>{t('legendDistricts')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-full bg-amber-400"></div>
              <span>{t('legendPlaces')}</span>
            </div>
            {userLocation && (
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-blue-500 animate-pulse"></div>
                <span>{t('legendCurrentLoc')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
