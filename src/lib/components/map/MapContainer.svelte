<script lang="ts">
  import { browser } from '$app/environment';
  import { googleMapsService } from '$lib/services/maps.js';
  import { mapStore, locationStore } from '$lib/stores';
  import { mapErrorBoundary } from '$lib/utils/error-boundary.js';
  import type { LocationCoords } from '$lib/types';

  // Props using Svelte 5 runes
  interface Props {
    center?: LocationCoords | null;
    zoom?: number;
    height?: string;
    width?: string;
    className?: string;
    enableCurrentLocation?: boolean;
  }
  
  const {
    center = null,
    zoom = 12,
    height = '400px',
    width = '100%',
    className = '',
    enableCurrentLocation = true
  }: Props = $props();

  // State using Svelte 5 runes
  let mapContainer: HTMLDivElement;
  let map = $state<google.maps.Map | null>(null);
  let isInitialized = $state(false);
  let error = $state<string | null>(null);
  let isLoading = $state(false);

  // Map initialization with $effect - wait for DOM element to be bound
  $effect(() => {
    if (!browser) return;
    
    // Check if mapContainer is available and has dimensions
    if (mapContainer && mapContainer.offsetWidth > 0) {
      console.log('$effect triggered - DOM ready, initializing map');
      initializeMap();
    }

    // Cleanup function
    return () => {
      if (map) {
        console.log('Cleaning up map instance');
        google.maps.event.clearInstanceListeners(map);
      }
    };
  });

  // Center change effect
  $effect(() => {
    if (map && center) {
      console.log('Updating map center:', center);
      map.setCenter(new google.maps.LatLng(center.lat, center.lng));
    }
  });

  // Zoom change effect
  $effect(() => {
    if (map && zoom) {
      console.log('Updating map zoom:', zoom);
      map.setZoom(zoom);
    }
  });

  async function initializeMap() {
    if (isInitialized || !mapContainer) {
      console.log('Skipping initialization - isInitialized:', isInitialized, 'mapContainer:', !!mapContainer);
      return;
    }

    // Wrap initialization in error boundary
    const safeInitialize = mapErrorBoundary.wrapAsync(async () => {
      console.log('Starting map initialization...');
      console.log('mapContainer element:', mapContainer);
      console.log('mapContainer dimensions:', mapContainer.offsetWidth, 'x', mapContainer.offsetHeight);
      
      isLoading = true;
      error = null;
      mapStore.setLoading(true);
      mapStore.clearError();

      // Load Google Maps API
      const maps = await googleMapsService.loadMaps();
      console.log('Google Maps API loaded successfully');

      // Set up map center - always provide a default
      const mapCenter = center 
        ? new maps.LatLng(center.lat, center.lng)
        : new maps.LatLng(40.7128, -74.0060); // Default NYC

      // Create map with minimal, reliable options
      const mapOptions: google.maps.MapOptions = {
        center: mapCenter,
        zoom: zoom,
        mapTypeControl: false,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        gestureHandling: 'cooperative'
      };

      console.log('Creating map with options:', mapOptions);
      console.log('About to create map with element:', mapContainer);
      
      // Ensure mapContainer is not null before passing to Google Maps
      if (!mapContainer) {
        throw new Error('mapContainer is null before map creation');
      }
      
      map = new maps.Map(mapContainer, mapOptions);
      console.log('Map created successfully:', map);

      // Update stores
      mapStore.setMap(map);
      isInitialized = true;
      isLoading = false;

      // Get current location if enabled and no center provided
      if (enableCurrentLocation && !center) {
        getCurrentLocation();
      }

      return map;
    }, 'MapContainer.initializeMap');

    try {
      await safeInitialize();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize map';
      console.error('Map initialization failed:', err);
      error = errorMessage;
      isLoading = false;
      mapStore.setError(errorMessage);
    }
  }

  async function getCurrentLocation() {
    if (!enableCurrentLocation) return;

    const safeGetLocation = mapErrorBoundary.wrapAsync(async () => {
      console.log('Getting current location...');
      locationStore.setLoading(true);
      locationStore.clearError();

      const location = await googleMapsService.getCurrentLocation();
      const coords: LocationCoords = {
        lat: location.lat(),
        lng: location.lng()
      };

      console.log('Current location obtained:', coords);
      locationStore.setCurrentLocation(coords);
      locationStore.setPermissionStatus('granted');

      // Pan to current location if no center was provided
      if (map && !center) {
        map.panTo(location);
      }

      return coords;
    }, 'MapContainer.getCurrentLocation');

    try {
      await safeGetLocation();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get current location';
      console.warn('Geolocation error:', err);
      locationStore.setError(errorMessage);
      locationStore.setPermissionStatus('denied');
    }
  }

  function retry() {
    console.log('Retrying map initialization...');
    isInitialized = false;
    map = null;
    error = null;
    initializeMap();
  }
</script>

<div class="map-wrapper {className}" style="width: {width}; height: {height};">
  <!-- Always render the map container so it can be bound -->
  <div
    bind:this={mapContainer}
    class="map-container"
    style="width: 100%; height: 100%; min-height: 300px;"
  ></div>

  <!-- Overlay loading state -->
  {#if isLoading}
    <div class="map-loading overlay">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading map...</p>
    </div>
  {/if}

  <!-- Overlay error state -->
  {#if error}
    <div class="map-error overlay">
      <div class="error-icon">⚠️</div>
      <p class="error-message">{error}</p>
      <button class="retry-button" onclick={retry}>
        Retry
      </button>
    </div>
  {/if}

  <!-- Location loading indicator -->
  {#if enableCurrentLocation && $locationStore.isLoading}
    <div class="location-loading">
      <div class="location-spinner"></div>
    </div>
  {/if}
</div>

<style>
  .map-wrapper {
    position: relative;
    border-radius: 0.5rem;
    overflow: hidden;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    background-color: #f9fafb;
  }

  .map-container {
    border-radius: inherit;
    display: block;
  }

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: rgba(249, 250, 251, 0.95);
    border: 2px dashed #d1d5db;
    border-radius: 0.5rem;
    z-index: 10;
  }

  .map-loading,
  .map-error {
    width: 100%;
    height: 100%;
  }

  .loading-spinner {
    width: 2rem;
    height: 2rem;
    border: 3px solid #e5e7eb;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 0.5rem;
  }

  .loading-text {
    color: #6b7280;
    font-size: 0.875rem;
    margin: 0;
  }

  .error-icon {
    font-size: 2rem;
    margin-bottom: 0.5rem;
  }

  .error-message {
    color: #dc2626;
    font-size: 0.875rem;
    text-align: center;
    margin: 0 0 1rem 0;
    max-width: 80%;
  }

  .retry-button {
    background-color: #3b82f6;
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .retry-button:hover {
    background-color: #2563eb;
  }

  .location-loading {
    position: absolute;
    top: 1rem;
    right: 1rem;
    background-color: white;
    border-radius: 0.375rem;
    padding: 0.5rem;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  }

  .location-spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .map-wrapper {
      border-radius: 0.25rem;
      min-height: 250px;
    }
    
    .map-container {
      min-height: 250px;
    }
    
    .loading-text,
    .error-message {
      font-size: 0.75rem;
    }
    
    .location-loading {
      top: 0.5rem;
      right: 0.5rem;
      padding: 0.375rem;
    }
    
    .location-spinner {
      width: 0.875rem;
      height: 0.875rem;
    }
  }

  /* Tablet responsiveness */
  @media (max-width: 1024px) and (min-width: 769px) {
    .map-wrapper {
      min-height: 350px;
    }
    
    .map-container {
      min-height: 350px;
    }
  }

  /* Desktop large screens */
  @media (min-width: 1280px) {
    .map-wrapper {
      border-radius: 0.75rem;
    }
  }

  /* High DPI displays */
  @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 2dppx) {
    .loading-spinner,
    .location-spinner {
      border-width: 0.5px;
    }
  }

  /* Reduced motion preference */
  @media (prefers-reduced-motion: reduce) {
    .loading-spinner,
    .location-spinner {
      animation: none;
    }
    
    .retry-button {
      transition: none;
    }
  }

  /* Print styles */
  @media print {
    .map-wrapper {
      border: 1px solid #d1d5db;
      box-shadow: none;
    }
    
    .overlay {
      display: none;
    }
  }
</style>