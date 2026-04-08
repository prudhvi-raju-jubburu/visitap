import { useState, useCallback } from 'react';

export const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLoading(false);
      },
      (err) => {
        const messages = {
          1: 'Location access denied. Please allow location in browser settings.',
          2: 'Location unavailable. Please try again.',
          3: 'Location request timed out.',
        };
        setError(messages[err.code] || 'Failed to get location.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const openNavigation = useCallback((destLat, destLng, placeName = '') => {
    if (!location) {
      getLocation();
      return false;
    }
    const url = `https://www.google.com/maps/dir/${location.lat},${location.lng}/${destLat},${destLng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }, [location, getLocation]);

  const getDirectionsUrl = useCallback((destLat, destLng) => {
    if (location) {
      return `https://www.google.com/maps/dir/${location.lat},${location.lng}/${destLat},${destLng}`;
    }
    return `https://www.google.com/maps/dir//${destLat},${destLng}`;
  }, [location]);

  const calculateDistance = useCallback((destLat, destLng) => {
    if (!location) return null;
    const R = 6371; // Earth's radius in km
    const dLat = ((destLat - location.lat) * Math.PI) / 180;
    const dLng = ((destLng - location.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((location.lat * Math.PI) / 180) *
      Math.cos((destLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  }, [location]);

  return { location, loading, error, getLocation, openNavigation, getDirectionsUrl, calculateDistance };
};
