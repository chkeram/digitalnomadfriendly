import { writable, derived, type Readable } from 'svelte/store';
import type { LocationCoords } from '$lib/types';

export interface LocationState {
  currentLocation: LocationCoords | null;
  permissionStatus: 'prompt' | 'granted' | 'denied' | 'unsupported';
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// Location state store
function createLocationStore() {
  const initialState: LocationState = {
    currentLocation: null,
    permissionStatus: 'prompt',
    isLoading: false,
    error: null,
    lastUpdated: null
  };

  const { subscribe, set, update } = writable<LocationState>(initialState);

  return {
    subscribe,
    setCurrentLocation: (location: LocationCoords) => update(state => ({
      ...state,
      currentLocation: location,
      error: null,
      lastUpdated: new Date(),
      isLoading: false
    })),
    setPermissionStatus: (status: LocationState['permissionStatus']) => update(state => ({
      ...state,
      permissionStatus: status
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

export const locationStore = createLocationStore();

// Derived stores for convenience
export const currentLocation: Readable<LocationCoords | null> = derived(
  locationStore,
  $locationStore => $locationStore.currentLocation
);

export const isLocationLoading: Readable<boolean> = derived(
  locationStore,
  $locationStore => $locationStore.isLoading
);

export const locationError: Readable<string | null> = derived(
  locationStore,
  $locationStore => $locationStore.error
);

export const hasLocationPermission: Readable<boolean> = derived(
  locationStore,
  $locationStore => $locationStore.permissionStatus === 'granted'
);