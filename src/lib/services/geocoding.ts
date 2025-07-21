import { googleMapsService } from './maps.js';
import type { LocationCoords } from '$lib/types';

export interface GeocodingResult {
  formatted_address: string;
  geometry: {
    location: LocationCoords;
  };
  place_id: string;
  types: string[];
}

export class GeocodingService {
  private geocoder: google.maps.Geocoder | null = null;
  private cache = new Map<string, GeocodingResult[]>();
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  private async getGeocoder(): Promise<google.maps.Geocoder> {
    if (!this.geocoder) {
      await googleMapsService.loadMaps();
      this.geocoder = new google.maps.Geocoder();
    }
    return this.geocoder;
  }

  private getCacheKey(query: string): string {
    return `geocoding_${query.toLowerCase().trim()}`;
  }

  private isValidCache(timestamp: number): boolean {
    return Date.now() - timestamp < this.CACHE_DURATION;
  }

  public async geocodeAddress(address: string): Promise<GeocodingResult[]> {
    const cacheKey = this.getCacheKey(address);
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const geocoder = await this.getGeocoder();
      
      const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode(
          { 
            address,
            componentRestrictions: { country: 'US' } // Can be made configurable
          },
          (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results) {
              resolve(results);
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          }
        );
      });

      const mappedResults: GeocodingResult[] = result.map((item) => ({
        formatted_address: item.formatted_address,
        geometry: {
          location: {
            lat: item.geometry.location.lat(),
            lng: item.geometry.location.lng()
          }
        },
        place_id: item.place_id,
        types: item.types
      }));

      // Cache the result
      this.cache.set(cacheKey, mappedResults);
      
      return mappedResults;
    } catch (error) {
      console.error('Geocoding error:', error);
      throw error;
    }
  }

  public async reverseGeocode(location: LocationCoords): Promise<GeocodingResult[]> {
    const cacheKey = this.getCacheKey(`${location.lat},${location.lng}`);
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const geocoder = await this.getGeocoder();
      const latLng = new google.maps.LatLng(location.lat, location.lng);
      
      const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
        geocoder.geocode(
          { location: latLng },
          (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results) {
              resolve(results);
            } else {
              reject(new Error(`Reverse geocoding failed: ${status}`));
            }
          }
        );
      });

      const mappedResults: GeocodingResult[] = result.map((item) => ({
        formatted_address: item.formatted_address,
        geometry: {
          location: {
            lat: item.geometry.location.lat(),
            lng: item.geometry.location.lng()
          }
        },
        place_id: item.place_id,
        types: item.types
      }));

      // Cache the result
      this.cache.set(cacheKey, mappedResults);
      
      return mappedResults;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw error;
    }
  }

  public clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const geocodingService = new GeocodingService();