import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser, logoutUser, fetchUserProfile } from '../services/api';

const UserAuthContext = createContext(null);

export const useUserAuth = () => {
  const context = useContext(UserAuthContext);
  if (!context) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
};

export const UserAuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('visitap_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  
  const [token, setToken] = useState(() => localStorage.getItem('visitap_user_token'));
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const res = await fetchUserProfile();
          const userData = res.data.user || res.data.data;
          setUser(userData);
          localStorage.setItem('visitap_user', JSON.stringify(userData));
        } catch (err) {
          console.error('Failed to load user profile on mount', err);
          // Token is expired/invalid
          localStorage.removeItem('visitap_user_token');
          localStorage.removeItem('visitap_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await loginUser({ email, password });
    const { token: userToken, user: userData } = res.data;
    localStorage.setItem('visitap_user_token', userToken);
    localStorage.setItem('visitap_user', JSON.stringify(userData));
    setToken(userToken);
    setUser(userData);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await registerUser({ name, email, password });
    const { token: userToken, user: userData } = res.data;
    localStorage.setItem('visitap_user_token', userToken);
    localStorage.setItem('visitap_user', JSON.stringify(userData));
    setToken(userToken);
    setUser(userData);
    return res.data;
  };

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout request failed on server', err);
    } finally {
      localStorage.removeItem('visitap_user_token');
      localStorage.removeItem('visitap_user');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <UserAuthContext.Provider value={{ user, token, loading, isAuthenticated, login, register, logout, setUser }}>
      {children}
    </UserAuthContext.Provider>
  );
};
