import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { fetchDistricts, fetchPlaces } from '../services/api';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom amber marker
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
    if (center) map.setView(center, zoom || 10);
  }, [center, zoom]);
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
  const [districts, setDistricts] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [mapCenter, setMapCenter] = useState(AP_CENTER);
  const [mapZoom, setMapZoom] = useState(null);
  const [filter, setFilter] = useState('All');
  const navigate = useNavigate();

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
  }, []);

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
  const filteredPlaces = filter === 'All' ? places : places.filter(p => p.category === filter);

  return (
    <div className="pt-16 min-h-screen">
      {/* Header */}
      <div className="bg-surface/80 backdrop-blur border-b border-white/10 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-text">Interactive AP Map</h1>
            <p className="text-textMuted text-sm">Click on markers to explore places</p>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === c ? 'bg-primary text-bg' : 'bg-surface text-textMuted hover:text-text border border-white/10'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Sidebar */}
        <div className="w-72 lg:w-80 flex-shrink-0 bg-surface border-r border-white/10 overflow-y-auto custom-scroll hidden md:block">
          <div className="p-4">
            <h3 className="font-semibold text-text text-sm uppercase tracking-wider mb-3">Districts</h3>
            <div className="space-y-1">
              {districts.map(d => {
                const placeCount = places.filter(p => p.districtName === d.name).length;
                return (
                  <button
                    key={d._id}
                    onClick={() => handleDistrictClick(d)}
                    className={`w-full text-left px-3 py-3 rounded-xl transition-all text-sm ${
                      selected?._id === d._id
                        ? 'bg-primary/15 border border-primary/30 text-primary'
                        : 'hover:bg-white/5 text-textMuted hover:text-text'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{d.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        selected?._id === d._id ? 'bg-primary/20' : 'bg-surfaceLight'
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
              className="mx-4 mb-4 p-4 glass-card border-primary/20"
            >
              <h4 className="font-display font-bold text-primary mb-2">{selected.name}</h4>
              <p className="text-textMuted text-xs leading-relaxed mb-3">{selected.shortDescription}</p>

              {districtPlaces.length > 0 && (
                <div className="space-y-1 mb-3">
                  {districtPlaces.slice(0, 5).map(p => (
                    <button
                      key={p._id}
                      onClick={() => navigate(`/place/${p._id}`)}
                      className="w-full text-left text-xs text-textMuted hover:text-primary py-1 flex items-center gap-1"
                    >
                      📍 {p.name}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => navigate(`/district/${selected.slug}`)}
                className="w-full btn-primary text-xs py-2"
              >
                Explore District →
              </button>
            </motion.div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          {loading ? (
            <div className="h-full flex items-center justify-center bg-bg">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-surface border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-textMuted text-sm">Loading map data...</p>
              </div>
            </div>
          ) : (
            <MapContainer
              center={AP_CENTER}
              zoom={7}
              bounds={AP_BOUNDS}
              style={{ height: '100%', width: '100%', background: '#0f172a' }}
              zoomControl={true}
            >
              <MapController center={mapCenter} zoom={mapZoom} />

              {/* Dark tile layer */}
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              />

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
                      click: () => handleDistrictClick(d),
                      mouseover: (e) => {
                        e.target.setStyle({ fillOpacity: 1, radius: 22, weight: 4 });
                      },
                      mouseout: (e) => {
                        e.target.setStyle({ 
                          fillOpacity: 0.7, 
                          radius: isSelected ? 20 : 14,
                          weight: isSelected ? 4 : 2 
                        });
                      }
                    }}
                  >
                    <Popup className="custom-popup">
                      <div className="p-3 min-w-[220px] bg-surface text-text rounded-xl overflow-hidden border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-display font-black text-lg text-primary">{d.name}</h4>
                          <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {dPlaces.length} Places
                          </span>
                        </div>
                        <p className="text-textMuted text-[11px] leading-tight mb-3 italic">
                          {d.shortDescription}
                        </p>
                        
                        {dPlaces.length > 0 && (
                          <div className="space-y-1.5 mb-4 border-t border-white/5 pt-2">
                            <p className="text-[10px] uppercase tracking-widest font-bold text-text/50">Top Destinations</p>
                            {dPlaces.slice(0, 3).map(p => (
                              <p key={p._id} className="text-xs text-textMuted flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-primary/40"></span>
                                {p.name}
                              </p>
                            ))}
                          </div>
                        )}
                        
                        <button
                          onClick={() => navigate(`/district/${d.slug}`)}
                          className="w-full bg-primary text-bg text-xs font-black uppercase py-2 rounded-lg hover:bg-amber-400 transition-colors tracking-widest"
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
                      <div className="p-1 min-w-[160px]">
                        <h4 className="font-bold text-sm mb-1">{p.name}</h4>
                        <p className="text-xs text-gray-500 mb-1">{p.districtName}</p>
                        {p.category && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            {p.category}
                          </span>
                        )}
                        <button
                          onClick={() => navigate(`/place/${p._id}`)}
                          className="text-xs bg-amber-500 text-white px-3 py-1 rounded-full w-full mt-2 hover:bg-amber-600"
                        >
                          View Details
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-bg/80 backdrop-blur rounded-xl p-3 text-xs text-textMuted border border-white/10 z-10">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full bg-accent"></div>
              <span>Districts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span>Tourist Places</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
