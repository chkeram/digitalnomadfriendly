import { browser } from '$app/environment';
import { PUBLIC_GOOGLE_MAPS_API_KEY } from '$env/static/public';
import { apiOptimizer } from '$lib/utils/api-optimization.js';
import { mapsCache, withCache } from '$lib/utils/maps-cache.js';

/**
 * Optimized Google Maps service with streamlined initialization
 * and improved error handling for Svelte 5 integration
 */
export class GoogleMapsService {
  private static instance: GoogleMapsService;
  private mapsPromise: Promise<typeof google.maps> | null = null;
  private isLoaded = false;

  private constructor() {
    // Validate API key early
    if (!PUBLIC_GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key is not configured. Please set PUBLIC_GOOGLE_MAPS_API_KEY in your .env file.');
    }
  }

  public static getInstance(): GoogleMapsService {
    if (!GoogleMapsService.instance) {
      GoogleMapsService.instance = new GoogleMapsService();
    }
    return GoogleMapsService.instance;
  }

  /**
   * Load Google Maps API with optimized configuration
   */
  public async loadMaps(): Promise<typeof google.maps> {
    // SSR safety check
    if (!browser) {
      throw new Error('Google Maps can only be loaded in the browser environment');
    }

    // Return cached result if available
    if (this.isLoaded && window.google?.maps) {
      return window.google.maps;
    }

    // Initialize loading promise only once
    if (!this.mapsPromise) {
      this.mapsPromise = this.initializeMapsAPI();
    }

    const result = await this.mapsPromise;
    
    // Track API usage for cost monitoring
    apiOptimizer.trackUsage('mapLoad');
    
    return result;
  }

  /**
   * Internal method to initialize Google Maps API
   */
  private async initializeMapsAPI(): Promise<typeof google.maps> {
    try {
      // Dynamic import for better bundle splitting
      const { Loader } = await import('@googlemaps/js-api-loader');
      
      const loader = new Loader({
        apiKey: PUBLIC_GOOGLE_MAPS_API_KEY,
        version: 'weekly',
        libraries: ['places', 'geometry'],
        region: 'US',
        language: 'en'
      });

      // Load the API
      await loader.load();
      
      // Validate successful load
      if (!window.google?.maps) {
        throw new Error('Google Maps API failed to initialize properly');
      }

      this.isLoaded = true;
      return window.google.maps;

    } catch (error) {
      // Reset promise to allow retry
      this.mapsPromise = null;
      
      const errorMessage = error instanceof Error 
        ? `Google Maps loading failed: ${error.message}`
        : 'Google Maps loading failed with unknown error';
      
      console.error('GoogleMapsService:', errorMessage, error);
      throw new Error(errorMessage);
    }
  }

  /**
   * Create a map instance with optimized default options
   */
  public async createMap(
    element: HTMLElement,
    options?: google.maps.MapOptions
  ): Promise<google.maps.Map> {
    // Validate element
    if (!element) {
      throw new Error('Map container element is required');
    }

    const maps = await this.loadMaps();
    
    // Optimized default options
    const defaultOptions: google.maps.MapOptions = {
      zoom: 12,
      center: new maps.LatLng(40.7128, -74.0060), // Default NYC
      disableDefaultUI: false,
      mapTypeControl: false,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      gestureHandling: 'cooperative',
      styles: this.getOptimizedMapStyles(),
      ...options
    };

    const map = new maps.Map(element, defaultOptions);
    
    // Trigger resize to ensure proper rendering
    setTimeout(() => {
      maps.event.trigger(map, 'resize');
    }, 100);

    return map;
  }

  /**
   * Get current location with improved error handling and caching
   */
  public getCurrentLocation = withCache(
    async (): Promise<google.maps.LatLng> => {
      if (!browser) {
        throw new Error('Geolocation can only be accessed in the browser');
      }

      const maps = await this.loadMaps();
      
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported by this browser'));
          return;
        }

        const timeoutId = setTimeout(() => {
          reject(new Error('Geolocation request timed out'));
        }, 15000); // 15 second timeout

        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeoutId);
            resolve(new maps.LatLng(position.coords.latitude, position.coords.longitude));
          },
          (error) => {
            clearTimeout(timeoutId);
            const errorMessages: { [key: number]: string } = {
              [error.PERMISSION_DENIED]: 'Location access denied by user',
              [error.POSITION_UNAVAILABLE]: 'Location information unavailable',
              [error.TIMEOUT]: 'Location request timed out'
            };
            const message = errorMessages[error.code] || `Geolocation error: ${error.message}`;
            reject(new Error(message));
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes cache
          }
        );
      });
    },
    () => 'current_location', // Cache key
    1000 * 60 * 5 // 5 minute TTL
  );

  /**
   * Optimized map styles for better performance and appearance
   */
  private getOptimizedMapStyles(): google.maps.MapTypeStyle[] {
    return [
      // Hide unnecessary POI labels to reduce clutter
      {
        featureType: 'poi.business',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      },
      // Hide transit labels
      {
        featureType: 'transit',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }]
      },
      // Reduce road label icons
      {
        featureType: 'road',
        elementType: 'labels.icon',
        stylers: [{ visibility: 'off' }]
      },
      // Subtle water styling
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#e3f2fd' }]
      },
      // Clean landscape
      {
        featureType: 'landscape',
        elementType: 'geometry',
        stylers: [{ color: '#f5f5f5' }]
      }
    ];
  }

  /**
   * Check if Google Maps API is loaded and ready
   */
  public isApiLoaded(): boolean {
    return browser && this.isLoaded && !!window.google?.maps;
  }

  /**
   * Reset the service state (useful for testing or error recovery)
   */
  public reset(): void {
    this.mapsPromise = null;
    this.isLoaded = false;
  }

  /**
   * Get cost optimization stats
   */
  public getCostOptimizationStats() {
    return {
      usage: apiOptimizer.getUsageStats(),
      budget: apiOptimizer.checkBudgetStatus(),
      cache: mapsCache.getStats()
    };
  }

  /**
   * Create optimized geocoding service with caching
   */
  public async createOptimizedGeocodingService() {
    const maps = await this.loadMaps();
    const geocoder = new maps.Geocoder();

    return {
      geocode: withCache(
        async (request: google.maps.GeocoderRequest): Promise<google.maps.GeocoderResult[]> => {
          // Check budget before expensive operation
          if (!apiOptimizer.shouldMakeRequest('geocoding')) {
            throw new Error('Daily API budget exceeded for geocoding');
          }

          return new Promise((resolve, reject) => {
            geocoder.geocode(request, (results, status) => {
              if (status === 'OK' && results) {
                apiOptimizer.trackUsage('geocoding');
                resolve(results);
              } else {
                reject(new Error(`Geocoding failed: ${status}`));
              }
            });
          });
        },
        (request) => `geocode:${JSON.stringify(request)}`,
        1000 * 60 * 60 * 24 // 24h cache for geocoding
      )
    };
  }

  /**
   * Create optimized Places service with session tokens and field masking
   */
  public async createOptimizedPlacesService() {
    const maps = await this.loadMaps();
    const service = new maps.places.PlacesService(document.createElement('div'));

    return {
      getDetails: withCache(
        async (request: google.maps.places.PlaceDetailsRequest): Promise<google.maps.places.PlaceResult> => {
          // Check budget before expensive operation
          if (!apiOptimizer.shouldMakeRequest('placeDetails', request.fields?.length || 1)) {
            throw new Error('Daily API budget exceeded for place details');
          }

          // Optimize request with field masking
          const optimizedRequest = apiOptimizer.optimizePlacesRequest(request, 'VENUE_BASIC');

          return new Promise((resolve, reject) => {
            service.getDetails(optimizedRequest, (place, status) => {
              if (status === maps.places.PlacesServiceStatus.OK && place) {
                apiOptimizer.trackUsage('placeDetails', 1, optimizedRequest.fields?.length || 1);
                resolve(place);
              } else {
                reject(new Error(`Places service failed: ${status}`));
              }
            });
          });
        },
        (request) => `place_details:${request.placeId}:${request.fields?.join(',') || 'default'}`,
        1000 * 60 * 60 * 6 // 6h cache for place details
      )
    };
  }
}

// Export singleton instance
export const googleMapsService = GoogleMapsService.getInstance();