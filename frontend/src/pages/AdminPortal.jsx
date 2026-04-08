import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchDistricts, fetchPlaces, createDistrict, updateDistrict, deleteDistrict,
  createPlace, updatePlace, deletePlace, fetchFeedbacks
} from '../services/api';
import { useAuth } from '../App';

const CATEGORIES = [
  'Temple / Religious', 'Beach', 'Hill Station', 'Historical', 'Nature', 'Waterfalls', 
  'Wildlife', 'Adventure', 'City', 'Culture', 'Heritage', 'Backwaters', 'Tribal', 'Pilgrimage', 'Other'
];

import { uploadImage } from '../services/api';

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
    <div>
      <label className="text-textMuted text-sm font-medium block mb-1">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="flex-1 bg-surfaceLight border border-white/10 rounded-xl px-4 py-3 text-text placeholder-textMuted focus:outline-none focus:border-primary transition-colors text-sm"
        />
        <label className={`cursor-pointer px-4 py-3 rounded-xl border border-dashed border-white/20 text-xs flex items-center justify-center transition-all ${uploading ? 'opacity-50' : 'hover:border-primary/50 text-textMuted hover:text-primary'}`}>
          {uploading ? '...' : 'Upload'}
          <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>
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
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-surface border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scroll"
        >
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h3 className="font-display text-lg font-bold text-text">{title}</h3>
            <button onClick={onClose} className="text-textMuted hover:text-text transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function FormField({ label, type = 'text', value, onChange, placeholder, required, options }) {
  return (
    <div>
      <label className="text-textMuted text-sm font-medium block mb-1">{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          rows={3}
          className="w-full bg-surfaceLight border border-white/10 rounded-xl px-4 py-3 text-text placeholder-textMuted focus:outline-none focus:border-primary transition-colors resize-none text-sm"
        />
      ) : type === 'select' ? (
        <select
          value={value}
          onChange={onChange}
          required={required}
          className="w-full bg-surfaceLight border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:border-primary transition-colors text-sm"
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
          className="w-full bg-surfaceLight border border-white/10 rounded-xl px-4 py-3 text-text placeholder-textMuted focus:outline-none focus:border-primary transition-colors text-sm"
        />
      )}
    </div>
  );
}

export default function AdminPortal() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('districts');
  const [districts, setDistricts] = useState([]);
  const [places, setPlaces] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { type: 'district'|'place', mode: 'add'|'edit', data: {} }
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dRes, pRes, fRes] = await Promise.all([fetchDistricts(), fetchPlaces(), fetchFeedbacks()]);
      setDistricts(dRes.data.data || []);
      setPlaces(pRes.data.data || []);
      setFeedbacks(fRes.data.data || []);
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
        name: '', image: '', images: '', description: '', shortDescription: '', highlights: '',
        ...data,
        highlights: data.highlights?.join(', ') || '',
        images: data.images?.join(', ') || '',
      });
    } else {
      setFormData({
        name: '', districtId: '', districtName: '', description: '', shortDescription: '',
        coverImage: '', images: '', category: 'Other', lng: '', lat: '', rating: 4.0,
        bestTimeToVisit: '', entryFee: '', timings: '', isFeatured: false,
        ...data,
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
      };
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
        images: formData.images ? formData.images.split(',').map(i => i.trim()).filter(Boolean) : [],
      };
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

  const f = (key) => ({
    value: formData[key] ?? '',
    onChange: e => setFormData(d => ({ ...d, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })),
  });

  return (
    <div className="min-h-screen bg-bg">
      {/* Top Bar */}
      <div className="bg-surface border-b border-white/10 px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-amber-300 flex items-center justify-center">
            <span className="text-bg font-black text-sm">V</span>
          </div>
          <div>
            <p className="font-bold text-text text-sm">Visit AP Admin</p>
            <p className="text-textMuted text-xs">Welcome, {admin?.username}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <a href="/" target="_blank" className="text-textMuted text-sm hover:text-primary transition-colors">
            View Site ↗
          </a>
          <button onClick={() => { logout(); navigate('/admin/login'); }} className="text-danger text-sm hover:underline">
            Logout
          </button>
        </div>
      </div>

      {/* Message toast */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg text-sm font-medium ${message.type === 'error' ? 'bg-danger/90 text-white' : 'bg-success/90 text-white'
              }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Districts', value: districts.length, icon: '🗺️' },
            { label: 'Places', value: places.length, icon: '📍' },
            { label: 'Featured', value: places.filter(p => p.isFeatured).length, icon: '⭐' },
            { label: 'Feedback', value: feedbacks.length, icon: '💬' },
          ].map(stat => (
            <div key={stat.label} className="glass-card p-4">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <p className="font-display text-3xl font-bold text-primary">{stat.value}</p>
              <p className="text-textMuted text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['districts', 'places', 'feedback'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-primary text-bg' : 'bg-surface text-textMuted hover:text-text border border-white/10'
                }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Districts Tab */}
        {tab === 'districts' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-text">Districts ({districts.length})</h2>
              <button onClick={() => openModal('district', 'add')} className="btn-primary text-sm">
                + Add District
              </button>
            </div>
            <div className="space-y-3">
              {districts.map(d => (
                <div key={d._id} className="glass-card p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={d.image}
                      alt={d.name}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                      onError={e => e.target.src = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100'}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-text truncate">{d.name}</p>
                      <p className="text-textMuted text-xs truncate">{d.shortDescription}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => openModal('district', 'edit', d)} className="text-accent text-sm hover:underline">Edit</button>
                    <button onClick={() => handleDeleteDistrict(d._id)} className="text-danger text-sm hover:underline">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Places Tab */}
        {tab === 'places' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-text">Places ({places.length})</h2>
              <button onClick={() => openModal('place', 'add')} className="btn-primary text-sm">
                + Add Place
              </button>
            </div>
            <div className="space-y-3">
              {places.map(p => (
                <div key={p._id} className="glass-card p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={p.coverImage}
                      alt={p.name}
                      className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                      onError={e => e.target.src = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100'}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-text truncate">{p.name}</p>
                      <p className="text-textMuted text-xs truncate">{p.districtName} · {p.category} · ★ {p.rating}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {p.isFeatured && <span className="text-primary text-xs">Featured</span>}
                    <button onClick={() => openModal('place', 'edit', { ...p, districtId: p.districtId })} className="text-accent text-sm hover:underline">Edit</button>
                    <button onClick={() => handleDeletePlace(p._id)} className="text-danger text-sm hover:underline">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feedback Tab */}
        {tab === 'feedback' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-text">Feedback ({feedbacks.length})</h2>
            </div>
            <div className="space-y-3">
              {feedbacks.length === 0 ? (
                <div className="text-center text-textMuted py-4">No feedback yet.</div>
              ) : (
                feedbacks.map(f => (
                  <div key={f._id} className="glass-card p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-text">{f.name}</p>
                        <p className="text-textMuted text-xs">{f.contactInfo}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <p className="text-textMuted text-xs flex-shrink-0 mb-1">{new Date(f.createdAt).toLocaleString()}</p>
                        <div className="flex text-amber-400 text-sm">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className={i < f.rating ? 'opacity-100' : 'opacity-20'}>★</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-text mt-2 border-t border-white/5 pt-2">{f.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* District Modal */}
      {modal?.type === 'district' && (
        <Modal title={`${modal.mode === 'add' ? 'Add' : 'Edit'} District`} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <FormField label="District Name *" value={formData.name} onChange={f('name').onChange} placeholder="e.g. Visakhapatnam" required />
            <ImageUploadField label="Cover Image" value={formData.image} onChange={f('image').onChange} placeholder="Paste URL or upload here" />
            <FormField label="Short Description" type="textarea" value={formData.shortDescription} onChange={f('shortDescription').onChange} placeholder="Max 200 chars" />
            <FormField label="Full Description *" type="textarea" value={formData.description} onChange={f('description').onChange} placeholder="Detailed description" required />
            <FormField label="Gallery Image URLs (comma separated)" type="textarea" value={formData.images} onChange={f('images').onChange} placeholder="https://image1.jpg, https://image2.jpg" />
            <FormField label="Highlights (comma separated)" value={formData.highlights} onChange={f('highlights').onChange} placeholder="RK Beach, Araku Valley, Borra Caves" />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Latitude" type="number" value={formData['coordinates.lat'] || ''} onChange={e => setFormData(d => ({ ...d, coordinates: { ...d.coordinates, lat: parseFloat(e.target.value) } }))} placeholder="17.68" />
              <FormField label="Longitude" type="number" value={formData['coordinates.lng'] || ''} onChange={e => setFormData(d => ({ ...d, coordinates: { ...d.coordinates, lng: parseFloat(e.target.value) } }))} placeholder="83.21" />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setModal(null)} className="flex-1 btn-outline">Cancel</button>
            <button onClick={handleSaveDistrict} disabled={saving} className="flex-1 btn-primary">
              {saving ? 'Saving...' : 'Save District'}
            </button>
          </div>
        </Modal>
      )}

      {/* Place Modal */}
      {modal?.type === 'place' && (
        <Modal title={`${modal.mode === 'add' ? 'Add' : 'Edit'} Place`} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <FormField label="Place Name *" value={formData.name} onChange={f('name').onChange} placeholder="e.g. RK Beach" required />
            <div>
              <label className="text-textMuted text-sm font-medium block mb-1">District *</label>
              <select value={formData.districtId} onChange={f('districtId').onChange} className="w-full bg-surfaceLight border border-white/10 rounded-xl px-4 py-3 text-text focus:outline-none focus:border-primary text-sm">
                <option value="">Select District</option>
                {districts.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <FormField label="Category" type="select" value={formData.category} onChange={f('category').onChange} options={CATEGORIES} />
            <ImageUploadField label="Cover Image" value={formData.coverImage} onChange={f('coverImage').onChange} placeholder="Paste URL or upload here" />
            <FormField label="Short Description" type="textarea" value={formData.shortDescription} onChange={f('shortDescription').onChange} placeholder="Max 250 chars" />
            <FormField label="Gallery Image URLs (comma separated)" type="textarea" value={formData.images} onChange={f('images').onChange} placeholder="https://image1.jpg, https://image2.jpg" />
            <FormField label="Full Description *" type="textarea" value={formData.description} onChange={f('description').onChange} required />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Latitude *" type="number" value={formData.lat} onChange={f('lat').onChange} placeholder="17.71" required />
              <FormField label="Longitude *" type="number" value={formData.lng} onChange={f('lng').onChange} placeholder="83.29" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Rating (0-5)" type="number" value={formData.rating} onChange={f('rating').onChange} placeholder="4.5" />
              <FormField label="Entry Fee" value={formData.entryFee} onChange={f('entryFee').onChange} placeholder="Free / ₹50" />
            </div>
            <FormField label="Best Time to Visit" value={formData.bestTimeToVisit} onChange={f('bestTimeToVisit').onChange} placeholder="October to March" />
            <FormField label="Timings" value={formData.timings} onChange={f('timings').onChange} placeholder="6 AM - 8 PM" />
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={formData.isFeatured} onChange={f('isFeatured').onChange} className="w-4 h-4 accent-primary" />
              <span className="text-text text-sm">Featured Place</span>
            </label>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={() => setModal(null)} className="flex-1 btn-outline">Cancel</button>
            <button onClick={handleSavePlace} disabled={saving} className="flex-1 btn-primary">
              {saving ? 'Saving...' : 'Save Place'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
