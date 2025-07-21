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

// Map state store
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
    setMap: (map: google.maps.Map) => update(state => ({
      ...state,
      map,
      isLoaded: true,
      isLoading: false,
      error: null
    })),
    setCenter: (center: LocationCoords) => update(state => ({
      ...state,
      center
    })),
    setZoom: (zoom: number) => update(state => ({
      ...state,
      zoom
    })),
    setBounds: (bounds: google.maps.LatLngBounds) => update(state => ({
      ...state,
      bounds
    })),
    setViewport: (viewport: MapViewport) => update(state => ({
      ...state,
      center: viewport.center,
      zoom: viewport.zoom,
      bounds: viewport.bounds
    })),
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