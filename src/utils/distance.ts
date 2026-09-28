/**
 * Calculates the great-circle distance between two points on the Earth's surface
 * using the Haversine formula.
 * Returns distance in meters.
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Formats a distance in meters to a clean human-readable string (m or km)
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const km = meters / 1000;
  if (km < 10) {
    return `${km.toFixed(1)} km`;
  }
  return `${Math.round(km)} km`;
}

/**
 * Estimated travel times
 */
export function getEstimatedTravelTime(meters: number): { walking: string; driving: string } {
  // Average walking speed ~ 4.8 km/h -> ~80 meters / min
  const walkingMinutes = Math.max(1, Math.round(meters / 80));
  // Average urban driving speed ~ 30 km/h -> ~500 meters / min
  const drivingMinutes = Math.max(1, Math.round(meters / 500));

  const formatMin = (mins: number) => {
    if (mins < 60) return `${mins} min`;
    const hrs = Math.floor(mins / 60);
    const rem = mins % 60;
    return rem > 0 ? `${hrs}h ${rem}m` : `${hrs}h`;
  };

  return {
    walking: formatMin(walkingMinutes),
    driving: formatMin(drivingMinutes),
  };
}

/**
 * Generates an external turn-by-turn navigation URL using user's real coordinates as origin
 * and store coordinates as destination.
 */
export function getDirectionsUrl(
  userCoords: { lat: number; lng: number } | null,
  storeCoords: { lat: number; lng: number },
  storeName?: string,
  placeId?: string
): string {
  if (userCoords) {
    const origin = `${userCoords.lat},${userCoords.lng}`;
    const destination = `${storeCoords.lat},${storeCoords.lng}`;
    let url = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`;
    if (placeId) {
      url += `&destination_place_id=${encodeURIComponent(placeId)}`;
    }
    return url;
  }
  // Fallback if user origin not available yet
  if (storeName) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeName + ' ' + storeCoords.lat + ',' + storeCoords.lng)}`;
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${storeCoords.lat},${storeCoords.lng}`;
}
