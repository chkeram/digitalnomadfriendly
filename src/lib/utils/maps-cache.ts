import { browser } from '$app/environment';
import type { LocationCoords } from '$lib/types';

/**
 * Intelligent caching system for Google Maps API responses
 * Reduces API calls and costs through strategic caching
 */

export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

export interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  cleanupInterval: number;
}

export interface GeocacheResult {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: LocationCoords;
  };
  name?: string;
  types: string[];
}

/**
 * Advanced caching system optimized for Maps API responses
 */
export class MapsCache {
  private static instance: MapsCache;
  private cache: Map<string, CacheItem> = new Map();
  private config: CacheConfig = {
    maxSize: 500, // Maximum cached items
    defaultTTL: 1000 * 60 * 60, // 1 hour default
    cleanupInterval: 1000 * 60 * 15 // Cleanup every 15 minutes
  };
  private cleanupTimer: number | null = null;

  private constructor() {
    this.loadFromStorage();
    this.startCleanupTimer();
    
    // Clean up on page unload
    if (browser) {
      window.addEventListener('beforeunload', () => {
        this.saveToStorage();
      });
    }
  }

  public static getInstance(): MapsCache {
    if (!MapsCache.instance) {
      MapsCache.instance = new MapsCache();
    }
    return MapsCache.instance;
  }

  /**
   * Get cached item with automatic TTL check
   */
  public get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    const now = Date.now();
    
    // Check if expired
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    // Update access statistics
    item.accessCount++;
    item.lastAccessed = now;
    
    return item.data as T;
  }

  /**
   * Set cached item with custom TTL
   */
  public set<T>(key: string, data: T, customTTL?: number): void {
    const now = Date.now();
    const ttl = customTTL || this.config.defaultTTL;
    
    // Remove oldest items if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evictLeastRecent();
    }
    
    const item: CacheItem<T> = {
      data,
      timestamp: now,
      ttl,
      accessCount: 1,
      lastAccessed: now
    };
    
    this.cache.set(key, item);
  }

  /**
   * Check if item exists and is not expired
   */
  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Remove item from cache
   */
  public delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  public clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  public getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    totalHits: number;
    oldestItem: number;
    newestItem: number;
  } {
    let totalHits = 0;
    let oldestTimestamp = Date.now();
    let newestTimestamp = 0;
    
    for (const item of this.cache.values()) {
      totalHits += item.accessCount;
      oldestTimestamp = Math.min(oldestTimestamp, item.timestamp);
      newestTimestamp = Math.max(newestTimestamp, item.timestamp);
    }
    
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: totalHits / Math.max(this.cache.size, 1),
      totalHits,
      oldestItem: oldestTimestamp,
      newestItem: newestTimestamp
    };
  }

  /**
   * Cache geocoding results with location-based key
   */
  public cacheGeocode(location: LocationCoords, result: GeocacheResult[], customTTL?: number): void {
    const key = this.createLocationKey('geocode', location);
    this.set(key, result, customTTL || 1000 * 60 * 60 * 24); // 24h for geocoding
  }

  /**
   * Get cached geocoding results
   */
  public getCachedGeocode(location: LocationCoords): GeocacheResult[] | null {
    const key = this.createLocationKey('geocode', location);
    return this.get<GeocacheResult[]>(key);
  }

  /**
   * Cache place details with place_id key
   */
  public cachePlaceDetails(placeId: string, details: any, customTTL?: number): void {
    const key = `place_details:${placeId}`;
    this.set(key, details, customTTL || 1000 * 60 * 60 * 6); // 6h for place details
  }

  /**
   * Get cached place details
   */
  public getCachedPlaceDetails(placeId: string): any | null {
    const key = `place_details:${placeId}`;
    return this.get(key);
  }

  /**
   * Cache nearby search results
   */
  public cacheNearbySearch(
    location: LocationCoords, 
    radius: number, 
    type: string, 
    results: any[], 
    customTTL?: number
  ): void {
    const key = `nearby:${location.lat.toFixed(4)},${location.lng.toFixed(4)}:${radius}:${type}`;
    this.set(key, results, customTTL || 1000 * 60 * 60); // 1h for search results
  }

  /**
   * Get cached nearby search results
   */
  public getCachedNearbySearch(location: LocationCoords, radius: number, type: string): any[] | null {
    const key = `nearby:${location.lat.toFixed(4)},${location.lng.toFixed(4)}:${radius}:${type}`;
    return this.get<any[]>(key);
  }

  /**
   * Cache autocomplete predictions
   */
  public cacheAutocompletePredictions(
    input: string, 
    location: LocationCoords, 
    predictions: any[], 
    customTTL?: number
  ): void {
    const key = `autocomplete:${input.toLowerCase()}:${location.lat.toFixed(2)},${location.lng.toFixed(2)}`;
    this.set(key, predictions, customTTL || 1000 * 60 * 30); // 30min for autocomplete
  }

  /**
   * Get cached autocomplete predictions
   */
  public getCachedAutocompletePredictions(input: string, location: LocationCoords): any[] | null {
    const key = `autocomplete:${input.toLowerCase()}:${location.lat.toFixed(2)},${location.lng.toFixed(2)}`;
    return this.get<any[]>(key);
  }

  /**
   * Create location-based cache key with precision rounding
   */
  private createLocationKey(prefix: string, location: LocationCoords, precision: number = 4): string {
    const lat = location.lat.toFixed(precision);
    const lng = location.lng.toFixed(precision);
    return `${prefix}:${lat},${lng}`;
  }

  /**
   * Evict least recently used items to make space
   */
  private evictLeastRecent(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clean up expired items
   */
  private cleanupExpired(): void {
    const now = Date.now();
    const toDelete: string[] = [];
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        toDelete.push(key);
      }
    }
    
    toDelete.forEach(key => this.cache.delete(key));
    
    if (toDelete.length > 0) {
      console.log(`MapsCache: Cleaned up ${toDelete.length} expired items`);
    }
  }

  /**
   * Start automatic cleanup timer
   */
  private startCleanupTimer(): void {
    if (!browser) return;
    
    this.cleanupTimer = window.setInterval(() => {
      this.cleanupExpired();
    }, this.config.cleanupInterval);
  }

  /**
   * Save cache to localStorage (only most important items)
   */
  private saveToStorage(): void {
    if (!browser) return;
    
    try {
      // Only save most accessed items to avoid localStorage limits
      const itemsToSave = Array.from(this.cache.entries())
        .filter(([_, item]) => item.accessCount > 1) // Only frequently accessed
        .sort(([_, a], [__, b]) => b.accessCount - a.accessCount) // Sort by access count
        .slice(0, 50); // Limit to top 50
      
      const cacheData = {
        timestamp: Date.now(),
        items: itemsToSave
      };
      
      localStorage.setItem('maps_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save maps cache to localStorage:', error);
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    if (!browser) return;
    
    try {
      const stored = localStorage.getItem('maps_cache');
      if (!stored) return;
      
      const cacheData = JSON.parse(stored);
      const now = Date.now();
      
      // Don't load cache older than 1 day
      if (now - cacheData.timestamp > 1000 * 60 * 60 * 24) {
        localStorage.removeItem('maps_cache');
        return;
      }
      
      // Restore valid items
      for (const [key, item] of cacheData.items) {
        if (now - item.timestamp < item.ttl) {
          this.cache.set(key, item);
        }
      }
      
      console.log(`MapsCache: Loaded ${this.cache.size} items from storage`);
    } catch (error) {
      console.warn('Failed to load maps cache from localStorage:', error);
    }
  }

  /**
   * Update cache configuration
   */
  public configure(newConfig: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Destroy cache and cleanup resources
   */
  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.clear();
  }
}

// Export singleton
export const mapsCache = MapsCache.getInstance();

/**
 * Decorator for caching API responses
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  getCacheKey: (...args: Parameters<T>) => string,
  ttl?: number
): T {
  return (async (...args: Parameters<T>) => {
    const key = getCacheKey(...args);
    
    // Try cache first
    const cached = mapsCache.get(key);
    if (cached !== null) {
      return cached;
    }
    
    // Call original function
    const result = await fn(...args);
    
    // Cache result
    mapsCache.set(key, result, ttl);
    
    return result;
  }) as T;
}