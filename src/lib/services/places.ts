import { browser } from '$app/environment';
import { googleMapsService } from './maps.js';
import { apiOptimizer, OPTIMIZED_FIELD_MASKS } from '$lib/utils/api-optimization.js';
import { mapsCache, withCache } from '$lib/utils/maps-cache.js';
import type { LocationCoords } from '$lib/types';

/**
 * Venue interface for our application
 */
export interface Venue {
  id: string;
  name: string;
  address: string;
  position: LocationCoords;
  venueType: 'cafe' | 'coworking' | 'library' | 'restaurant' | 'other';
  rating?: number;
  reviewCount?: number;
  priceLevel?: number;
  isOpen?: boolean;
  openingHours?: string[];
  photos?: string[];
  website?: string;
  phone?: string;
  amenities?: string[];
  description?: string;
  placeId?: string;
}

/**
 * Search filters for venue discovery
 */
export interface VenueSearchOptions {
  location: LocationCoords;
  radius: number; // in meters
  types?: string[];
  keyword?: string;
  minRating?: number;
  priceLevel?: number[];
  openNow?: boolean;
}

/**
 * Modern Places API service using the new google.maps.places.Place API
 * with cost management and performance optimization
 */
export class PlacesService {
  private static instance: PlacesService;
  private placesLibrary: any = null;

  private constructor() {}

  public static getInstance(): PlacesService {
    if (!PlacesService.instance) {
      PlacesService.instance = new PlacesService();
    }
    return PlacesService.instance;
  }

  /**
   * Initialize Places library (new API)
   */
  private async initializeServices(): Promise<void> {
    if (!browser) return;

    if (!this.placesLibrary) {
      // Load the new Places API library
      this.placesLibrary = await google.maps.importLibrary("places");
    }
  }

  /**
   * Search for venues near a location using the new Places API
   */
  public searchNearbyVenues = withCache(
    async (options: VenueSearchOptions): Promise<Venue[]> => {
      await this.initializeServices();
      
      // Check budget before expensive operation
      if (!apiOptimizer.shouldMakeRequest('placesSearch')) {
        throw new Error('Daily API budget exceeded for places search');
      }

      const { location, radius, types = ['cafe', 'restaurant'], keyword, openNow } = options;

      try {
        // Use the new searchNearby method
        const request = {
          fields: apiOptimizer.getOptimizedFields('VENUE_BASIC'),
          locationRestriction: {
            center: { lat: location.lat, lng: location.lng },
            radius: radius
          },
          includedTypes: types,
          maxResultCount: 20,
          // Remove isOpenNow for now as it's not supported in the current API structure
          ...(keyword && { keyword: keyword })
        };

        const { places } = await this.placesLibrary.Place.searchNearby(request);
        
        console.log(`📍 Found ${places?.length || 0} venues from Google Places API`);
        
        // Track API usage
        apiOptimizer.trackUsage('placesSearch');
        
        // Convert to our venue format
        const venues = places
          .filter((place: any) => place.id && place.location)
          .map((place: any) => this.convertNewPlaceToVenue(place))
          .filter((venue: Venue | null) => venue !== null) as Venue[];

        console.log(`🏢 Successfully converted ${venues.length} venues`);
        return venues;
        
      } catch (error) {
        console.error('Places search error:', error);
        throw new Error(`Places search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    (options) => `venues_nearby_new:${options.location.lat.toFixed(3)},${options.location.lng.toFixed(3)}:${options.radius}:${options.types?.join(',') || 'default'}:${options.keyword || ''}`,
    1000 * 60 * 60 // 60 minutes cache - longer cache for venue searches
  );

  /**
   * Get detailed venue information using new Places API
   */
  public getVenueDetails = withCache(
    async (placeId: string): Promise<Venue | null> => {
      await this.initializeServices();

      // Check budget before expensive operation
      if (!apiOptimizer.shouldMakeRequest('placeDetails')) {
        throw new Error('Daily API budget exceeded for place details');
      }

      try {
        // Use the new fetchFields method
        const place = new this.placesLibrary.Place({
          id: placeId,
          requestedLanguage: 'en'
        });

        const fields = apiOptimizer.getOptimizedFields('VENUE_FULL');
        await place.fetchFields({ fields });

        // Track API usage with field count
        apiOptimizer.trackUsage('placeDetails', 1, fields.length || 1);
        
        const venue = this.convertNewPlaceToVenue(place);
        return venue;
        
      } catch (error) {
        console.error('Place details error:', error);
        throw new Error(`Place details failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    (placeId) => `venue_details_new:${placeId}`,
    1000 * 60 * 60 * 6 // 6 hours cache
  );

  /**
   * Search venues by text query using new Places API
   */
  public searchVenuesByText = withCache(
    async (query: string, location?: LocationCoords): Promise<Venue[]> => {
      await this.initializeServices();

      // Check budget before expensive operation  
      if (!apiOptimizer.shouldMakeRequest('placesSearch')) {
        throw new Error('Daily API budget exceeded for text search');
      }

      try {
        // Use the new searchByText method
        const request = {
          textQuery: query,
          fields: apiOptimizer.getOptimizedFields('VENUE_BASIC'),
          locationBias: location ? {
            center: { lat: location.lat, lng: location.lng },
            radius: 10000 // 10km radius
          } : undefined,
          maxResultCount: 20
        };

        const { places } = await this.placesLibrary.Place.searchByText(request);
        
        // Track API usage
        apiOptimizer.trackUsage('placesSearch');
        
        const venues = places
          .filter((place: any) => place.id && place.location)
          .map((place: any) => this.convertNewPlaceToVenue(place))
          .filter((venue: Venue | null) => venue !== null) as Venue[];

        return venues;
        
      } catch (error) {
        console.error('Text search error:', error);
        throw new Error(`Text search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    (query, location) => `venues_text_new:${query.toLowerCase()}:${location ? `${location.lat.toFixed(2)},${location.lng.toFixed(2)}` : 'global'}`,
    1000 * 60 * 15 // 15 minutes cache for text search
  );

  /**
   * Get autocomplete predictions using new Places API (Note: this is a simplified version)
   * The new API doesn't have direct autocomplete, so we'll use searchByText with partial queries
   */
  public getVenueAutocompletePredictions = withCache(
    async (input: string, location?: LocationCoords): Promise<any[]> => {
      await this.initializeServices();

      // Check budget before operation
      if (!apiOptimizer.shouldMakeRequest('autocomplete')) {
        throw new Error('Daily API budget exceeded for autocomplete');
      }

      if (input.length < 3) {
        return []; // Don't search for very short queries
      }

      try {
        // Use searchByText for autocomplete-like functionality
        const request = {
          textQuery: input,
          fields: apiOptimizer.getOptimizedFields('AUTOCOMPLETE'),
          locationBias: location ? {
            center: { lat: location.lat, lng: location.lng },
            radius: 50000 // 50km radius
          } : undefined,
          maxResultCount: 10
        };

        const { places } = await this.placesLibrary.Place.searchByText(request);
        
        // Track API usage
        apiOptimizer.trackUsage('autocomplete');
        
        // Convert to autocomplete-like format
        const predictions = places.map((place: any) => ({
          place_id: place.id,
          description: place.formattedAddress || place.displayName?.text || '',
          structured_formatting: {
            main_text: place.displayName?.text || '',
            secondary_text: place.formattedAddress || ''
          }
        }));

        return predictions;
        
      } catch (error) {
        console.error('Autocomplete error:', error);
        return [];
      }
    },
    (input, location) => `autocomplete_new:${input.toLowerCase()}:${location ? `${location.lat.toFixed(2)},${location.lng.toFixed(2)}` : 'global'}`,
    1000 * 60 * 30 // 30 minutes cache
  );

  /**
   * Convert new Places API result to our Venue interface
   */
  private convertNewPlaceToVenue(place: any): Venue | null {
    
    if (!place.id || !place.location) {
      console.warn('Place missing id or location:', { id: place.id, location: place.location });
      return null;
    }

    let position: LocationCoords;
    try {
      // Handle different location formats
      if (typeof place.location.lat === 'function') {
        position = {
          lat: place.location.lat(),
          lng: place.location.lng()
        };
      } else {
        position = {
          lat: place.location.lat,
          lng: place.location.lng
        };
      }
    } catch (error) {
      console.error('Failed to extract location from place:', place.location);
      return null;
    }

    // Determine venue type from Google Places types
    const venueType = this.determineVenueTypeFromNew(place.types || []);

    // Extract amenities from place details
    const amenities = this.extractAmenitiesFromNew(place);

    // Data extraction from Google Places API

    const venue: Venue = {
      id: place.id,
      name: place.displayName || place.name || 'Unknown Venue',
      address: place.formattedAddress || '',
      position,
      venueType,
      rating: place.rating,
      reviewCount: place.userRatingCount,
      priceLevel: this.convertPriceLevel(place.priceLevel),
      isOpen: place.regularOpeningHours?.openNow,
      openingHours: place.regularOpeningHours?.weekdayDescriptions,
      photos: place.photos?.slice(0, 5).map((photo: any) => 
        photo.getURI ? photo.getURI({ maxWidth: 400, maxHeight: 300 }) : null
      ).filter(Boolean),
      website: place.websiteURI,
      phone: place.nationalPhoneNumber || place.internationalPhoneNumber,
      amenities,
      description: this.generateDescriptionFromNew(place),
      placeId: place.id
    };

    console.log(`✅ Venue: ${venue.name} (${venue.venueType})`);
    return venue;
  }

  /**
   * Convert Google Places result to our Venue interface (legacy support)
   */
  private convertPlaceToVenue(place: google.maps.places.PlaceResult): Venue | null {
    if (!place.place_id || !place.geometry?.location) {
      return null;
    }

    const position: LocationCoords = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng()
    };

    // Determine venue type from Google Places types
    const venueType = this.determineVenueType(place.types || []);

    // Extract amenities from place details
    const amenities = this.extractAmenities(place);

    const venue: Venue = {
      id: place.place_id,
      name: place.name || 'Unknown Venue',
      address: place.formatted_address || place.vicinity || '',
      position,
      venueType,
      rating: place.rating,
      reviewCount: place.user_ratings_total,
      priceLevel: place.price_level,
      isOpen: place.opening_hours?.isOpen?.(),
      openingHours: place.opening_hours?.weekday_text,
      photos: place.photos?.slice(0, 5).map(photo => 
        photo.getUrl({ maxWidth: 400, maxHeight: 300 })
      ),
      website: place.website,
      phone: place.formatted_phone_number,
      amenities,
      description: this.generateDescription(place),
      placeId: place.place_id
    };

    return venue;
  }

  /**
   * Determine venue type from new API types
   */
  private determineVenueTypeFromNew(types: string[]): Venue['venueType'] {
    // Priority order for type determination (new API types)
    const typeMapping: { [key: string]: Venue['venueType'] } = {
      'cafe': 'cafe',
      'coffee_shop': 'cafe',
      'bakery': 'cafe',
      'restaurant': 'restaurant',
      'food': 'restaurant',
      'meal_takeaway': 'restaurant',
      'library': 'library',
      'university': 'library',
      'school': 'library'
    };

    // Special handling for coworking spaces
    if (types.some(type => type.includes('office') || type.includes('business'))) {
      return 'coworking';
    }

    // Find the first matching type
    for (const type of types) {
      if (typeMapping[type]) {
        return typeMapping[type];
      }
    }

    return 'other';
  }

  /**
   * Convert price level from new API format
   */
  private convertPriceLevel(priceLevel: string | undefined): number | undefined {
    if (!priceLevel) return undefined;
    
    const priceLevelMap: { [key: string]: number } = {
      'PRICE_LEVEL_FREE': 0,
      'PRICE_LEVEL_INEXPENSIVE': 1,
      'PRICE_LEVEL_MODERATE': 2,
      'PRICE_LEVEL_EXPENSIVE': 3,
      'PRICE_LEVEL_VERY_EXPENSIVE': 4
    };
    
    return priceLevelMap[priceLevel] || undefined;
  }

  /**
   * Extract amenities from new API place details
   */
  private extractAmenitiesFromNew(place: any): string[] {
    const amenities: string[] = [];

    // Based on place types
    if (place.types) {
      if (place.accessibilityOptions?.wheelchairAccessibleEntrance) {
        amenities.push('Wheelchair Accessible');
      }
    }

    // Based on price level
    const priceLevel = this.convertPriceLevel(place.priceLevel);
    if (priceLevel === 1) amenities.push('Budget Friendly');
    if (priceLevel === 4) amenities.push('Premium');

    // Based on rating
    if (place.rating && place.rating > 4.5) amenities.push('Highly Rated');

    // Common amenities for venue types
    const types = place.types || [];
    if (types.includes('cafe') || types.includes('coffee_shop')) {
      amenities.push('Coffee', 'Seating');
    }

    if (types.includes('library')) {
      amenities.push('Quiet Space', 'Study Area');
    }

    // Check for wifi (common amenity)
    if (place.paymentOptions?.acceptsCreditCards) {
      amenities.push('Card Payments');
    }

    return amenities;
  }

  /**
   * Generate description from new API place data
   */
  private generateDescriptionFromNew(place: any): string {
    const parts: string[] = [];

    if (place.rating && place.userRatingCount) {
      parts.push(`Rated ${place.rating}/5 by ${place.userRatingCount} customers`);
    }

    const priceLevel = this.convertPriceLevel(place.priceLevel);
    if (priceLevel) {
      const priceDescriptions: { [key: number]: string } = {
        1: 'Budget-friendly',
        2: 'Moderately priced',
        3: 'Expensive', 
        4: 'Very expensive'
      };
      parts.push(priceDescriptions[priceLevel] || '');
    }

    if (place.regularOpeningHours?.openNow) {
      parts.push('Currently open');
    }

    return parts.filter(Boolean).join('. ') + (parts.length > 0 ? '.' : '');
  }

  /**
   * Determine venue type from Google Places types (legacy)
   */
  private determineVenueType(types: string[]): Venue['venueType'] {
    // Priority order for type determination
    const typeMapping: { [key: string]: Venue['venueType'] } = {
      'cafe': 'cafe',
      'coffee_shop': 'cafe',
      'bakery': 'cafe',
      'restaurant': 'restaurant',
      'food': 'restaurant',
      'meal_takeaway': 'restaurant',
      'library': 'library',
      'university': 'library',
      'school': 'library'
    };

    // Special handling for coworking spaces (not a standard Google type)
    if (types.some(type => type.includes('office') || type.includes('business'))) {
      return 'coworking';
    }

    // Find the first matching type
    for (const type of types) {
      if (typeMapping[type]) {
        return typeMapping[type];
      }
    }

    return 'other';
  }

  /**
   * Extract amenities from place details
   */
  private extractAmenities(place: google.maps.places.PlaceResult): string[] {
    const amenities: string[] = [];

    // Based on place types
    if (place.types) {
      if (place.types.includes('wifi')) amenities.push('Wi-Fi');
      if (place.types.includes('parking')) amenities.push('Parking');
      if (place.types.includes('wheelchair_accessible')) amenities.push('Wheelchair Accessible');
    }

    // Based on price level
    if (place.price_level === 1) amenities.push('Budget Friendly');
    if (place.price_level === 4) amenities.push('Premium');

    // Based on rating
    if (place.rating && place.rating > 4.5) amenities.push('Highly Rated');

    // Common amenities for venue types
    if (place.types?.includes('cafe') || place.types?.includes('coffee_shop')) {
      amenities.push('Coffee', 'Seating');
    }

    if (place.types?.includes('library')) {
      amenities.push('Quiet Space', 'Study Area');
    }

    return amenities;
  }

  /**
   * Generate description from available place data
   */
  private generateDescription(place: google.maps.places.PlaceResult): string {
    const parts: string[] = [];

    if (place.rating && place.user_ratings_total) {
      parts.push(`Rated ${place.rating}/5 by ${place.user_ratings_total} customers`);
    }

    if (place.price_level) {
      const priceDescriptions: { [key: number]: string } = {
        1: 'Budget-friendly',
        2: 'Moderately priced',
        3: 'Expensive', 
        4: 'Very expensive'
      };
      parts.push(priceDescriptions[place.price_level] || '');
    }

    if (place.opening_hours?.isOpen?.()) {
      parts.push('Currently open');
    }

    return parts.filter(Boolean).join('. ') + (parts.length > 0 ? '.' : '');
  }

  /**
   * Get cost optimization statistics
   */
  public getCostStats() {
    return apiOptimizer.getUsageStats();
  }

  /**
   * Clear cache for testing or memory management
   */
  public clearCache(): void {
    mapsCache.clear();
  }
}

// Export singleton instance
export const placesService = PlacesService.getInstance();