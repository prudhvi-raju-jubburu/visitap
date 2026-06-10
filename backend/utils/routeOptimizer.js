const { calculateHaversineDistance } = require('./geospatial');

/**
 * Extracts longitude and latitude from a Place object.
 * Supports both GeoJSON format [lng, lat] and flat coords { lat, lng }.
 */
function getCoordinates(place) {
  if (!place) return null;
  
  if (place.location && Array.isArray(place.location.coordinates) && place.location.coordinates.length === 2) {
    return {
      lng: place.location.coordinates[0],
      lat: place.location.coordinates[1]
    };
  }
  
  if (place.location && place.location.lat !== undefined && place.location.lng !== undefined) {
    return {
      lng: place.location.lng,
      lat: place.location.lat
    };
  }
  
  return null;
}

/**
 * Computes cumulative path distance in kilometers for a sequence of places.
 */
function calculateTotalPathDistance(path) {
  let totalDist = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const coords1 = getCoordinates(path[i]);
    const coords2 = getCoordinates(path[i + 1]);
    if (coords1 && coords2) {
      totalDist += calculateHaversineDistance(coords1.lng, coords1.lat, coords2.lng, coords2.lat);
    }
  }
  return totalDist;
}

/**
 * Optimizes the travel sequence for an array of places.
 * Keeps the first place fixed as the starting point and rearranges the rest.
 */
function optimizeRoute(places) {
  if (!Array.isArray(places) || places.length <= 2) {
    return places;
  }

  const startPlace = places[0];
  const remainingPlaces = places.slice(1);
  let bestSequence = [];

  // If remaining items <= 6 (total places <= 7), run full brute force search (O(N!))
  if (remainingPlaces.length <= 6) {
    let minDistance = Infinity;

    function permute(arr, memo = []) {
      if (arr.length === 0) {
        const fullSequence = [startPlace, ...memo];
        const dist = calculateTotalPathDistance(fullSequence);
        if (dist < minDistance) {
          minDistance = dist;
          bestSequence = fullSequence;
        }
        return;
      }
      for (let i = 0; i < arr.length; i++) {
        const curr = arr.slice();
        const next = curr.splice(i, 1);
        permute(curr, memo.concat(next));
      }
    }

    permute(remainingPlaces);
  } else {
    // For larger sequences, solve using the Nearest Neighbor heuristic (O(N^2))
    bestSequence = [startPlace];
    const unvisited = [...remainingPlaces];
    let current = startPlace;

    while (unvisited.length > 0) {
      let nearestIndex = -1;
      let minDistance = Infinity;
      const currentCoords = getCoordinates(current);

      if (!currentCoords) {
        bestSequence.push(unvisited.shift());
        current = bestSequence[bestSequence.length - 1];
        continue;
      }

      for (let i = 0; i < unvisited.length; i++) {
        const candidateCoords = getCoordinates(unvisited[i]);
        if (!candidateCoords) continue;

        const dist = calculateHaversineDistance(
          currentCoords.lng,
          currentCoords.lat,
          candidateCoords.lng,
          candidateCoords.lat
        );

        if (dist < minDistance) {
          minDistance = dist;
          nearestIndex = i;
        }
      }

      if (nearestIndex !== -1) {
        const nextPlace = unvisited.splice(nearestIndex, 1)[0];
        bestSequence.push(nextPlace);
        current = nextPlace;
      } else {
        bestSequence.push(unvisited.shift());
        current = bestSequence[bestSequence.length - 1];
      }
    }
  }

  return bestSequence;
}

module.exports = {
  optimizeRoute,
  calculateTotalPathDistance,
  getCoordinates
};
