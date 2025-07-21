import { browser } from '$app/environment';
import type { LocationCoords } from '$lib/types';

export interface MapControlOptions {
  position?: google.maps.ControlPosition;
  style?: Partial<CSSStyleDeclaration>;
  className?: string;
  text?: string;
  title?: string;
  icon?: string;
}

export interface CustomControl {
  element: HTMLElement;
  position: google.maps.ControlPosition;
  remove: () => void;
}

/**
 * Utility class for managing Google Maps custom controls
 */
export class MapControlsManager {
  private controls: Map<string, CustomControl> = new Map();
  private map: google.maps.Map | null = null;

  constructor(map?: google.maps.Map) {
    if (map) {
      this.setMap(map);
    }
  }

  /**
   * Set the map instance
   */
  public setMap(map: google.maps.Map): void {
    this.map = map;
    
    // Re-add existing controls to new map
    this.controls.forEach((control) => {
      if (this.map) {
        this.map.controls[control.position].push(control.element);
      }
    });
  }

  /**
   * Create a standard button control
   */
  public createButtonControl(
    id: string,
    text: string,
    onClick: () => void,
    options: MapControlOptions = {}
  ): CustomControl | null {
    if (!this.map || !browser) return null;

    const button = document.createElement('button');
    button.textContent = options.text || text;
    button.title = options.title || text;
    button.type = 'button';
    
    // Apply default styling
    this.applyDefaultButtonStyles(button);
    
    // Apply custom className
    if (options.className) {
      button.className = options.className;
    }
    
    // Apply custom styles
    if (options.style) {
      Object.assign(button.style, options.style);
    }

    // Add click handler
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });

    const position = options.position || google.maps.ControlPosition.TOP_RIGHT;
    this.map.controls[position].push(button);

    const control: CustomControl = {
      element: button,
      position,
      remove: () => this.removeControl(id)
    };

    this.controls.set(id, control);
    return control;
  }

  /**
   * Create a location/current position control
   */
  public createLocationControl(
    id: string,
    onLocationClick: () => Promise<LocationCoords | null>,
    options: MapControlOptions = {}
  ): CustomControl | null {
    if (!this.map || !browser) return null;

    const button = document.createElement('button');
    button.innerHTML = options.icon || '📍';
    button.title = options.title || 'Get current location';
    button.type = 'button';
    
    this.applyDefaultButtonStyles(button);
    
    if (options.className) {
      button.className = options.className;
    }

    let isLoading = false;

    button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (isLoading) return;
      
      try {
        isLoading = true;
        button.style.opacity = '0.6';
        button.innerHTML = '⟳';
        
        const location = await onLocationClick();
        
        if (location && this.map) {
          this.map.panTo(new google.maps.LatLng(location.lat, location.lng));
          this.map.setZoom(Math.max(this.map.getZoom() || 12, 15));
        }
        
        button.innerHTML = options.icon || '📍';
        
      } catch (error) {
        console.error('Location control error:', error);
        button.innerHTML = '❌';
        setTimeout(() => {
          button.innerHTML = options.icon || '📍';
        }, 2000);
      } finally {
        isLoading = false;
        button.style.opacity = '1';
      }
    });

    const position = options.position || google.maps.ControlPosition.RIGHT_BOTTOM;
    this.map.controls[position].push(button);

    const control: CustomControl = {
      element: button,
      position,
      remove: () => this.removeControl(id)
    };

    this.controls.set(id, control);
    return control;
  }

  /**
   * Create a zoom control (alternative to default)
   */
  public createZoomControl(
    id: string,
    options: MapControlOptions = {}
  ): CustomControl | null {
    if (!this.map || !browser) return null;

    const container = document.createElement('div');
    container.className = options.className || 'map-zoom-control';
    
    // Zoom in button
    const zoomInBtn = document.createElement('button');
    zoomInBtn.innerHTML = '+';
    zoomInBtn.title = 'Zoom in';
    zoomInBtn.type = 'button';
    
    // Zoom out button
    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.innerHTML = '−';
    zoomOutBtn.title = 'Zoom out';
    zoomOutBtn.type = 'button';

    // Style buttons
    [zoomInBtn, zoomOutBtn].forEach(btn => {
      this.applyDefaultButtonStyles(btn);
      btn.style.display = 'block';
      btn.style.width = '40px';
      btn.style.height = '40px';
      btn.style.margin = '0';
      btn.style.borderRadius = '0';
      btn.style.fontSize = '18px';
      btn.style.fontWeight = 'bold';
    });

    zoomInBtn.style.borderBottom = '1px solid #ddd';
    zoomOutBtn.style.borderTop = 'none';

    // Add event listeners
    zoomInBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.map) {
        const currentZoom = this.map.getZoom() || 10;
        this.map.setZoom(Math.min(currentZoom + 1, 20));
      }
    });

    zoomOutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (this.map) {
        const currentZoom = this.map.getZoom() || 10;
        this.map.setZoom(Math.max(currentZoom - 1, 1));
      }
    });

    container.appendChild(zoomInBtn);
    container.appendChild(zoomOutBtn);

    const position = options.position || google.maps.ControlPosition.RIGHT_CENTER;
    this.map.controls[position].push(container);

    const control: CustomControl = {
      element: container,
      position,
      remove: () => this.removeControl(id)
    };

    this.controls.set(id, control);
    return control;
  }

  /**
   * Create a fullscreen control
   */
  public createFullscreenControl(
    id: string,
    mapContainer: HTMLElement,
    options: MapControlOptions = {}
  ): CustomControl | null {
    if (!this.map || !browser) return null;

    const button = document.createElement('button');
    button.innerHTML = '⛶';
    button.title = options.title || 'Toggle fullscreen';
    button.type = 'button';
    
    this.applyDefaultButtonStyles(button);
    
    if (options.className) {
      button.className = options.className;
    }

    let isFullscreen = false;

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!isFullscreen) {
        // Enter fullscreen
        mapContainer.style.position = 'fixed';
        mapContainer.style.top = '0';
        mapContainer.style.left = '0';
        mapContainer.style.width = '100vw';
        mapContainer.style.height = '100vh';
        mapContainer.style.zIndex = '9999';
        button.innerHTML = '⛷';
        isFullscreen = true;
      } else {
        // Exit fullscreen
        mapContainer.style.position = '';
        mapContainer.style.top = '';
        mapContainer.style.left = '';
        mapContainer.style.width = '';
        mapContainer.style.height = '';
        mapContainer.style.zIndex = '';
        button.innerHTML = '⛶';
        isFullscreen = false;
      }

      // Trigger map resize
      if (this.map) {
        setTimeout(() => {
          if (this.map) {
            google.maps.event.trigger(this.map, 'resize');
          }
        }, 100);
      }
    });

    const position = options.position || google.maps.ControlPosition.TOP_RIGHT;
    this.map.controls[position].push(button);

    const control: CustomControl = {
      element: button,
      position,
      remove: () => {
        this.removeControl(id);
        // Reset fullscreen if active
        if (isFullscreen) {
          mapContainer.style.position = '';
          mapContainer.style.top = '';
          mapContainer.style.left = '';
          mapContainer.style.width = '';
          mapContainer.style.height = '';
          mapContainer.style.zIndex = '';
        }
      }
    };

    this.controls.set(id, control);
    return control;
  }

  /**
   * Remove a control by ID
   */
  public removeControl(id: string): boolean {
    const control = this.controls.get(id);
    if (!control || !this.map) return false;

    // Remove from map
    const controls = this.map.controls[control.position];
    const index = controls.getArray().indexOf(control.element);
    if (index > -1) {
      controls.removeAt(index);
    }

    // Remove from local tracking
    this.controls.delete(id);
    return true;
  }

  /**
   * Remove all controls
   */
  public removeAllControls(): void {
    Array.from(this.controls.keys()).forEach(id => {
      this.removeControl(id);
    });
  }

  /**
   * Get a control by ID
   */
  public getControl(id: string): CustomControl | undefined {
    return this.controls.get(id);
  }

  /**
   * Check if a control exists
   */
  public hasControl(id: string): boolean {
    return this.controls.has(id);
  }

  /**
   * Apply default styling to control buttons
   */
  private applyDefaultButtonStyles(button: HTMLElement): void {
    Object.assign(button.style, {
      backgroundColor: 'white',
      border: '2px solid white',
      borderRadius: '3px',
      boxShadow: '0 2px 6px rgba(0,0,0,.3)',
      cursor: 'pointer',
      fontSize: '16px',
      margin: '8px',
      padding: '8px 12px',
      textAlign: 'center',
      textDecoration: 'none',
      color: '#1a73e8',
      fontFamily: 'Roboto, Arial, sans-serif',
      lineHeight: '1',
      minWidth: '40px',
      minHeight: '40px'
    } as any);

    // Hover effects
    button.addEventListener('mouseenter', () => {
      button.style.boxShadow = '0 4px 8px rgba(0,0,0,.3)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    });

    // Active effects
    button.addEventListener('mousedown', () => {
      button.style.backgroundColor = '#f1f3f4';
    });

    button.addEventListener('mouseup', () => {
      button.style.backgroundColor = 'white';
    });
  }
}

/**
 * Create optimized map controls for mobile and desktop
 */
export function createOptimizedControls(
  map: google.maps.Map,
  mapContainer: HTMLElement,
  onLocationRequest: () => Promise<LocationCoords | null>
): MapControlsManager {
  const controlsManager = new MapControlsManager(map);
  
  if (!browser) return controlsManager;

  // Detect mobile device
  const isMobile = window.innerWidth < 768;
  
  if (isMobile) {
    // Mobile: Minimal controls
    controlsManager.createLocationControl('location', onLocationRequest, {
      position: google.maps.ControlPosition.RIGHT_BOTTOM,
      icon: '🎯',
      className: 'mobile-location-control'
    });
  } else {
    // Desktop: Full controls
    controlsManager.createLocationControl('location', onLocationRequest, {
      position: google.maps.ControlPosition.RIGHT_BOTTOM,
      icon: '📍',
      title: 'Center on your location'
    });

    controlsManager.createFullscreenControl('fullscreen', mapContainer, {
      position: google.maps.ControlPosition.TOP_RIGHT
    });
  }

  return controlsManager;
}