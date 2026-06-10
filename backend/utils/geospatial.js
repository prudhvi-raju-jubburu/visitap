/**
 * Computes the distance between two points in kilometers using the Haversine formula.
 */
function calculateHaversineDistance(lon1, lat1, lon2, lat2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimates travel time in minutes based on distance and travel mode.
 * Speeds:
 * - ROAD: 50 km/h (1.2 min/km)
 * - CYCLING: 15 km/h (4.0 min/km)
 * - WALKING: 5 km/h (12.0 min/km)
 */
function estimateTravelTime(distanceKm, travelMode = 'ROAD') {
  let speedKmh = 50;
  switch (travelMode.toUpperCase()) {
    case 'CYCLING':
      speedKmh = 15;
      break;
    case 'WALKING':
      speedKmh = 5;
      break;
    case 'ROAD':
    default:
      speedKmh = 50;
      break;
  }

  const timeHours = distanceKm / speedKmh;
  const timeMinutes = timeHours * 60;
  
  // Return rounded minutes, minimum 1 minute if distance > 0
  if (distanceKm > 0 && timeMinutes < 1) {
    return 1;
  }
  return Math.round(timeMinutes);
}

module.exports = {
  calculateHaversineDistance,
  estimateTravelTime
};
