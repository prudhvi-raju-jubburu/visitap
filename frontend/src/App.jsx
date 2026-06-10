import React, { createContext, useContext, useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PageLoader from './components/PageLoader';
import FeedbackWidget from './components/FeedbackWidget';
import BottomNavigation from './components/BottomNavigation';
import { UserAuthProvider } from './context/AuthContext';
import UserProtectedRoute from './components/UserProtectedRoute';

// Lazy loaded pages
const Home = lazy(() => import('./pages/Home'));
const Districts = lazy(() => import('./pages/Districts'));
const DistrictDetails = lazy(() => import('./pages/DistrictDetails'));
const PlaceDetails = lazy(() => import('./pages/PlaceDetails'));
const InteractiveMap = lazy(() => import('./pages/InteractiveMap'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminPortal = lazy(() => import('./pages/AdminPortal'));
const Categories = lazy(() => import('./pages/Categories'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Profile = lazy(() => import('./pages/Profile'));
const Favorites = lazy(() => import('./pages/Favorites'));
const MyReviews = lazy(() => import('./pages/MyReviews'));
const MyTrips = lazy(() => import('./pages/MyTrips'));
const TripPlanner = lazy(() => import('./pages/TripPlanner'));
const TripDetails = lazy(() => import('./pages/TripDetails'));
const SharedTrip = lazy(() => import('./pages/SharedTrip'));
const MyTravelCollection = lazy(() => import('./pages/MyTravelCollection'));

// Auth Context (Admin)
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function ProtectedRoute({ children }) {
  const { admin } = useAuth();
  return admin ? children : <Navigate to="/admin/login" replace />;
}

function Layout({ children }) {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-bg pb-16 md:pb-0">
      {offline && (
        <div className="bg-amber-600 text-white text-center py-3 px-4 font-bold text-base fixed top-16 md:top-20 left-0 right-0 z-40 animate-pulse shadow-md flex items-center justify-center gap-2">
          <span>⚠️</span>
          <span>No Internet Connection. Showing saved data.</span>
        </div>
      )}
      <Navbar />
      <main className={`flex-1 ${offline ? 'mt-12' : ''}`}>{children}</main>
      <Footer />
      <FeedbackWidget />
      <BottomNavigation />
    </div>
  );
}

export default function App() {
  const [admin, setAdmin] = useState(() => {
    try {
      const stored = localStorage.getItem('visitap_admin');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const login = (adminData, token) => {
    localStorage.setItem('visitap_token', token);
    localStorage.setItem('visitap_admin', JSON.stringify(adminData));
    setAdmin(adminData);
  };

  const logout = () => {
    localStorage.removeItem('visitap_token');
    localStorage.removeItem('visitap_admin');
    setAdmin(null);
  };

  return (
    <AuthContext.Provider value={{ admin, login, logout }}>
      <UserAuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes with layout */}
              <Route path="/" element={<Layout><Home /></Layout>} />
              <Route path="/districts" element={<Layout><Districts /></Layout>} />
              <Route path="/district/:districtName" element={<Layout><DistrictDetails /></Layout>} />
              <Route path="/place/:placeId" element={<Layout><PlaceDetails /></Layout>} />
              <Route path="/categories" element={<Layout><Categories /></Layout>} />
              <Route path="/interactive-map" element={<Layout><InteractiveMap /></Layout>} />

              {/* Visitor Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<UserProtectedRoute><Layout><Profile /></Layout></UserProtectedRoute>} />
              <Route path="/favorites" element={<UserProtectedRoute><Layout><Favorites /></Layout></UserProtectedRoute>} />
              <Route path="/my-reviews" element={<UserProtectedRoute><Layout><MyReviews /></Layout></UserProtectedRoute>} />
              
              {/* Shared trip is public! */}
              <Route path="/shared/:shareId" element={<Layout><SharedTrip /></Layout>} />
              <Route path="/my-travel-collection" element={<UserProtectedRoute><Layout><MyTravelCollection /></Layout></UserProtectedRoute>} />

              {/* Trip Planner routes are protected */}
              <Route path="/my-trips" element={<UserProtectedRoute><Layout><MyTrips /></Layout></UserProtectedRoute>} />
              <Route path="/trip-planner" element={<UserProtectedRoute><Layout><TripPlanner /></Layout></UserProtectedRoute>} />
              <Route path="/trips/:id" element={<UserProtectedRoute><Layout><TripDetails /></Layout></UserProtectedRoute>} />

              {/* Admin routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<ProtectedRoute><AdminPortal /></ProtectedRoute>} />
              <Route path="/admin/portal" element={<ProtectedRoute><AdminPortal /></ProtectedRoute>} />

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </UserAuthProvider>
    </AuthContext.Provider>
  );
}
