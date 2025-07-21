// Svelte stores for global state management

import { writable, derived } from 'svelte/store';
import type { LocationCoords, Venue, SearchFilters } from '$lib/types';

// Re-export auth stores from dedicated auth module
export { 
  user, 
  session, 
  isAuthenticated, 
  userDisplayName, 
  authLoading, 
  authError,
  initializeAuth,
  signOut,
  clearAuthError
} from './auth';

// Re-export location stores from dedicated location module
export {
  locationStore,
  currentLocation,
  isLocationLoading,
  locationError,
  hasLocationPermission
} from './location';

// Re-export map stores from dedicated map module
export {
  mapStore,
  mapInstance,
  mapCenter as mapCenterStore,
  mapZoom as mapZoomStore,
  mapBounds,
  isMapLoaded,
  isMapLoading,
  mapError
} from './map';

// Location store
export const userLocation = writable<LocationCoords | null>(null);

// Search and venue stores
export const searchFilters = writable<SearchFilters>({
  radius: 2, // 2km default radius
  wifi_min: 3, // Minimum WiFi rating of 3
  rating_min: 3 // Minimum overall rating of 3
});

export const venues = writable<Venue[]>([]);
export const selectedVenue = writable<Venue | null>(null);

// UI state stores
export const isLoading = writable(false);
export const mapCenter = writable<LocationCoords>({ lat: 37.7749, lng: -122.4194 }); // Default to SF

// Favorites store
export const favorites = writable<string[]>([]); // Array of venue IDs

// Search query store
export const searchQuery = writable<string>('');

// Map zoom level
export const mapZoom = writable<number>(13);

// Error handling store
export const error = writable<string | null>(null);

// Clear error after timeout
error.subscribe((err) => {
  if (err) {
    setTimeout(() => error.set(null), 5000);
  }
});