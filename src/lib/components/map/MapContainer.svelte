<script lang="ts">
  import { browser } from '$app/environment';
  import { googleMapsService } from '$lib/services/maps.js';
  import { placesService, type Venue } from '$lib/services/places.js';
  import { mapStore, locationStore } from '$lib/stores';
  import { mapErrorBoundary } from '$lib/utils/error-boundary.js';
  import VenueMarker from './VenueMarker.svelte';
  import VenueInfoWindow from './VenueInfoWindow.svelte';
  import type { LocationCoords } from '$lib/types';

  // Props using Svelte 5 runes
  interface Props {
    center?: LocationCoords | null;
    zoom?: number;
    height?: string;
    width?: string;
    className?: string;
    enableCurrentLocation?: boolean;
    showVenues?: boolean;
    venueSearchRadius?: number;
    venueTypeFilter?: string[];
    searchQuery?: string;
    minRating?: number;
    maxPriceLevel?: number;
  }
  
  const {
    center = null,
    zoom = 12,
    height = '400px',
    width = '100%',
    className = '',
    enableCurrentLocation = true,
    showVenues = false,
    venueSearchRadius = 2000,
    venueTypeFilter = undefined,
    searchQuery = undefined,
    minRating = undefined,
    maxPriceLevel = undefined
  }: Props = $props();

  // State using Svelte 5 runes
  let mapContainer: HTMLDivElement;
  let map = $state<google.maps.Map | null>(null);
  let isInitialized = $state(false);
  let error = $state<string | null>(null);
  let isLoading = $state(false);

  // Venue-related state
  let venues = $state<Venue[]>([]);
  let filteredVenues = $state<Venue[]>([]);
  let selectedVenue = $state<Venue | null>(null);
  let isLoadingVenues = $state(false);
  let venueSearchLocation = $state<LocationCoords | null>(null);
  let isMarkerPan = $state(false); // Track if pan is from marker selection

  // Map initialization with $effect - wait for DOM element to be bound
  $effect(() => {
    if (!browser) return;
    
    // Check if mapContainer is available and has dimensions
    if (mapContainer && mapContainer.offsetWidth > 0) {
      console.log('🗺️ Initializing Google Maps...');
      initializeMap();
    }

    // Cleanup function
    return () => {
      if (map) {
        console.log('🧹 Cleaning up map resources');
        google.maps.event.clearInstanceListeners(map);
      }
    };
  });

  // Center change effect
  $effect(() => {
    if (map && center) {
      map.setCenter(new google.maps.LatLng(center.lat, center.lng));
    }
  });

  // Zoom change effect
  $effect(() => {
    if (map && zoom) {
      map.setZoom(zoom);
    }
  });

  async function initializeMap() {
    if (isInitialized || !mapContainer) {
      return;
    }

    // Wrap initialization in error boundary
    const safeInitialize = mapErrorBoundary.wrapAsync(async () => {
      console.log('🚀 Starting map initialization...');
      
      isLoading = true;
      error = null;

      // Load Google Maps API
      const maps = await googleMapsService.loadMaps();
      console.log('✅ Google Maps API loaded');

      // Set up map center - always provide a default
      const mapCenter = center 
        ? new maps.LatLng(center.lat, center.lng)
        : new maps.LatLng(40.7128, -74.0060); // Default NYC

      // Create map with minimal, reliable options including Map ID for Advanced Markers
      const mapOptions: google.maps.MapOptions = {
        center: mapCenter,
        zoom: zoom,
        mapTypeControl: false,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        gestureHandling: 'cooperative',
        mapId: 'DEMO_MAP_ID' // Required for Advanced Markers
      };

      // Create map instance
      
      // Ensure mapContainer is not null before passing to Google Maps
      if (!mapContainer) {
        throw new Error('mapContainer is null before map creation');
      }
      
      map = new maps.Map(mapContainer, mapOptions);
      console.log('🗺️ Map instance created successfully');

      // Update local state
      isInitialized = true;
      isLoading = false;

      // Get current location if enabled and no center provided
      if (enableCurrentLocation && !center) {
        // Use setTimeout to avoid updating stores within effect
        setTimeout(() => getCurrentLocation(), 0);
      }

      // Search for venues if enabled
      if (showVenues) {
        const searchCenter = center || (await getCurrentLocationCoords());
        if (searchCenter) {
          searchNearbyVenues(searchCenter);
        }
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
    }
  }

  async function getCurrentLocation() {
    if (!enableCurrentLocation) return;

    const safeGetLocation = mapErrorBoundary.wrapAsync(async () => {
      console.log('📍 Getting current location...');

      const location = await googleMapsService.getCurrentLocation();
      const coords: LocationCoords = {
        lat: location.lat,
        lng: location.lng
      };

      console.log('✅ Location detected');

      // Pan to current location if no center was provided
      if (map && !center) {
        map.panTo(new google.maps.LatLng(coords.lat, coords.lng));
      }

      return coords;
    }, 'MapContainer.getCurrentLocation');

    try {
      await safeGetLocation();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get current location';
      console.warn('Geolocation error:', err);
      // Use setTimeout to avoid updating stores within effect
      setTimeout(() => {
        locationStore.setError(errorMessage);
        locationStore.setPermissionStatus('denied');
      }, 0);
    }
  }

  async function getCurrentLocationCoords(): Promise<LocationCoords | null> {
    try {
      const location = await googleMapsService.getCurrentLocation();
      return {
        lat: location.lat,
        lng: location.lng
      };
    } catch (error) {
      console.warn('Could not get current location for venue search:', error);
      return null;
    }
  }

  async function searchNearbyVenues(searchLocation: LocationCoords) {
    if (isLoadingVenues) return;

    try {
      isLoadingVenues = true;
      venueSearchLocation = searchLocation;

      let foundVenues: Venue[] = [];

      // If there's a search query, use text search
      if (searchQuery && searchQuery.trim()) {
        console.log(`🔍 Text search: "${searchQuery}"`);
        foundVenues = await placesService.searchVenuesByText(searchQuery, searchLocation);
      } else {
        // Use nearby search with type filters
        const searchTypes = venueTypeFilter && venueTypeFilter.length > 0 
          ? venueTypeFilter 
          : ['cafe', 'restaurant', 'library'];
        
        console.log(`📍 Nearby search with types: ${searchTypes.join(', ')}`);
        foundVenues = await placesService.searchNearbyVenues({
          location: searchLocation,
          radius: venueSearchRadius,
          types: searchTypes
        });
      }

      venues = foundVenues;
      console.log(`🎯 Found ${foundVenues.length} venues`);

    } catch (error) {
      console.error('Venue search failed:', error);
      // Don't show venue search errors to user, just log them
    } finally {
      isLoadingVenues = false;
    }
  }

  // Venue marker event handlers
  function handleMarkerClick(event: CustomEvent<{ venueId: string; position: LocationCoords }>) {
    const { venueId } = event.detail;
    const venue = filteredVenues.find(v => v.id === venueId);
    if (venue) {
      selectedVenue = selectedVenue?.id === venueId ? null : venue;
      
      // Center map on selected venue with marker pan flag
      if (map && selectedVenue) {
        isMarkerPan = true; // Set flag before panning
        map.panTo(new google.maps.LatLng(venue.position.lat, venue.position.lng));
        
        // Reset flag after a short delay
        setTimeout(() => {
          isMarkerPan = false;
        }, 1000);
      }
    }
  }

  function handleMarkerHover(event: CustomEvent<{ venueId: string; position: LocationCoords }>) {
    // Could implement hover effects here
  }

  // Apply client-side filtering to venues
  function applyVenueFilters(venues: Venue[]): Venue[] {
    return venues.filter(venue => {
      // Filter by venue types if specified
      if (venueTypeFilter && venueTypeFilter.length > 0) {
        if (!venueTypeFilter.includes(venue.venueType)) {
          return false;
        }
      }

      // Filter by minimum rating
      if (minRating !== undefined && minRating > 0) {
        if (!venue.rating || venue.rating < minRating) {
          return false;
        }
      }

      // Filter by maximum price level
      if (maxPriceLevel !== undefined && maxPriceLevel < 4) {
        if (venue.priceLevel && venue.priceLevel > maxPriceLevel) {
          return false;
        }
      }

      return true;
    });
  }

  // Effect to update filtered venues when venues or filters change
  $effect(() => {
    filteredVenues = applyVenueFilters(venues);
    console.log(`🔧 Applied filters: ${venues.length} → ${filteredVenues.length} venues`);
  });

  // Trigger search when search parameters change - moved to discrete function calls
  function handleSearchParameterChange() {
    if (!showVenues || !map) return;

    // Get current map center for search
    const currentCenter = map?.getCenter();
    if (!currentCenter) return;

    const searchCenter: LocationCoords = {
      lat: currentCenter.lat(),
      lng: currentCenter.lng()
    };

    console.log(`🔄 Search parameters changed - triggering new search`);
    searchNearbyVenues(searchCenter);
  }

  // Watch for search parameter changes without using $effect
  $effect(() => {
    if (showVenues && map && (searchQuery || (venueTypeFilter && venueTypeFilter.length > 0))) {
      // Use setTimeout to break the reactive cycle and avoid infinite loops
      setTimeout(() => handleSearchParameterChange(), 100);
    }
  });

  // Effect to search venues when map viewport changes significantly
  $effect(() => {
    if (!showVenues || !map || isLoadingVenues) return;

    // Listen for significant map changes (idle after zoom/pan)
    const listener = map?.addListener('idle', () => {
      // Skip venue search if this is just a marker pan
      if (isMarkerPan) return;
      
      const currentCenter = map?.getCenter();
      if (!currentCenter) return;

      const newCenter: LocationCoords = {
        lat: currentCenter.lat(),
        lng: currentCenter.lng()
      };

      // Only search if we've moved significantly from last search location
      if (!venueSearchLocation || getDistance(newCenter, venueSearchLocation) > 1000) { // 1km threshold
        console.log(`🔄 Map moved ${venueSearchLocation ? getDistance(newCenter, venueSearchLocation).toFixed(0) + 'm' : 'initial'} - searching for venues`);
        // Use setTimeout to avoid infinite loops
        setTimeout(() => searchNearbyVenues(newCenter), 0);
      }
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  });

  function getDistance(pos1: LocationCoords, pos2: LocationCoords): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = pos1.lat * Math.PI/180;
    const φ2 = pos2.lat * Math.PI/180;
    const Δφ = (pos2.lat-pos1.lat) * Math.PI/180;
    const Δλ = (pos2.lng-pos1.lng) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  function retry() {
    console.log('🔄 Retrying map initialization...');
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

  <!-- Venue markers -->
  {#if showVenues}
    {#each filteredVenues as venue (venue.id)}
      <VenueMarker
        position={venue.position}
        title={venue.name}
        venueId={venue.id}
        venueType={venue.venueType}
        rating={venue.rating}
        isSelected={selectedVenue?.id === venue.id}
        {map}
        on:markerClick={handleMarkerClick}
        on:markerHover={handleMarkerHover}
      />
    {/each}
  {/if}

  <!-- Venue InfoWindow -->
  {#if showVenues}
    <VenueInfoWindow
      venue={selectedVenue}
      {map}
      isVisible={selectedVenue !== null}
    />
  {/if}

  <!-- Venues loading indicator -->
  {#if isLoadingVenues}
    <div class="venues-loading">
      <div class="venues-spinner"></div>
      <span class="venues-loading-text">Finding venues...</span>
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

  .venues-loading {
    position: absolute;
    top: 1rem;
    left: 1rem;
    background-color: white;
    border-radius: 0.375rem;
    padding: 0.5rem 0.75rem;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    z-index: 10;
  }

  .venues-spinner {
    width: 1rem;
    height: 1rem;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #8b5cf6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .venues-loading-text {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
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