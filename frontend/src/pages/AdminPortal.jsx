import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchDistricts, fetchPlaces, createDistrict, updateDistrict, deleteDistrict,
  createPlace, updatePlace, deletePlace, fetchFeedbacks, fetchAdminAnalysis,
  getDashboardAnalytics, getGrowthAnalytics, getPopularAnalytics,
  getDistrictAnalytics, getSearchAnalytics, getCategoryAnalytics, getTripAnalytics
} from '../services/api';
import { useAuth } from '../App';
import { uploadImage } from '../services/api';

import AnalyticsStatCard from '../components/AnalyticsStatCard';
import RegistrationsLineChart from '../components/RegistrationsLineChart';
import PopularPlacesBarChart from '../components/PopularPlacesBarChart';
import CategoryPieChart from '../components/CategoryPieChart';
import DistrictPopularityChart from '../components/DistrictPopularityChart';
import SearchAnalyticsTable from '../components/SearchAnalyticsTable';
import RecentActivityFeed from '../components/RecentActivityFeed';

const CATEGORIES = [
  'Temple / Religious', 'Beach', 'Hill Station', 'Historical', 'Nature', 'Waterfalls', 
  'Wildlife', 'Adventure', 'City', 'Culture', 'Heritage', 'Backwaters', 'Tribal', 'Pilgrimage', 'Other'
];

function ImageUploadField({ label, value, onChange, placeholder }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await uploadImage(formData);
      onChange({ target: { value: res.data.url } });
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="text-textMuted text-xs font-bold uppercase tracking-wider block">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="flex-1 bg-surfaceLight/50 border border-white/10 rounded-xl px-4 py-2.5 text-text placeholder-textMuted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all text-sm"
        />
        <label className={`cursor-pointer px-4 py-2.5 rounded-xl border border-dashed border-white/20 text-xs flex items-center justify-center transition-all bg-white/[0.02] hover:bg-white/[0.04] ${uploading ? 'opacity-50' : 'hover:border-primary/50 text-textMuted hover:text-primary'}`}>
          {uploading ? '...' : 'Upload'}
          <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
      {value && (
        <div className="mt-2 relative rounded-xl overflow-hidden aspect-[16/9] w-40 border border-white/10">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] text-white/80 font-black uppercase">Preview</div>
        </div>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ duration: 0.25 }}
          className="bg-surface border border-white/10 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scroll shadow-glow"
        >
          <div className="flex items-center justify-between p-5 md:px-7 border-b border-white/10 sticky top-0 bg-surface/95 backdrop-blur-md z-10">
            <h3 className="font-display text-lg font-bold text-text uppercase tracking-wide">{title}</h3>
            <button onClick={onClose} className="p-1 rounded-lg bg-white/5 border border-white/10 text-textMuted hover:text-text transition-colors">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6 md:p-7">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function FormField({ label, type = 'text', value, onChange, placeholder, required, options }) {
  return (
    <div className="space-y-1.5">
      <label className="text-textMuted text-xs font-bold uppercase tracking-wider block">{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          rows={3}
          className="w-full bg-surfaceLight/50 border border-white/10 rounded-xl px-4 py-2.5 text-text placeholder-textMuted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all resize-none text-sm font-body"
        />
      ) : type === 'select' ? (
        <select
          value={value}
          onChange={onChange}
          required={required}
          className="w-full bg-surfaceLight/50 border border-white/10 rounded-xl px-4 py-2.5 text-text focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all text-sm font-body"
        >
          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full bg-surfaceLight/50 border border-white/10 rounded-xl px-4 py-2.5 text-text placeholder-textMuted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all text-sm"
        />
      )}
    </div>
  );
}

export default function AdminPortal() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('analysis');
  const [districts, setDistricts] = useState([]);
  const [places, setPlaces] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Filters & Pagination to prevent clutter
  const [districtSearch, setDistrictSearch] = useState('');
  const [districtPage, setDistrictPage] = useState(1);

  const [placeSearch, setPlaceSearch] = useState('');
  const [placeCategoryFilter, setPlaceCategoryFilter] = useState('');
  const [placePage, setPlacePage] = useState(1);

  const [isListeningDistrict, setIsListeningDistrict] = useState(false);
  const [isListeningPlace, setIsListeningPlace] = useState(false);

  const [analyticsData, setAnalyticsData] = useState({
    dashboard: null,
    growth: null,
    popular: null,
    districts: null,
    searches: null,
    categories: null,
    trips: null
  });
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const loadAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const [dashRes, growthRes, popRes, distRes, searchRes, catRes, tripRes] = await Promise.all([
        getDashboardAnalytics(),
        getGrowthAnalytics(),
        getPopularAnalytics(),
        getDistrictAnalytics(),
        getSearchAnalytics(),
        getCategoryAnalytics(),
        getTripAnalytics()
      ]);
      setAnalyticsData({
        dashboard: dashRes.data.data,
        growth: growthRes.data.data,
        popular: popRes.data.data,
        districts: distRes.data.data,
        searches: searchRes.data.data,
        categories: catRes.data.data,
        trips: tripRes.data.data
      });
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (tab === 'analytics') {
      loadAnalytics();
    }
  }, [tab]);

  const ITEMS_PER_PAGE = 9;

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dRes, pRes, fRes, aRes] = await Promise.all([
        fetchDistricts(),
        fetchPlaces(),
        fetchFeedbacks(),
        fetchAdminAnalysis()
      ]);
      setDistricts(dRes.data.data || []);
      setPlaces(pRes.data.data || []);
      setFeedbacks(fRes.data.data || []);
      setAnalysisData(aRes.data.data || null);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const openModal = (type, mode, data = {}) => {
    setModal({ type, mode });
    if (type === 'district') {
      setFormData({
        name: '', image: '', description: '', shortDescription: '',
        ...data,
        highlights: data.highlights?.join(', ') || '',
        images: data.images?.join(', ') || '',
        lat: data.coordinates?.lat || '',
        lng: data.coordinates?.lng || '',
      });
    } else {
      const defaultRating = data.rating
        ? (typeof data.rating === 'object' ? (data.rating.average || 0) : data.rating)
        : 4.5;
      const defaultRatingCount = (data.rating && typeof data.rating === 'object')
        ? (data.rating.count || 0)
        : 1;
      setFormData({
        name: '', districtId: '', districtName: '', description: '', shortDescription: '',
        coverImage: '', category: 'Other', ratingCount: defaultRatingCount,
        bestTimeToVisit: '', entryFee: '', timings: '', isFeatured: false,
        ...data,
        rating: defaultRating,
        images: data.images?.join(', ') || '',
        lng: data.location?.coordinates?.[0] || '',
        lat: data.location?.coordinates?.[1] || '',
      });
    }
  };

  const handleSaveDistrict = async () => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        highlights: formData.highlights ? formData.highlights.split(',').map(h => h.trim()).filter(Boolean) : [],
        images: formData.images ? formData.images.split(',').map(i => i.trim()).filter(Boolean) : [],
        coordinates: {
          lat: parseFloat(formData.lat) || 0,
          lng: parseFloat(formData.lng) || 0
        }
      };
      delete payload.lat;
      delete payload.lng;

      if (modal.mode === 'add') await createDistrict(payload);
      else await updateDistrict(formData._id, payload);
      showMessage(`District ${modal.mode === 'add' ? 'added' : 'updated'} successfully!`);
      setModal(null);
      await loadData();
    } catch (err) {
      showMessage(err.response?.data?.message || 'Error saving district', 'error');
    } finally { setSaving(false); }
  };

  const handleSavePlace = async () => {
    setSaving(true);
    try {
      const district = districts.find(d => d._id === formData.districtId);
      const payload = {
        ...formData,
        districtName: district?.name || formData.districtName,
        rating: {
          average: Number(formData.rating) || 0,
          count: Number(formData.ratingCount) || 1,
        },
        location: {
          type: 'Point',
          coordinates: [parseFloat(formData.lng) || 0, parseFloat(formData.lat) || 0],
        },
        images: formData.images ? formData.images.split(',').map(i => i.trim()).filter(Boolean) : [],
      };
      
      delete payload.lat;
      delete payload.lng;
      delete payload.ratingCount;

      if (modal.mode === 'add') await createPlace(payload);
      else await updatePlace(formData._id, payload);
      showMessage(`Place ${modal.mode === 'add' ? 'added' : 'updated'} successfully!`);
      setModal(null);
      await loadData();
    } catch (err) {
      showMessage(err.response?.data?.message || 'Error saving place', 'error');
    } finally { setSaving(false); }
  };

  const handleDeleteDistrict = async (id) => {
    if (!confirm('Delete this district and all its places?')) return;
    try {
      await deleteDistrict(id);
      showMessage('District deleted.');
      await loadData();
    } catch { showMessage('Delete failed', 'error'); }
  };

  const handleDeletePlace = async (id) => {
    if (!confirm('Delete this place?')) return;
    try {
      await deletePlace(id);
      showMessage('Place deleted.');
      await loadData();
    } catch { showMessage('Delete failed', 'error'); }
  };

  const handleVoiceSearchDistrict = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in your browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListeningDistrict(true);
      setDistrictSearch('');
    };

    recognition.onresult = (e) => {
      let text = e.results[0][0].transcript.replace(/[.,!?]$/, '').trim();
      setDistrictSearch(text);
    };

    recognition.onend = () => {
      setIsListeningDistrict(false);
    };

    recognition.start();
  };

  const handleVoiceSearchPlace = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search is not supported in your browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListeningPlace(true);
      setPlaceSearch('');
    };

    recognition.onresult = (e) => {
      let text = e.results[0][0].transcript.replace(/[.,!?]$/, '').trim();
      setPlaceSearch(text);
    };

    recognition.onend = () => {
      setIsListeningPlace(false);
    };

    recognition.start();
  };

  const f = (key) => ({
    value: formData[key] ?? '',
    onChange: e => setFormData(d => ({ ...d, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })),
  });

  // Filters & Pagination
  const filteredDistricts = districts.filter(d => 
    d.name.toLowerCase().includes(districtSearch.toLowerCase()) ||
    d.shortDescription?.toLowerCase().includes(districtSearch.toLowerCase())
  );
  const totalDistrictPages = Math.ceil(filteredDistricts.length / ITEMS_PER_PAGE) || 1;
  const paginatedDistricts = filteredDistricts.slice((districtPage - 1) * ITEMS_PER_PAGE, districtPage * ITEMS_PER_PAGE);

  const filteredPlaces = places.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(placeSearch.toLowerCase()) ||
                          p.districtName.toLowerCase().includes(placeSearch.toLowerCase());
    const matchesCategory = !placeCategoryFilter || p.category === placeCategoryFilter;
    return matchesSearch && matchesCategory;
  });
  const totalPlacePages = Math.ceil(filteredPlaces.length / ITEMS_PER_PAGE) || 1;
  const paginatedPlaces = filteredPlaces.slice((placePage - 1) * ITEMS_PER_PAGE, placePage * ITEMS_PER_PAGE);

  useEffect(() => { setDistrictPage(1); }, [districtSearch]);
  useEffect(() => { setPlacePage(1); }, [placeSearch, placeCategoryFilter]);

  return (
    <div className="min-h-screen bg-bg text-text antialiased">
      {/* Top Bar */}
      <div className="bg-surface/85 backdrop-blur-xl border-b border-white/10 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-br from-primary to-amber-300 flex items-center justify-center shadow-amber">
            <span className="text-bg font-black text-sm">V</span>
          </div>
          <div>
            <p className="font-display font-black text-sm leading-none uppercase tracking-wider text-white">Visit AP Portal</p>
            <p className="text-textMuted text-[10px] mt-1">Welcome, <span className="text-primary font-semibold">{admin?.username}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" target="_blank" className="text-textMuted text-xs hover:text-primary transition-colors flex items-center gap-1 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl font-semibold">
            View Site ↗
          </a>
          <button 
            onClick={() => { logout(); navigate('/admin/login'); }} 
            className="text-danger text-xs font-bold bg-danger/10 border border-danger/20 hover:bg-danger hover:text-white transition-all px-3 py-1.5 rounded-xl"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Toast Alert message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            className={`fixed top-20 right-6 z-50 px-4 py-2.5 rounded-2xl shadow-glow text-xs font-bold flex items-center gap-2 border ${
              message.type === 'error' 
                ? 'bg-red-500/90 text-white border-red-500/40' 
                : 'bg-emerald-500/90 text-white border-emerald-500/40'
            }`}
          >
            <span>{message.type === 'error' ? '🚨' : '✨'}</span>
            <span>{message.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Tab Selection */}
        <div className="flex gap-2 mb-8 bg-surface/40 backdrop-blur-md p-1 rounded-2xl border border-white/10 w-max shadow-md overflow-x-auto">
          {[
            { id: 'analysis', label: 'Dashboard', icon: '📊' },
            { id: 'analytics', label: 'Analytics & BI', icon: '📈' },
            { id: 'districts', label: 'Districts', icon: '🗺️' },
            { id: 'places', label: 'Places', icon: '📍' },
            { id: 'feedback', label: 'Feedbacks', icon: '💬' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 uppercase tracking-wide ${
                tab === t.id 
                  ? 'bg-primary text-bg shadow-lg' 
                  : 'text-textMuted hover:text-text hover:bg-white/5'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Tab: Dashboard Analysis */}
        {tab === 'analysis' && (
          <div className="space-y-8">
            <div>
              <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider">Dashboard Analysis</h2>
              <p className="text-textMuted text-xs mt-0.5">Platform performance stats and database indicators</p>
            </div>

            {loading ? (
              <div className="py-20 text-center text-textMuted">
                <div className="w-8 h-8 border-3 border-white/5 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-xs">Loading analytics data...</p>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {[
                    { label: 'Total Users', value: analysisData?.users?.total || 0, icon: '👥', sub: analysisData?.users?.newThisWeek > 0 ? `+${analysisData.users.newThisWeek} this week` : 'Active accounts', color: 'from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-blue-400' },
                    { label: 'Destinations', value: analysisData?.places?.total || 0, icon: '📍', sub: `${analysisData?.places?.featured || 0} Featured spots`, color: 'from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-400' },
                    { label: 'Visitor Reviews', value: analysisData?.reviews?.total || 0, icon: '💬', sub: analysisData?.reviews?.newThisWeek > 0 ? `+${analysisData.reviews.newThisWeek} new reviews` : 'Logs active', color: 'from-purple-500/10 to-pink-500/10 border-purple-500/20 text-purple-400' },
                    { label: 'Platform Rating', value: analysisData?.systemAverageRating || '0.0', icon: '★', sub: 'System average', color: 'from-yellow-500/10 to-amber-500/10 border-yellow-500/20 text-yellow-400' },
                  ].map(stat => (
                    <div key={stat.label} className={`bg-gradient-to-br ${stat.color} border p-5 rounded-2xl flex items-center justify-between group shadow-md`}>
                      <div className="space-y-0.5">
                        <p className="text-textMuted text-[9px] font-bold uppercase tracking-widest">{stat.label}</p>
                        <p className="font-display text-2.5xl font-black text-white leading-tight">{stat.value}</p>
                        <p className="text-[10px] text-white/50">{stat.sub}</p>
                      </div>
                      <div className="bg-black/20 w-12 h-12 rounded-xl flex items-center justify-center text-2xl">{stat.icon}</div>
                    </div>
                  ))}
                </div>

                {/* Detailed lists */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                  {/* Left block: Recent Signups */}
                  <div className="bg-surface/30 border border-white/5 p-5 rounded-2xl space-y-3 shadow-md">
                    <h3 className="font-display text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-white/5">
                      👥 Recent Registrations
                    </h3>
                    <div className="space-y-2">
                      {!analysisData?.users?.recent || analysisData.users.recent.length === 0 ? (
                        <p className="text-textMuted text-xs py-3 italic text-center">No signups logged.</p>
                      ) : (
                        analysisData.users.recent.map((usr) => (
                          <div key={usr._id} className="bg-white/[0.02] border border-white/5 px-4 py-2.5 rounded-xl flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <p className="font-bold text-white text-xs truncate">{usr.name}</p>
                              <p className="text-textMuted text-[10px] truncate">{usr.email}</p>
                            </div>
                            <span className="text-[9px] text-textMuted/70 font-semibold bg-white/5 px-2 py-0.5 rounded-lg flex-shrink-0">
                              {new Date(usr.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Right block: Recent Reviews */}
                  <div className="bg-surface/30 border border-white/5 p-5 rounded-2xl space-y-3 shadow-md">
                    <h3 className="font-display text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-white/5">
                      📝 Recent Reviews Log
                    </h3>
                    <div className="space-y-2">
                      {!analysisData?.reviews?.recent || analysisData.reviews.recent.length === 0 ? (
                        <p className="text-textMuted text-xs py-3 italic text-center">No reviews submitted.</p>
                      ) : (
                        analysisData.reviews.recent.map((rev) => (
                          <div key={rev._id} className="bg-white/[0.02] border border-white/5 px-4 py-2.5 rounded-xl space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <span className="font-bold text-white text-xs leading-none">{rev.user?.name || 'Visitor'}</span>
                                <span className="text-[9px] text-primary font-bold ml-2">→ {rev.place?.name || 'N/A'}</span>
                              </div>
                              <div className="flex text-amber-400 text-[9px] flex-shrink-0">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <span key={i} className={i < rev.rating ? 'opacity-100' : 'opacity-20'}>★</span>
                                ))}
                              </div>
                            </div>
                            <p className="text-textMuted text-[10px] line-clamp-1 italic">"{rev.comment}"</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Districts Tab Content */}
        {tab === 'districts' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider">Districts Portal</h2>
                <p className="text-textMuted text-xs mt-0.5">Manage administrative regions ({filteredDistricts.length})</p>
              </div>
              
              {/* Search Box with Microphone Mic Icon (Sleek) */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <div className="relative w-full sm:w-56">
                  <input
                    type="text"
                    placeholder={isListeningDistrict ? "Listening..." : "Search districts..."}
                    value={districtSearch}
                    onChange={(e) => setDistrictSearch(e.target.value)}
                    className="bg-surface/50 border border-white/10 rounded-xl pl-4 pr-9 py-2 text-xs text-white focus:outline-none focus:border-primary w-full"
                  />
                  <button
                    type="button"
                    onClick={handleVoiceSearchDistrict}
                    className={`absolute right-2.5 top-1.5 transition-colors ${
                      isListeningDistrict ? 'text-primary animate-pulse' : 'text-textMuted hover:text-primary'
                    }`}
                    title="Voice Search"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                </div>

                <button 
                  onClick={() => openModal('district', 'add')} 
                  className="bg-primary hover:bg-amber-400 text-bg font-black px-5 py-3 rounded-2xl transition-all shadow active:scale-95 text-sm uppercase tracking-wide flex-shrink-0 flex items-center gap-2 min-h-[48px]"
                >
                  <span>➕</span> Add District
                </button>
              </div>
            </div>
            
            {paginatedDistricts.length === 0 ? (
              <div className="bg-surface/30 border border-white/5 rounded-2xl p-12 text-center text-textMuted flex flex-col items-center">
                <div className="text-2xl mb-2">🔍</div>
                <p className="text-xs font-semibold">No districts found matching "{districtSearch}"</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {paginatedDistricts.map(d => {
                  const count = places.filter(p => p.districtId === d._id).length;
                  return (
                    <div key={d._id} className="bg-surface/30 border border-white/5 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/10 transition-all duration-300 group">
                      <div className="flex items-center gap-4 min-w-0">
                        <img
                          src={d.image}
                          alt={d.name}
                          className="w-12 h-12 rounded-xl object-cover border border-white/10 flex-shrink-0"
                          onError={e => e.target.src = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100'}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-base truncate group-hover:text-primary transition-colors">{d.name}</h3>
                            <span className="bg-white/5 border border-white/10 text-[9px] font-bold px-2 py-0.5 rounded-lg text-textMuted flex-shrink-0">
                              {count} {count === 1 ? 'place' : 'places'}
                            </span>
                          </div>
                          <p className="text-textMuted text-xs mt-1 truncate max-w-xl font-body leading-relaxed">{d.shortDescription || d.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                        <button 
                          onClick={() => openModal('district', 'edit', d)} 
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center gap-1"
                        >
                          <span>✏️</span> Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteDistrict(d._id)} 
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-danger/10 border border-danger/20 text-danger hover:bg-danger hover:text-white transition-all flex items-center gap-1"
                        >
                          <span>🗑️</span> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Pagination Controls */}
                {totalDistrictPages > 1 && (
                  <div className="flex justify-center items-center gap-3 mt-6 pt-4 border-t border-white/5">
                    <button
                      onClick={() => setDistrictPage(p => Math.max(p - 1, 1))}
                      disabled={districtPage === 1}
                      className="px-3 py-1.5 bg-surface/50 border border-white/10 hover:bg-white/5 text-[10px] font-bold rounded-lg disabled:opacity-35 transition-all text-white"
                    >
                      ← Previous
                    </button>
                    <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider">
                      Page {districtPage} of {totalDistrictPages}
                    </span>
                    <button
                      onClick={() => setDistrictPage(p => Math.min(p + 1, totalDistrictPages))}
                      disabled={districtPage === totalDistrictPages}
                      className="px-3 py-1.5 bg-surface/50 border border-white/10 hover:bg-white/5 text-[10px] font-bold rounded-lg disabled:opacity-35 transition-all text-white"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Places Tab Content */}
        {tab === 'places' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider">Places Portal</h2>
                <p className="text-textMuted text-xs mt-0.5">Manage tourist attractions ({filteredPlaces.length})</p>
              </div>
              
              {/* Sleek Search with Microphone Mic Icon & Filters */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative w-full sm:w-44">
                  <input
                    type="text"
                    placeholder={isListeningPlace ? "Listening..." : "Search places..."}
                    value={placeSearch}
                    onChange={(e) => setPlaceSearch(e.target.value)}
                    className="bg-surface/50 border border-white/10 rounded-xl pl-4 pr-9 py-2 text-xs text-white focus:outline-none focus:border-primary w-full"
                  />
                  <button
                    type="button"
                    onClick={handleVoiceSearchPlace}
                    className={`absolute right-2.5 top-1.5 transition-colors ${
                      isListeningPlace ? 'text-primary animate-pulse' : 'text-textMuted hover:text-primary'
                    }`}
                    title="Voice Search"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </button>
                </div>
                
                <select
                  value={placeCategoryFilter}
                  onChange={(e) => setPlaceCategoryFilter(e.target.value)}
                  className="bg-surface/50 border border-white/10 rounded-xl px-2 py-2 text-xs text-textMuted focus:outline-none focus:border-primary focus:text-white"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <button 
                  onClick={() => openModal('place', 'add')} 
                  className="bg-primary hover:bg-amber-400 text-bg font-black px-5 py-3 rounded-2xl transition-all shadow active:scale-95 text-sm uppercase tracking-wide flex-shrink-0 flex items-center gap-2 min-h-[48px]"
                >
                  <span>➕</span> Add Place
                </button>
              </div>
            </div>
            
            {paginatedPlaces.length === 0 ? (
              <div className="bg-surface/30 border border-white/5 rounded-2xl p-12 text-center text-textMuted flex flex-col items-center">
                <div className="text-2xl mb-2">🔍</div>
                <p className="text-xs font-semibold">No places found matching criteria</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {paginatedPlaces.map(p => {
                  const ratingAverage = p.rating ? (typeof p.rating === 'object' ? (p.rating.average || 0) : p.rating) : 0;
                  return (
                    <div key={p._id} className="bg-surface/30 border border-white/5 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/10 transition-all duration-300 group">
                      <div className="flex items-center gap-4 min-w-0">
                        <img
                          src={p.coverImage}
                          alt={p.name}
                          className="w-12 h-12 rounded-xl object-cover border border-white/10 flex-shrink-0"
                          onError={e => e.target.src = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100'}
                        />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-white text-base truncate group-hover:text-primary transition-colors">{p.name}</h3>
                            <span className="bg-primary/10 border border-primary/20 text-[9px] font-bold px-2 py-0.5 rounded-lg text-primary uppercase">
                              {p.category}
                            </span>
                            <span className="bg-white/5 border border-white/10 text-[9px] font-bold px-2 py-0.5 rounded-lg text-amber-400 flex items-center gap-0.5">
                              ★ {ratingAverage.toFixed(1)}
                            </span>
                            {p.isFeatured && (
                              <span className="bg-primary text-bg text-[8px] uppercase font-black px-1.5 py-0.5 rounded flex-shrink-0">
                                Featured
                              </span>
                            )}
                          </div>
                          <p className="text-textMuted text-xs mt-1 truncate max-w-xl font-body leading-relaxed">District: <span className="text-white/70">{p.districtName}</span> · {p.shortDescription || p.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                        <button 
                          onClick={() => openModal('place', 'edit', p)} 
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all flex items-center gap-1"
                        >
                          <span>✏️</span> Edit
                        </button>
                        <button 
                          onClick={() => handleDeletePlace(p._id)} 
                          className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-danger/10 border border-danger/20 text-danger hover:bg-danger hover:text-white transition-all flex items-center gap-1"
                        >
                          <span>🗑️</span> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Pagination Controls */}
                {totalPlacePages > 1 && (
                  <div className="flex justify-center items-center gap-3 mt-6 pt-4 border-t border-white/5">
                    <button
                      onClick={() => setPlacePage(p => Math.max(p - 1, 1))}
                      disabled={placePage === 1}
                      className="px-3 py-1.5 bg-surface/50 border border-white/10 hover:bg-white/5 text-[10px] font-bold rounded-lg disabled:opacity-35 transition-all text-white"
                    >
                      ← Previous
                    </button>
                    <span className="text-[10px] text-textMuted font-bold uppercase tracking-wider">
                      Page {placePage} of {totalPlacePages}
                    </span>
                    <button
                      onClick={() => setPlacePage(p => Math.min(p + 1, totalPlacePages))}
                      disabled={placePage === totalPlacePages}
                      className="px-3 py-1.5 bg-surface/50 border border-white/10 hover:bg-white/5 text-[10px] font-bold rounded-lg disabled:opacity-35 transition-all text-white"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Feedback Tab Content */}
        {tab === 'feedback' && (
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider">Feedbacks Portal</h2>
              <p className="text-textMuted text-xs mt-0.5">Review semi-quantitative statistics and messages submitted by general visitors</p>
            </div>
            
            <div className="space-y-4">
              {feedbacks.length === 0 ? (
                <div className="bg-surface/30 border border-white/5 rounded-2xl p-12 text-center text-textMuted flex flex-col items-center shadow-lg">
                  <div className="bg-white/5 border border-white/10 w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-md">💬</div>
                  <p className="font-semibold text-xs">No feedback logs found.</p>
                </div>
              ) : (
                feedbacks.map(f => (
                  <div key={f._id} className="bg-surface/40 backdrop-blur-md border border-white/5 p-5 rounded-2xl flex flex-col gap-3 shadow-md hover:border-white/10 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-amber-300 flex items-center justify-center text-bg font-black text-sm uppercase">
                          {f.name ? f.name[0] : 'V'}
                        </div>
                        <div>
                          <p className="font-bold text-white text-xs leading-none">{f.name}</p>
                          <p className="text-textMuted text-[10px] mt-1">{f.contactInfo}</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:items-end gap-1.5">
                        <p className="text-textMuted text-[9px] font-bold uppercase tracking-wider">{new Date(f.createdAt).toLocaleString()}</p>
                        <div className="flex text-amber-400 text-xs">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={i < f.rating ? 'opacity-100' : 'opacity-20'}>★</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-white/80 text-xs leading-relaxed border-t border-white/5 pt-3 font-body italic">"{f.message}"</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab Content */}
        {tab === 'analytics' && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h2 className="font-display text-xl font-bold text-white uppercase tracking-wider">Analytics & Business Intelligence</h2>
              <p className="text-textMuted text-xs mt-0.5">Real-time engagement trends, search intelligence, and user activity growth</p>
            </div>

            {loadingAnalytics ? (
              <div className="py-20 text-center text-textMuted">
                <div className="w-8 h-8 border-3 border-white/5 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-xs">Loading analytics data...</p>
              </div>
            ) : !analyticsData.dashboard ? (
              <div className="py-20 text-center text-textMuted bg-surface/30 border border-white/5 rounded-3xl p-10">
                <p className="text-xs">No analytics data returned. Please ensure visitors have generated event logs.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Analytics Stats Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <AnalyticsStatCard
                    title="Active Registrations"
                    value={analyticsData.dashboard.summary.totalUsers}
                    icon="👥"
                    change={analyticsData.growth?.registrations?.weekly?.percentage}
                    changeType={analyticsData.growth?.registrations?.weekly?.percentage >= 0 ? 'positive' : 'negative'}
                    delay={0.05}
                  />
                  <AnalyticsStatCard
                    title="Saved Attractions"
                    value={analyticsData.dashboard.summary.totalCollections}
                    icon="💖"
                    delay={0.1}
                  />
                  <AnalyticsStatCard
                    title="Trip Plans Created"
                    value={analyticsData.dashboard.summary.totalTrips}
                    icon="✈️"
                    delay={0.15}
                  />
                  <AnalyticsStatCard
                    title="Live Feedback Logs"
                    value={analyticsData.dashboard.summary.totalFeedback}
                    icon="💬"
                    delay={0.2}
                  />
                </div>

                {/* Live Logs & Trending Now Spikes */}
                <RecentActivityFeed
                  recentActivity={analyticsData.dashboard.recentActivity}
                  trendingAlerts={analyticsData.dashboard.trendingAlerts}
                />

                {/* Registration Trends Line Chart & Top Popular Attractions Bar Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {analyticsData.growth?.monthlyTrends && (
                    <RegistrationsLineChart data={analyticsData.growth.monthlyTrends} />
                  )}
                  {analyticsData.popular?.topPopular && (
                    <PopularPlacesBarChart data={analyticsData.popular.topPopular} />
                  )}
                </div>

                {/* District Heat leaderboard & Category shares */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {analyticsData.districts && (
                    <DistrictPopularityChart data={analyticsData.districts} />
                  )}
                  {analyticsData.categories && (
                    <CategoryPieChart data={analyticsData.categories} />
                  )}
                </div>

                {/* Search query lists & click conversions */}
                {analyticsData.searches && (
                  <SearchAnalyticsTable data={analyticsData.searches} />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* District Add/Edit Modal */}
      {modal?.type === 'district' && (
        <Modal title={`${modal.mode === 'add' ? 'Create' : 'Modify'} District`} onClose={() => setModal(null)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <FormField label="District Name *" value={formData.name} onChange={f('name').onChange} placeholder="e.g. Visakhapatnam" required />
              <FormField label="Short Description" type="textarea" value={formData.shortDescription} onChange={f('shortDescription').onChange} placeholder="A brief summary (max 200 chars)" />
              <FormField label="Full Description *" type="textarea" value={formData.description} onChange={f('description').onChange} placeholder="Detailed overview" required />
            </div>

            <div className="space-y-4">
              <ImageUploadField label="Cover Image" value={formData.image} onChange={f('image').onChange} placeholder="Upload image or paste URL" />
              <FormField label="Gallery Images (comma separated URLs)" type="textarea" value={formData.images} onChange={f('images').onChange} placeholder="https://site.com/img1.jpg, https://site.com/img2.jpg" />
              <FormField label="Highlights (comma separated)" value={formData.highlights} onChange={f('highlights').onChange} placeholder="RK Beach, Araku Valley, Borra Caves" />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Latitude *" type="number" value={formData.lat} onChange={f('lat').onChange} placeholder="17.68" required />
                <FormField label="Longitude *" type="number" value={formData.lng} onChange={f('lng').onChange} placeholder="83.21" required />
              </div>

              {formData.lat && formData.lng && (
                <div className="relative rounded-xl overflow-hidden h-36 border border-white/10">
                  <iframe
                    title="Live Location Map Preview"
                    src={`https://maps.google.com/maps?q=${formData.lat},${formData.lng}&z=11&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0, filter: 'grayscale(0.2) contrast(1.1) brightness(0.9)' }}
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-3 mt-6 pt-5 border-t border-white/5">
            <button onClick={() => setModal(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-2.5 rounded-xl border border-white/10 transition-all text-xs uppercase">Cancel</button>
            <button onClick={handleSaveDistrict} disabled={saving} className="flex-1 bg-primary hover:bg-amber-400 text-bg font-bold py-2.5 rounded-xl transition-all shadow active:scale-[0.98] text-xs uppercase">
              {saving ? 'Saving...' : 'Save District'}
            </button>
          </div>
        </Modal>
      )}

      {/* Place Add/Edit Modal */}
      {modal?.type === 'place' && (
        <Modal title={`${modal.mode === 'add' ? 'Create' : 'Modify'} Place`} onClose={() => setModal(null)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <FormField label="Place Name *" value={formData.name} onChange={f('name').onChange} placeholder="e.g. RK Beach" required />
              
              <div>
                <label className="text-textMuted text-xs font-bold uppercase tracking-wider block mb-1.5">District *</label>
                <select value={formData.districtId} onChange={f('districtId').onChange} required className="w-full bg-surfaceLight/50 border border-white/10 rounded-xl px-4 py-2.5 text-text focus:outline-none focus:border-primary text-sm font-body">
                  <option value="">Select District</option>
                  {districts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>

              <FormField label="Category" type="select" value={formData.category} onChange={f('category').onChange} options={CATEGORIES} />
              <FormField label="Short Description" type="textarea" value={formData.shortDescription} onChange={f('shortDescription').onChange} placeholder="Tagline (max 250 chars)" />
              <FormField label="Full Description *" type="textarea" value={formData.description} onChange={f('description').onChange} placeholder="Details" required />

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Rating" type="number" value={formData.rating} onChange={f('rating').onChange} placeholder="4.5" />
                <FormField label="Rating Count" type="number" value={formData.ratingCount} onChange={f('ratingCount').onChange} placeholder="1" />
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none bg-white/5 border border-white/10 p-3.5 rounded-xl hover:bg-white/[0.08] transition-colors">
                <input type="checkbox" checked={formData.isFeatured} onChange={f('isFeatured').onChange} className="w-4 h-4 accent-primary" />
                <span className="text-text font-bold text-xs uppercase tracking-wider">Featured Attraction</span>
              </label>
            </div>

            <div className="space-y-4">
              <ImageUploadField label="Cover Image" value={formData.coverImage} onChange={f('coverImage').onChange} placeholder="Upload or paste image URL" />
              <FormField label="Gallery Images (comma separated)" type="textarea" value={formData.images} onChange={f('images').onChange} placeholder="https://site.com/img1.jpg, https://site.com/img2.jpg" />
              
              <FormField label="Entry Fee" value={formData.entryFee} onChange={f('entryFee').onChange} placeholder="Free / ₹50" />
              <FormField label="Timings" value={formData.timings} onChange={f('timings').onChange} placeholder="6 AM - 8 PM" />
              <FormField label="Best Time to Visit" value={formData.bestTimeToVisit} onChange={f('bestTimeToVisit').onChange} placeholder="October to March" />

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Latitude *" type="number" value={formData.lat} onChange={f('lat').onChange} placeholder="17.71" required />
                <FormField label="Longitude *" type="number" value={formData.lng} onChange={f('lng').onChange} placeholder="83.29" required />
              </div>

              {formData.lat && formData.lng && (
                <div className="relative rounded-xl overflow-hidden h-36 border border-white/10">
                  <iframe
                    title="Live Location Map Preview"
                    src={`https://maps.google.com/maps?q=${formData.lat},${formData.lng}&z=13&output=embed`}
                    width="100%"
                    height="100%"
                    style={{ border: 0, filter: 'grayscale(0.2) contrast(1.1) brightness(0.9)' }}
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-3 mt-6 pt-5 border-t border-white/5">
            <button onClick={() => setModal(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-2.5 rounded-xl border border-white/10 transition-all text-xs uppercase">Cancel</button>
            <button onClick={handleSavePlace} disabled={saving} className="flex-1 bg-primary hover:bg-amber-400 text-bg font-bold py-2.5 rounded-xl transition-all shadow active:scale-[0.98] text-xs uppercase">
              {saving ? 'Saving...' : 'Save Place'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
