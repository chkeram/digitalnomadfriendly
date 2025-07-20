import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn()
};

Object.defineProperty(globalThis.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true
});

// Mock Google Maps API
(globalThis as any).google = {
  maps: {
    Map: vi.fn(),
    Marker: vi.fn(),
    InfoWindow: vi.fn(),
    places: {
      PlacesService: vi.fn(),
      AutocompleteService: vi.fn()
    }
  }
};