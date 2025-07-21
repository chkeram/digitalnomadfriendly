import type { LocationCoords } from '$lib/types';

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param coord1 First coordinate
 * @param coord2 Second coordinate
 * @returns Distance in kilometers
 */
export function calculateDistance(coord1: LocationCoords, coord2: LocationCoords): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.lat - coord1.lat);
  const dLng = toRadians(coord2.lng - coord1.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.lat)) * Math.cos(toRadians(coord2.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Format distance for display
 * @param distance Distance in kilometers
 * @returns Formatted distance string
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
}

/**
 * Create a bounding box around a center point with given radius
 * @param center Center coordinate
 * @param radiusKm Radius in kilometers
 * @returns Bounds object
 */
export function createBounds(center: LocationCoords, radiusKm: number): {
  north: number;
  south: number;
  east: number;
  west: number;
} {
  // Approximate conversion: 1 degree ≈ 111 km
  const latOffset = radiusKm / 111;
  const lngOffset = radiusKm / (111 * Math.cos(toRadians(center.lat)));

  return {
    north: center.lat + latOffset,
    south: center.lat - latOffset,
    east: center.lng + lngOffset,
    west: center.lng - lngOffset
  };
}

/**
 * Check if a coordinate is within bounds
 * @param coord Coordinate to check
 * @param bounds Bounds object
 * @returns True if coordinate is within bounds
 */
export function isWithinBounds(
  coord: LocationCoords, 
  bounds: { north: number; south: number; east: number; west: number }
): boolean {
  return (
    coord.lat >= bounds.south &&
    coord.lat <= bounds.north &&
    coord.lng >= bounds.west &&
    coord.lng <= bounds.east
  );
}

/**
 * Get default map options for consistent styling
 */
export function getDefaultMapOptions(): google.maps.MapOptions {
  return {
    mapTypeControl: false,
    streetViewControl: true,
    fullscreenControl: true,
    zoomControl: true,
    gestureHandling: 'cooperative',
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'transit',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      },
      {
        featureType: 'road',
        elementType: 'labels.icon',
        stylers: [{ visibility: 'off' }]
      }
    ]
  };
}

/**
 * Fit map to show all markers
 * @param map Google Maps instance
 * @param coordinates Array of coordinates
 * @param padding Optional padding in pixels
 */
export function fitMapToMarkers(
  map: google.maps.Map,
  coordinates: LocationCoords[],
  padding = 50
): void {
  if (coordinates.length === 0) return;

  const bounds = new google.maps.LatLngBounds();
  coordinates.forEach(coord => {
    bounds.extend(new google.maps.LatLng(coord.lat, coord.lng));
  });

  map.fitBounds(bounds, padding);
}

/**
 * Debounce function for map event handlers
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Get viewport info from map
 */
export function getMapViewport(map: google.maps.Map): {
  center: LocationCoords;
  zoom: number;
  bounds: google.maps.LatLngBounds;
} {
  const center = map.getCenter();
  const bounds = map.getBounds();
  
  if (!center || !bounds) {
    throw new Error('Unable to get map viewport');
  }

  return {
    center: {
      lat: center.lat(),
      lng: center.lng()
    },
    zoom: map.getZoom() || 12,
    bounds
  };
}