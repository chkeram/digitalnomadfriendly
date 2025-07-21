import { browser } from '$app/environment';

export interface ErrorInfo {
  message: string;
  stack?: string;
  component?: string;
  timestamp: Date;
  userAgent?: string;
  url?: string;
}

export type ErrorHandler = (error: ErrorInfo) => void;
export type ErrorRecovery = () => void | Promise<void>;

export class MapErrorBoundary {
  private static instance: MapErrorBoundary;
  private errorHandlers: ErrorHandler[] = [];
  private recoveryStrategies: Map<string, ErrorRecovery> = new Map();
  private errorCount = 0;
  private lastErrorTime = 0;
  private readonly MAX_ERRORS = 5;
  private readonly ERROR_WINDOW = 60000; // 1 minute

  private constructor() {}

  public static getInstance(): MapErrorBoundary {
    if (!MapErrorBoundary.instance) {
      MapErrorBoundary.instance = new MapErrorBoundary();
    }
    return MapErrorBoundary.instance;
  }

  /**
   * Add an error handler
   */
  public addErrorHandler(handler: ErrorHandler): void {
    this.errorHandlers.push(handler);
  }

  /**
   * Remove an error handler
   */
  public removeErrorHandler(handler: ErrorHandler): void {
    const index = this.errorHandlers.indexOf(handler);
    if (index > -1) {
      this.errorHandlers.splice(index, 1);
    }
  }

  /**
   * Register a recovery strategy for specific error types
   */
  public registerRecovery(errorType: string, recovery: ErrorRecovery): void {
    this.recoveryStrategies.set(errorType, recovery);
  }

  /**
   * Handle an error with automatic recovery attempts
   */
  public async handleError(error: Error, component?: string): Promise<void> {
    const now = Date.now();
    
    // Reset error count if enough time has passed
    if (now - this.lastErrorTime > this.ERROR_WINDOW) {
      this.errorCount = 0;
    }

    this.errorCount++;
    this.lastErrorTime = now;

    const errorInfo: ErrorInfo = {
      message: error.message,
      stack: error.stack,
      component,
      timestamp: new Date(),
      userAgent: browser ? navigator.userAgent : undefined,
      url: browser ? window.location.href : undefined
    };

    // Log error to console in development
    if (browser && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      console.error('MapErrorBoundary caught error:', errorInfo);
    }

    // Call all registered error handlers
    this.errorHandlers.forEach(handler => {
      try {
        handler(errorInfo);
      } catch (handlerError) {
        console.error('Error handler failed:', handlerError);
      }
    });

    // Attempt recovery if not too many errors
    if (this.errorCount < this.MAX_ERRORS) {
      await this.attemptRecovery(error);
    } else {
      console.error('Too many errors, stopping recovery attempts');
    }
  }

  /**
   * Attempt to recover from an error
   */
  private async attemptRecovery(error: Error): Promise<void> {
    // Try specific recovery strategies first
    for (const [errorType, recovery] of this.recoveryStrategies) {
      if (error.message.includes(errorType) || error.name.includes(errorType)) {
        try {
          await recovery();
          return;
        } catch (recoveryError) {
          console.error(`Recovery strategy for ${errorType} failed:`, recoveryError);
        }
      }
    }

    // Generic recovery strategies
    if (error.message.includes('API key')) {
      console.warn('API key error detected - check environment variables');
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      console.warn('Network error detected - retrying in 5 seconds');
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    } else if (error.message.includes('permission') || error.message.includes('geolocation')) {
      console.warn('Geolocation permission error - using fallback location');
    }
  }

  /**
   * Get current error statistics
   */
  public getErrorStats(): { count: number; lastErrorTime: number; withinWindow: boolean } {
    const now = Date.now();
    return {
      count: this.errorCount,
      lastErrorTime: this.lastErrorTime,
      withinWindow: (now - this.lastErrorTime) <= this.ERROR_WINDOW
    };
  }

  /**
   * Reset error statistics
   */
  public reset(): void {
    this.errorCount = 0;
    this.lastErrorTime = 0;
  }

  /**
   * Create a safe wrapper function for async operations
   */
  public wrapAsync<T>(
    fn: () => Promise<T>, 
    component?: string,
    fallback?: T
  ): () => Promise<T | undefined> {
    return async () => {
      try {
        return await fn();
      } catch (error) {
        await this.handleError(error instanceof Error ? error : new Error(String(error)), component);
        return fallback;
      }
    };
  }

  /**
   * Create a safe wrapper function for sync operations
   */
  public wrapSync<T>(
    fn: () => T, 
    component?: string,
    fallback?: T
  ): () => T | undefined {
    return () => {
      try {
        return fn();
      } catch (error) {
        this.handleError(error instanceof Error ? error : new Error(String(error)), component);
        return fallback;
      }
    };
  }
}

// Export singleton instance
export const mapErrorBoundary = MapErrorBoundary.getInstance();

// Common error recovery strategies
export const commonRecoveries = {
  apiKeyError: async () => {
    console.warn('API key error - redirecting to setup page');
    // Could redirect to configuration page
  },
  
  networkError: async () => {
    console.warn('Network error - will retry after delay');
    await new Promise(resolve => setTimeout(resolve, 2000));
  },
  
  geolocationError: async () => {
    console.warn('Geolocation error - falling back to IP location');
    // Could implement IP-based location detection
  },
  
  mapInitializationError: async () => {
    console.warn('Map initialization error - clearing cache and retrying');
    if (browser && 'caches' in window) {
      try {
        await caches.delete('google-maps-api');
      } catch (e) {
        console.warn('Could not clear cache:', e);
      }
    }
  }
};

// Default error boundary setup
export function setupDefaultErrorBoundary(): void {
  // Register common recovery strategies
  Object.entries(commonRecoveries).forEach(([errorType, recovery]) => {
    mapErrorBoundary.registerRecovery(errorType, recovery);
  });

  // Set up global error handler for unhandled promises
  if (browser) {
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && typeof event.reason === 'object' && 'message' in event.reason) {
        mapErrorBoundary.handleError(
          event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
          'unhandled-promise'
        );
      }
    });
  }
}