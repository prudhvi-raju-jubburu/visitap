import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

// Attach Admin JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('visitap_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle Admin 401 globally
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

// ── User API Instance ──────────────────────────────────────
export const userApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

// Attach User JWT token to every request
userApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('visitap_user_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle User 401 globally
userApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('visitap_user_token');
      localStorage.removeItem('visitap_user');
      window.location.href = '/login';
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

// ── Auth (Admin) ───────────────────────────────────────────
export const loginAdmin = (credentials) => API.post('/auth/login', credentials);
export const getMe = () => API.get('/auth/me');
export const fetchAdminAnalysis = () => API.get('/auth/analysis');

// ── User Auth & Profile ─────────────────────────────────────
export const loginUser = (credentials) => userApi.post('/users/login', credentials);
export const registerUser = (data) => userApi.post('/users/register', data);
export const logoutUser = () => userApi.post('/users/logout');
export const fetchUserProfile = () => userApi.get('/users/profile');
export const updateUserProfile = (data) => userApi.put('/users/profile', data);
export const changeUserPassword = (data) => userApi.put('/users/change-password', data);

// ── User Favorites ──────────────────────────────────────────
export const addFavorite = (placeId) => userApi.post(`/users/favorites/${placeId}`);
export const removeFavorite = (placeId) => userApi.delete(`/users/favorites/${placeId}`);
export const getFavorites = () => userApi.get('/users/favorites');
export const checkFavorite = (placeId) => userApi.get(`/users/favorites/check/${placeId}`);

// ── User Reviews ───────────────────────────────────────────
export const createReview = (placeId, data) => userApi.post(`/reviews/${placeId}`, data);
export const updateReview = (reviewId, data) => userApi.put(`/reviews/${reviewId}`, data);
export const deleteReview = (reviewId) => userApi.delete(`/reviews/${reviewId}`);
export const getPlaceReviews = (placeId, params) => API.get(`/reviews/place/${placeId}`, { params });
export const getUserReviews = () => userApi.get('/reviews/user');
export const getReviewStats = (placeId) => API.get(`/reviews/stats/${placeId}`);
export const getMyReviewForPlace = (placeId) => userApi.get(`/reviews/my-review/${placeId}`);

// ── Feedback ───────────────────────────────────────────────
export const createFeedback = (data) => userApi.post('/feedback', data);
export const fetchFeedbacks = () => API.get('/feedback');
export const fetchTopFeedbacks = () => API.get('/feedback/top');

// ── Upload ─────────────────────────────────────────────────
export const uploadImage = (formData) => API.post('/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});
export const uploadImages = (formData) => API.post('/upload/multiple', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

// ── Trip Planner ───────────────────────────────────────────
export const fetchTrips = () => userApi.get('/trips');
export const fetchTrip = (id) => userApi.get(`/trips/${id}`);
export const createTrip = (data) => userApi.post('/trips', data);
export const updateTrip = (id, data) => userApi.put(`/trips/${id}`, data);
export const deleteTrip = (id) => userApi.delete(`/trips/${id}`);
export const shareTrip = (id, data) => userApi.post(`/trips/${id}/share`, data);
export const fetchSharedTrip = (shareId) => API.get(`/trips/shared/${shareId}`);
export const exportTripPDF = (id) => userApi.post(`/trips/${id}/export`, {}, { responseType: 'blob' });

// ── My Travel Collection ───────────────────────────────────
export const getCollectionDashboard = () => userApi.get('/collection/dashboard');
export const savePlaceToCollection = (placeId) => userApi.post(`/collection/places/${placeId}`);
export const removePlaceFromCollection = (placeId) => userApi.delete(`/collection/places/${placeId}`);
export const saveDistrictToCollection = (districtId) => userApi.post(`/collection/districts/${districtId}`);
export const removeDistrictFromCollection = (districtId) => userApi.delete(`/collection/districts/${districtId}`);
export const saveTripToCollection = (tripId) => userApi.post(`/collection/trips/${tripId}`);
export const removeTripFromCollection = (tripId) => userApi.delete(`/collection/trips/${tripId}`);
export const trackRecentlyViewed = (placeId, guestRecentIds = []) => userApi.post(`/collection/recent/${placeId}`, { guestRecentIds });

// ── Advanced Analytics & Business Intelligence ─────────────
export const getDashboardAnalytics = () => API.get('/analytics/dashboard');
export const getGrowthAnalytics = () => API.get('/analytics/growth');
export const getPopularAnalytics = () => API.get('/analytics/popular');
export const getDistrictAnalytics = () => API.get('/analytics/districts');
export const getSearchAnalytics = () => API.get('/analytics/searches');
export const getCategoryAnalytics = () => API.get('/analytics/categories');
export const getTripAnalytics = () => API.get('/analytics/trips');

export const trackClientEvent = (eventType, payload = {}) => {
  try {
    const width = window.innerWidth;
    const deviceType = width < 768 ? 'Mobile' : (width < 1024 ? 'Tablet' : 'Desktop');

    const ua = navigator.userAgent;
    let browser = 'Other';
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edge') || ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';

    let platform = 'Other';
    if (ua.includes('Windows')) platform = 'Windows';
    else if (ua.includes('Android')) platform = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) platform = 'iOS';
    else if (ua.includes('Macintosh')) platform = 'macOS';
    else if (ua.includes('Linux')) platform = 'Linux';

    const enrichedMetadata = {
      ...payload.metadata,
      deviceType,
      browser,
      platform
    };

    return userApi.post('/analytics/track', {
      eventType,
      placeId: payload.placeId,
      districtId: payload.districtId,
      category: payload.category,
      metadata: enrichedMetadata
    });
  } catch (err) {
    console.error('[api] trackClientEvent error:', err);
    return Promise.resolve(); // Fail-safe
  }
};

export default API;
