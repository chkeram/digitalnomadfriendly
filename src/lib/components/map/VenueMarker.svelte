<script lang="ts">
  import { browser } from '$app/environment';
  import { createEventDispatcher } from 'svelte';
  import type { LocationCoords } from '$lib/types';

  // Props using Svelte 5 runes
  interface Props {
    position: LocationCoords;
    title: string;
    venueId: string;
    venueType?: 'cafe' | 'coworking' | 'library' | 'restaurant' | 'other';
    rating?: number;
    isSelected?: boolean;
    map?: google.maps.Map | null;
  }

  const {
    position,
    title,
    venueId,
    venueType = 'cafe',
    rating,
    isSelected = false,
    map = null
  }: Props = $props();

  // State
  let marker = $state<google.maps.marker.AdvancedMarkerElement | null>(null);
  let isVisible = $state(true);
  let markerLibrary = $state<any>(null);

  // Event dispatcher for Svelte 4 compatibility
  const dispatch = createEventDispatcher<{
    markerClick: { venueId: string; position: LocationCoords };
    markerHover: { venueId: string; position: LocationCoords };
  }>();

  // Initialize marker library and create marker only once when map is available
  $effect(() => {
    if (!browser || !map || !window.google?.maps || marker) return;

    const initializeMarker = async () => {
      try {
        // Small delay to ensure map is fully initialized
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Load the advanced markers library
        if (!markerLibrary) {
          markerLibrary = await google.maps.importLibrary("marker");
        }

        // Create initial PinElement for the marker
        const pin = new markerLibrary.PinElement({
          background: getVenueColor(venueType),
          borderColor: '#FFFFFF',
          glyphColor: '#FFFFFF',
          scale: 1.0,
          glyph: getVenueIcon(venueType)
        });

        // Create advanced marker
        marker = new markerLibrary.AdvancedMarkerElement({
          map: map,
          position: { lat: position.lat, lng: position.lng },
          title: title,
          content: pin.element,
          gmpClickable: true,
          zIndex: getZIndex(venueType)
        });

        // Add click listener
        if (marker) {
          marker.addEventListener('click', () => {
            dispatch('markerClick', { venueId, position });
          });

          // Add hover listeners (mouseover/mouseout on the marker element)
          if (marker.content) {
            marker.content.addEventListener('mouseenter', () => {
              dispatch('markerHover', { venueId, position });
            });
          }
        }

      } catch (error) {
        console.error('Failed to create advanced marker:', error);
      }
    };

    initializeMarker();

    // Cleanup function
    return () => {
      if (marker) {
        marker.map = null;
        marker = null;
      }
    };
  });

  // Update marker appearance when selection state changes
  $effect(() => {
    if (!marker || !markerLibrary) return;

    try {
      const pin = new markerLibrary.PinElement({
        background: getVenueColor(venueType),
        borderColor: isSelected ? '#FF6B35' : '#FFFFFF',
        glyphColor: '#FFFFFF',
        scale: isSelected ? 1.3 : 1.0,
        glyph: getVenueIcon(venueType)
      });
      
      marker.content = pin.element;
      marker.zIndex = isSelected ? 1000 : getZIndex(venueType);

      // Re-add event listeners to new content
      if (marker.content) {
        marker.content.addEventListener('mouseenter', () => {
          dispatch('markerHover', { venueId, position });
        });
      }
    } catch (error) {
      console.error('Failed to update marker appearance:', error);
    }
  });

  /**
   * Get venue icon/glyph for the marker
   */
  function getVenueIcon(type: string): string {
    const icons: { [key: string]: string } = {
      cafe: '☕',
      coworking: '💼',
      library: '📚',
      restaurant: '🍽️',
      other: '📍'
    };
    return icons[type] || icons.other;
  }

  /**
   * Get color based on venue type
   */
  function getVenueColor(type: string): string {
    const colors: { [key: string]: string } = {
      cafe: '#8B4513',        // Brown for cafes
      coworking: '#4A90E2',   // Blue for coworking
      library: '#7ED321',     // Green for libraries
      restaurant: '#F5A623',  // Orange for restaurants
      other: '#9013FE'        // Purple for other
    };
    return colors[type] || colors.other;
  }

  /**
   * Get z-index based on venue type (priority)
   */
  function getZIndex(type: string): number {
    const priorities: { [key: string]: number } = {
      coworking: 800,
      cafe: 700,
      library: 600,
      restaurant: 500,
      other: 400
    };
    return priorities[type] || priorities.other;
  }

  /**
   * Show marker
   */
  export function show(): void {
    isVisible = true;
    if (marker) {
      marker.map = map;
    }
  }

  /**
   * Hide marker
   */
  export function hide(): void {
    isVisible = false;
    if (marker) {
      marker.map = null;
    }
  }

  /**
   * Remove marker from map
   */
  export function remove(): void {
    if (marker) {
      marker.map = null;
      marker = null;
    }
  }

  /**
   * Get marker position
   */
  export function getPosition(): LocationCoords {
    return position;
  }

  /**
   * Update marker position
   */
  export function updatePosition(newPosition: LocationCoords): void {
    if (marker) {
      marker.position = { lat: newPosition.lat, lng: newPosition.lng };
    }
  }

  /**
   * Animate marker (bounce) - Advanced markers don't support animation directly
   * Instead we'll use CSS animation on the pin element
   */
  export function bounce(): void {
    if (marker && marker.content && marker.content instanceof HTMLElement) {
      marker.content.style.animation = 'bounce 0.5s ease-in-out 3';
      setTimeout(() => {
        if (marker && marker.content && marker.content instanceof HTMLElement) {
          marker.content.style.animation = '';
        }
      }, 1500);
    }
  }

  /**
   * Get native Google Maps marker instance
   */
  export function getMarker(): google.maps.marker.AdvancedMarkerElement | null {
    return marker;
  }
</script>

<!-- This component doesn't render DOM elements, it manages Google Maps markers -->

<style>
  :global(.gmp-marker-pin) {
    transition: transform 0.2s ease-in-out;
  }

  :global(.gmp-marker-pin:hover) {
    transform: scale(1.1);
  }

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-10px);
    }
    60% {
      transform: translateY(-5px);
    }
  }
</style>