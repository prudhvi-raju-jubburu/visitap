import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUserAuth } from '../context/AuthContext';
import PageLoader from './PageLoader';

export default function UserProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useUserAuth();

  if (loading) {
    return <PageLoader />;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}
