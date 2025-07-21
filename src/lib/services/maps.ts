import { Loader } from '@googlemaps/js-api-loader';
import { PUBLIC_GOOGLE_MAPS_API_KEY } from '$env/static/public';

export class GoogleMapsService {
  private static instance: GoogleMapsService;
  private loader: Loader;
  private mapsPromise: Promise<typeof google.maps> | null = null;
  private isLoaded = false;

  private constructor() {
    if (!PUBLIC_GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key is not configured');
    }

    this.loader = new Loader({
      apiKey: PUBLIC_GOOGLE_MAPS_API_KEY,
      version: 'weekly',
      libraries: ['places', 'geometry'],
      region: 'US',
      language: 'en'
    });
  }

  public static getInstance(): GoogleMapsService {
    if (!GoogleMapsService.instance) {
      GoogleMapsService.instance = new GoogleMapsService();
    }
    return GoogleMapsService.instance;
  }

  public async loadMaps(): Promise<typeof google.maps> {
    if (this.isLoaded && window.google?.maps) {
      return window.google.maps;
    }

    if (!this.mapsPromise) {
      this.mapsPromise = this.loader.load().then(() => {
        this.isLoaded = true;
        return window.google.maps;
      });
    }

    return this.mapsPromise;
  }

  public async createMap(
    element: HTMLElement,
    options?: google.maps.MapOptions
  ): Promise<google.maps.Map> {
    const maps = await this.loadMaps();
    
    const defaultOptions: google.maps.MapOptions = {
      zoom: 12,
      center: { lat: 40.7128, lng: -74.0060 }, // Default to NYC
      mapTypeControl: false,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      styles: this.getCustomMapStyles(),
      ...options
    };

    return new maps.Map(element, defaultOptions);
  }

  private getCustomMapStyles(): google.maps.MapTypeStyle[] {
    // Custom styling for a clean, modern look
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
    return this.isLoaded && !!window.google?.maps;
  }
}

// Export singleton instance
export const googleMapsService = GoogleMapsService.getInstance();