import { browser } from '$app/environment';
import { PUBLIC_GOOGLE_MAPS_API_KEY } from '$env/static/public';

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

    return this.mapsPromise;
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
   * Get current location with improved error handling
   */
  public async getCurrentLocation(): Promise<google.maps.LatLng> {
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
          const errorMessages = {
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
  }

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
}

// Export singleton instance
export const googleMapsService = GoogleMapsService.getInstance();