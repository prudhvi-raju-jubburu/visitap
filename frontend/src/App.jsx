import React, { createContext, useContext, useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PageLoader from './components/PageLoader';
import FeedbackWidget from './components/FeedbackWidget';
// Lazy loaded pages
const Home = lazy(() => import('./pages/Home'));
const Districts = lazy(() => import('./pages/Districts'));
const DistrictDetails = lazy(() => import('./pages/DistrictDetails'));
const PlaceDetails = lazy(() => import('./pages/PlaceDetails'));
const InteractiveMap = lazy(() => import('./pages/InteractiveMap'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminPortal = lazy(() => import('./pages/AdminPortal'));
const Categories = lazy(() => import('./pages/Categories'));

// Auth Context
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

function ProtectedRoute({ children }) {
  const { admin } = useAuth();
  return admin ? children : <Navigate to="/admin/login" replace />;
}

function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <FeedbackWidget />
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

            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedRoute><AdminPortal /></ProtectedRoute>} />
            <Route path="/admin/portal" element={<ProtectedRoute><AdminPortal /></ProtectedRoute>} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}
