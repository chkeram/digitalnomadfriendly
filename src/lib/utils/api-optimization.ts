import { browser } from '$app/environment';

/**
 * Google Maps API cost optimization utilities
 * Implements field masking, request optimization, and usage monitoring
 */

export interface FieldMaskOptions {
  basicData?: boolean;
  contactData?: boolean;
  atmosphereData?: boolean;
  locationData?: boolean;
  priceData?: boolean;
  ratingsData?: boolean;
  customFields?: string[];
}

export interface PlacesRequestOptions {
  fields: string[];
  sessionToken?: string;
  useCache?: boolean;
  cacheTTL?: number;
}

export interface QuotaUsage {
  mapLoads: number;
  geocodingRequests: number;
  placesRequests: number;
  placesAutocomplete: number;
  staticMaps: number;
  lastReset: Date;
}

/**
 * Optimized field masks for different use cases
 */
export const OPTIMIZED_FIELD_MASKS = {
  // Minimal venue data for list views (1 field = $0.017 per 1K requests)
  VENUE_LIST: [
    'place_id',
    'name', 
    'geometry/location',
    'business_status',
    'price_level',
    'rating'
  ],
  
  // Basic venue details for cards (6 fields = $0.102 per 1K requests)
  VENUE_BASIC: [
    'place_id',
    'name',
    'formatted_address',
    'geometry/location',
    'business_status',
    'opening_hours/open_now',
    'price_level',
    'rating',
    'user_ratings_total',
    'photos'
  ],
  
  // Full venue details for detail view (careful with field count)
  VENUE_FULL: [
    'place_id',
    'name',
    'formatted_address',
    'geometry/location',
    'business_status',
    'opening_hours',
    'price_level',
    'rating',
    'user_ratings_total',
    'reviews',
    'photos',
    'formatted_phone_number',
    'website',
    'wifi_access_point'
  ],
  
  // Autocomplete optimized (3 fields = $0.051 per 1K requests)
  AUTOCOMPLETE: [
    'place_id',
    'name',
    'formatted_address'
  ]
} as const;

/**
 * API cost optimization manager
 */
export class ApiOptimizationManager {
  private static instance: ApiOptimizationManager;
  private quotaUsage: QuotaUsage;
  private sessionTokens: Map<string, string> = new Map();
  private dailyBudget: number = 50; // $50 daily budget default
  private costPerRequest = {
    mapLoad: 0.007, // $7 per 1K loads
    geocoding: 0.005, // $5 per 1K requests  
    placeDetails: 0.017, // $17 per 1K requests (per field)
    placesSearch: 0.032, // $32 per 1K requests
    autocomplete: 0.00285 // $2.85 per 1K requests (per session)
  };

  private constructor() {
    this.quotaUsage = this.loadQuotaUsage();
    this.resetQuotaIfNeeded();
  }

  public static getInstance(): ApiOptimizationManager {
    if (!ApiOptimizationManager.instance) {
      ApiOptimizationManager.instance = new ApiOptimizationManager();
    }
    return ApiOptimizationManager.instance;
  }

  /**
   * Generate optimized field mask based on use case
   */
  public getOptimizedFields(useCase: keyof typeof OPTIMIZED_FIELD_MASKS, customFields?: string[]): string[] {
    const baseFields = [...OPTIMIZED_FIELD_MASKS[useCase]] as string[];
    
    if (customFields) {
      // Add custom fields while avoiding duplicates
      customFields.forEach(field => {
        if (!baseFields.includes(field)) {
          baseFields.push(field);
        }
      });
    }
    
    return baseFields;
  }

  /**
   * Create session token for cost optimization
   * Use for autocomplete sequences to get bulk pricing
   */
  public createSessionToken(sessionId: string): string {
    if (!browser || !window.google?.maps) {
      return sessionId; // Fallback for SSR
    }
    
    const token = new google.maps.places.AutocompleteSessionToken();
    const tokenString = token.toString();
    this.sessionTokens.set(sessionId, tokenString);
    
    return tokenString;
  }

  /**
   * Get existing session token
   */
  public getSessionToken(sessionId: string): string | undefined {
    return this.sessionTokens.get(sessionId);
  }

  /**
   * Clear session token after completion
   */
  public clearSessionToken(sessionId: string): void {
    this.sessionTokens.delete(sessionId);
  }

  /**
   * Track API usage for quota monitoring
   */
  public trackUsage(apiType: keyof typeof this.costPerRequest, count: number = 1, fieldCount: number = 1): void {
    switch (apiType) {
      case 'mapLoad':
        this.quotaUsage.mapLoads += count;
        break;
      case 'geocoding':
        this.quotaUsage.geocodingRequests += count;
        break;
      case 'placeDetails':
        this.quotaUsage.placesRequests += count;
        break;
      case 'autocomplete':
        this.quotaUsage.placesAutocomplete += count;
        break;
    }
    
    this.saveQuotaUsage();
    this.checkBudgetAlert();
  }

  /**
   * Get current estimated costs
   */
  public getEstimatedCosts(): { daily: number; breakdown: Record<string, number> } {
    const costs = {
      mapLoads: (this.quotaUsage.mapLoads / 1000) * this.costPerRequest.mapLoad,
      geocoding: (this.quotaUsage.geocodingRequests / 1000) * this.costPerRequest.geocoding,
      placeDetails: (this.quotaUsage.placesRequests / 1000) * this.costPerRequest.placeDetails,
      placesSearch: 0, // Will be calculated based on search requests
      autocomplete: (this.quotaUsage.placesAutocomplete / 1000) * this.costPerRequest.autocomplete
    };
    
    const daily = Object.values(costs).reduce((sum, cost) => sum + cost, 0);
    
    return { daily, breakdown: costs };
  }

  /**
   * Check if we're approaching budget limits
   */
  public checkBudgetStatus(): { 
    withinBudget: boolean; 
    percentageUsed: number; 
    estimatedDaily: number;
    alert: 'none' | 'warning' | 'critical' 
  } {
    const { daily } = this.getEstimatedCosts();
    const percentageUsed = (daily / this.dailyBudget) * 100;
    
    let alert: 'none' | 'warning' | 'critical' = 'none';
    if (percentageUsed > 90) alert = 'critical';
    else if (percentageUsed > 75) alert = 'warning';
    
    return {
      withinBudget: daily <= this.dailyBudget,
      percentageUsed,
      estimatedDaily: daily,
      alert
    };
  }

  /**
   * Set daily budget limit
   */
  public setDailyBudget(amount: number): void {
    this.dailyBudget = amount;
  }

  /**
   * Optimize Places API request with field masking
   */
  public optimizePlacesRequest(
    request: google.maps.places.PlaceDetailsRequest,
    useCase: keyof typeof OPTIMIZED_FIELD_MASKS
  ): google.maps.places.PlaceDetailsRequest {
    const optimizedFields = this.getOptimizedFields(useCase);
    
    return {
      ...request,
      fields: optimizedFields
    };
  }

  /**
   * Check budget before making expensive requests
   */
  public shouldMakeRequest(apiType: keyof typeof this.costPerRequest, fieldCount: number = 1): boolean {
    const { withinBudget, alert } = this.checkBudgetStatus();
    
    // Block requests if we're over budget and it's a critical alert
    if (alert === 'critical' && !withinBudget) {
      console.warn(`API request blocked: Daily budget exceeded for ${apiType}`);
      return false;
    }
    
    return true;
  }

  /**
   * Get usage statistics
   */
  public getUsageStats(): QuotaUsage & { costs: { daily: number; breakdown: Record<string, number> } } {
    return {
      ...this.quotaUsage,
      costs: this.getEstimatedCosts()
    };
  }

  /**
   * Reset quota usage (called daily)
   */
  private resetQuotaIfNeeded(): void {
    const now = new Date();
    const lastReset = this.quotaUsage.lastReset;
    
    // Reset if it's a new day
    if (now.toDateString() !== lastReset.toDateString()) {
      this.quotaUsage = {
        mapLoads: 0,
        geocodingRequests: 0,
        placesRequests: 0,
        placesAutocomplete: 0,
        staticMaps: 0,
        lastReset: now
      };
      this.saveQuotaUsage();
    }
  }

  /**
   * Load quota usage from localStorage
   */
  private loadQuotaUsage(): QuotaUsage {
    if (!browser) {
      return {
        mapLoads: 0,
        geocodingRequests: 0,
        placesRequests: 0,
        placesAutocomplete: 0,
        staticMaps: 0,
        lastReset: new Date()
      };
    }
    
    try {
      const stored = localStorage.getItem('gmaps_quota_usage');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.lastReset = new Date(parsed.lastReset);
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to load quota usage:', error);
    }
    
    return {
      mapLoads: 0,
      geocodingRequests: 0,
      placesRequests: 0,
      placesAutocomplete: 0,
      staticMaps: 0,
      lastReset: new Date()
    };
  }

  /**
   * Save quota usage to localStorage
   */
  private saveQuotaUsage(): void {
    if (!browser) return;
    
    try {
      localStorage.setItem('gmaps_quota_usage', JSON.stringify(this.quotaUsage));
    } catch (error) {
      console.warn('Failed to save quota usage:', error);
    }
  }

  /**
   * Check for budget alerts
   */
  private checkBudgetAlert(): void {
    const { alert, percentageUsed, estimatedDaily } = this.checkBudgetStatus();
    
    if (alert === 'critical') {
      console.error(`🚨 Google Maps API budget critical: ${percentageUsed.toFixed(1)}% used ($${estimatedDaily.toFixed(2)}/$${this.dailyBudget})`);
    } else if (alert === 'warning') {
      console.warn(`⚠️ Google Maps API budget warning: ${percentageUsed.toFixed(1)}% used ($${estimatedDaily.toFixed(2)}/$${this.dailyBudget})`);
    }
  }
}

// Export singleton
export const apiOptimizer = ApiOptimizationManager.getInstance();

/**
 * Utility function to create cost-optimized autocomplete service
 */
export function createOptimizedAutocompleteService(): google.maps.places.AutocompleteService | null {
  if (!browser || !window.google?.maps?.places) return null;
  
  return new google.maps.places.AutocompleteService();
}

/**
 * Utility function to create cost-optimized places service
 */
export function createOptimizedPlacesService(): google.maps.places.PlacesService | null {
  if (!browser || !window.google?.maps?.places) return null;
  
  const map = new google.maps.Map(document.createElement('div'));
  return new google.maps.places.PlacesService(map);
}