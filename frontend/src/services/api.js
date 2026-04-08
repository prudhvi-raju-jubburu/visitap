import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('visitap_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('visitap_token');
      localStorage.removeItem('visitap_admin');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// ── Districts ──────────────────────────────────────────────
export const fetchDistricts = () => API.get('/districts');
export const fetchDistrict = (identifier) => API.get(`/districts/${identifier}`);
export const createDistrict = (data) => API.post('/districts', data);
export const updateDistrict = (id, data) => API.put(`/districts/${id}`, data);
export const deleteDistrict = (id) => API.delete(`/districts/${id}`);
export const searchPlaces = (q) => API.get(`/districts/search?q=${encodeURIComponent(q)}`);

// ── Places ─────────────────────────────────────────────────
export const fetchPlaces = (params = {}) => API.get('/places', { params });
export const fetchPlace = (identifier) => API.get(`/places/${identifier}`);
export const fetchCategories = () => API.get('/places/categories');
export const fetchNearbyPlaces = ({ lng, lat, radius = 20, excludeId }) =>
  API.get('/places/nearby', { params: { lng, lat, radius, excludeId } });
export const createPlace = (data) => API.post('/places', data);
export const updatePlace = (id, data) => API.put(`/places/${id}`, data);
export const deletePlace = (id) => API.delete(`/places/${id}`);

// ── Auth ───────────────────────────────────────────────────
export const loginAdmin = (credentials) => API.post('/auth/login', credentials);
export const getMe = () => API.get('/auth/me');

// ── Feedback ───────────────────────────────────────────────
export const createFeedback = (data) => API.post('/feedback', data);
export const fetchFeedbacks = () => API.get('/feedback');
export const fetchTopFeedbacks = () => API.get('/feedback/top');

// ── Upload ─────────────────────────────────────────────────
export const uploadImage = (formData) => API.post('/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const uploadImages = (formData) => API.post('/upload/multiple', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

export default API;
