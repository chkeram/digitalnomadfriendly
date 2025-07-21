import { writable, derived, type Readable } from 'svelte/store';
import type { LocationCoords } from '$lib/types';

export interface MapState {
  map: google.maps.Map | null;
  center: LocationCoords;
  zoom: number;
  bounds: google.maps.LatLngBounds | null;
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface MapViewport {
  center: LocationCoords;
  zoom: number;
  bounds: google.maps.LatLngBounds | null;
}

// Map state store with enhanced viewport management
function createMapStore() {
  const initialState: MapState = {
    map: null,
    center: { lat: 40.7128, lng: -74.0060 }, // Default to NYC
    zoom: 12,
    bounds: null,
    isLoaded: false,
    isLoading: false,
    error: null
  };

  const { subscribe, set, update } = writable<MapState>(initialState);

  return {
    subscribe,
    setMap: (map: google.maps.Map) => {
      update(state => ({
        ...state,
        map,
        isLoaded: true,
        isLoading: false,
        error: null
      }));

      // Set up viewport change listeners
      if (map) {
        const updateFromMap = () => {
          const center = map.getCenter();
          const zoom = map.getZoom();
          const bounds = map.getBounds();
          
          if (center && zoom !== undefined) {
            update(state => ({
              ...state,
              center: { lat: center.lat(), lng: center.lng() },
              zoom,
              bounds: bounds || null
            }));
          }
        };

        // Listen for viewport changes
        map.addListener('bounds_changed', updateFromMap);
        map.addListener('zoom_changed', updateFromMap);
        map.addListener('center_changed', updateFromMap);
        
        // Initial sync
        updateFromMap();
      }
    },
    setCenter: (center: LocationCoords) => update(state => {
      // Update map if available
      if (state.map) {
        state.map.setCenter(new google.maps.LatLng(center.lat, center.lng));
      }
      return {
        ...state,
        center
      };
    }),
    setZoom: (zoom: number) => update(state => {
      // Update map if available
      if (state.map) {
        state.map.setZoom(zoom);
      }
      return {
        ...state,
        zoom
      };
    }),
    setBounds: (bounds: google.maps.LatLngBounds) => update(state => {
      // Update map if available
      if (state.map) {
        state.map.fitBounds(bounds);
      }
      return {
        ...state,
        bounds
      };
    }),
    setViewport: (viewport: MapViewport) => update(state => {
      // Update map if available
      if (state.map) {
        if (viewport.bounds) {
          state.map.fitBounds(viewport.bounds);
        } else {
          state.map.setCenter(new google.maps.LatLng(viewport.center.lat, viewport.center.lng));
          state.map.setZoom(viewport.zoom);
        }
      }
      return {
        ...state,
        center: viewport.center,
        zoom: viewport.zoom,
        bounds: viewport.bounds
      };
    }),
    panTo: (center: LocationCoords, zoom?: number) => update(state => {
      if (state.map) {
        state.map.panTo(new google.maps.LatLng(center.lat, center.lng));
        if (zoom !== undefined) {
          state.map.setZoom(zoom);
        }
      }
      return {
        ...state,
        center,
        ...(zoom !== undefined && { zoom })
      };
    }),
    fitBounds: (bounds: google.maps.LatLngBounds, padding?: number) => update(state => {
      if (state.map) {
        const options = padding ? { padding } : undefined;
        state.map.fitBounds(bounds, options);
      }
      return {
        ...state,
        bounds
      };
    }),
    setLoading: (loading: boolean) => update(state => ({
      ...state,
      isLoading: loading
    })),
    setError: (error: string) => update(state => ({
      ...state,
      error,
      isLoading: false
    })),
    clearError: () => update(state => ({
      ...state,
      error: null
    })),
    reset: () => set(initialState)
  };
}

export const mapStore = createMapStore();

// Derived stores for convenience
export const mapInstance: Readable<google.maps.Map | null> = derived(
  mapStore,
  $mapStore => $mapStore.map
);

export const mapCenter: Readable<LocationCoords> = derived(
  mapStore,
  $mapStore => $mapStore.center
);

export const mapZoom: Readable<number> = derived(
  mapStore,
  $mapStore => $mapStore.zoom
);

export const mapBounds: Readable<google.maps.LatLngBounds | null> = derived(
  mapStore,
  $mapStore => $mapStore.bounds
);

export const isMapLoaded: Readable<boolean> = derived(
  mapStore,
  $mapStore => $mapStore.isLoaded
);

export const isMapLoading: Readable<boolean> = derived(
  mapStore,
  $mapStore => $mapStore.isLoading
);

export const mapError: Readable<string | null> = derived(
  mapStore,
  $mapStore => $mapStore.error
);