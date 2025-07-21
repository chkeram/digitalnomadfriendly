import { browser } from '$app/environment';
import { PUBLIC_GOOGLE_MAPS_API_KEY } from '$env/static/public';

export class GoogleMapsService {
  private static instance: GoogleMapsService;
  private loader: any = null;
  private mapsPromise: Promise<typeof google.maps> | null = null;
  private isLoaded = false;

  private constructor() {
    if (!PUBLIC_GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key is not configured');
    }
  }

  public static getInstance(): GoogleMapsService {
    if (!GoogleMapsService.instance) {
      GoogleMapsService.instance = new GoogleMapsService();
    }
    return GoogleMapsService.instance;
  }

  private async initializeLoader() {
    if (this.loader || !browser) return;
    
    try {
      const { Loader } = await import('@googlemaps/js-api-loader');
      this.loader = new Loader({
        apiKey: PUBLIC_GOOGLE_MAPS_API_KEY,
        version: 'weekly',
        libraries: ['places', 'geometry'],
        region: 'US',
        language: 'en'
      });
    } catch (error) {
      console.error('Failed to initialize Google Maps loader:', error);
      throw new Error('Failed to load Google Maps API');
    }
  }

  public async loadMaps(): Promise<typeof google.maps> {
    if (!browser) {
      throw new Error('Google Maps can only be loaded in the browser');
    }

    if (this.isLoaded && window.google?.maps) {
      return window.google.maps;
    }

    if (!this.mapsPromise) {
      await this.initializeLoader();
      
      if (!this.loader) {
        throw new Error('Failed to initialize Google Maps loader');
      }

      this.mapsPromise = this.loader.load().then(() => {
        this.isLoaded = true;
        if (!window.google?.maps) {
          throw new Error('Google Maps failed to load properly');
        }
        return window.google.maps;
      }).catch((error: Error) => {
        console.error('Google Maps API load failed:', error);
        throw error;
      });
    }

    const result = await this.mapsPromise;
    if (!result) {
      throw new Error('Google Maps failed to initialize');
    }
    return result;
  }

  public async createMap(
    element: HTMLElement,
    options?: google.maps.MapOptions
  ): Promise<google.maps.Map> {
    const maps = await this.loadMaps();
    
    const defaultOptions: google.maps.MapOptions = {
      zoom: 12,
      center: new maps.LatLng(40.7128, -74.0060), // Default to NYC
      mapTypeControl: false,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      styles: this.getCustomMapStyles(),
      ...options
    };

    const map = new maps.Map(element, defaultOptions);
    
    // Ensure proper initialization
    setTimeout(() => {
      maps.event.trigger(map, 'resize');
    }, 100);

    return map;
  }

  private getCustomMapStyles(): google.maps.MapTypeStyle[] {
    return [
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
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#e9e9e9' }, { lightness: 17 }]
      },
      {
        featureType: 'landscape',
        elementType: 'geometry',
        stylers: [{ color: '#f5f5f5' }, { lightness: 20 }]
      }
    ];
  }

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

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve(new maps.LatLng(position.coords.latitude, position.coords.longitude));
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  public isApiLoaded(): boolean {
    return browser && this.isLoaded && !!window.google?.maps;
  }
}

// Export singleton instance
export const googleMapsService = GoogleMapsService.getInstance();