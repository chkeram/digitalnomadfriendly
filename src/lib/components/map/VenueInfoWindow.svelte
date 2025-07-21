<script lang="ts">
  import { browser } from '$app/environment';
  import type { LocationCoords } from '$lib/types';

  // Define venue interface for the info window
  interface VenueInfo {
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
  }

  // Props using Svelte 5 runes
  interface Props {
    venue: VenueInfo | null;
    map?: google.maps.Map | null;
    isVisible?: boolean;
  }

  const {
    venue,
    map = null,
    isVisible = false
  }: Props = $props();

  // State
  let infoWindow = $state<google.maps.InfoWindow | null>(null);
  let contentElement = $state<HTMLDivElement>();

  // Create InfoWindow when map is available
  $effect(() => {
    if (!browser || !map || !window.google?.maps) return;

    // Create InfoWindow instance
    infoWindow = new google.maps.InfoWindow({
      maxWidth: 350,
      disableAutoPan: false
    });

    // Cleanup function
    return () => {
      if (infoWindow) {
        infoWindow.close();
        infoWindow = null;
      }
    };
  });

  // Update InfoWindow content and visibility
  $effect(() => {
    if (!infoWindow || !venue) return;

    if (isVisible) {
      // Set content and open InfoWindow
      infoWindow.setContent(contentElement);
      infoWindow.setPosition(new google.maps.LatLng(venue.position.lat, venue.position.lng));
      infoWindow.open(map);
    } else {
      // Close InfoWindow
      infoWindow.close();
    }
  });

  /**
   * Get rating stars display
   */
  function getRatingStars(rating?: number): string {
    if (!rating) return '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '★'.repeat(fullStars);
    if (hasHalfStar) stars += '☆';
    return stars;
  }

  /**
   * Get price level display
   */
  function getPriceLevelDisplay(priceLevel?: number): string {
    if (!priceLevel) return '';
    return '€'.repeat(priceLevel);
  }

  /**
   * Get venue type display name
   */
  function getVenueTypeDisplay(type: string): string {
    const displayNames: { [key: string]: string } = {
      cafe: 'Café',
      coworking: 'Co-working Space',
      library: 'Library',
      restaurant: 'Restaurant',
      other: 'Other'
    };
    return displayNames[type] || type;
  }

  /**
   * Get venue type icon
   */
  function getVenueTypeIcon(type: string): string {
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
   * Close InfoWindow
   */
  export function close(): void {
    if (infoWindow) {
      infoWindow.close();
    }
  }

  /**
   * Open InfoWindow at specific position
   */
  export function openAt(position: LocationCoords): void {
    if (infoWindow && map) {
      infoWindow.setPosition(new google.maps.LatLng(position.lat, position.lng));
      infoWindow.open(map);
    }
  }
</script>

<!-- InfoWindow content template -->
<div bind:this={contentElement} class="venue-info-window">
  {#if venue}
    <div class="venue-header">
      <div class="venue-icon">
        {getVenueTypeIcon(venue.venueType)}
      </div>
      <div class="venue-basic-info">
        <h3 class="venue-name">{venue.name}</h3>
        <p class="venue-type">{getVenueTypeDisplay(venue.venueType)}</p>
      </div>
      {#if venue.isOpen !== undefined}
        <div class="venue-status">
          <span class="status-indicator {venue.isOpen ? 'open' : 'closed'}">
            {venue.isOpen ? 'Open' : 'Closed'}
          </span>
        </div>
      {/if}
    </div>

    <div class="venue-address">
      <span class="address-icon">📍</span>
      <span class="address-text">{venue.address}</span>
    </div>

    {#if venue.rating || venue.priceLevel}
      <div class="venue-ratings">
        {#if venue.rating}
          <div class="rating">
            <span class="stars">{getRatingStars(venue.rating)}</span>
            <span class="rating-value">{venue.rating.toFixed(1)}</span>
            {#if venue.reviewCount}
              <span class="review-count">({venue.reviewCount} reviews)</span>
            {/if}
          </div>
        {/if}
        {#if venue.priceLevel}
          <div class="price-level">
            <span class="price-symbols">{getPriceLevelDisplay(venue.priceLevel)}</span>
          </div>
        {/if}
      </div>
    {/if}

    {#if venue.description}
      <div class="venue-description">
        <p>{venue.description}</p>
      </div>
    {/if}

    {#if venue.amenities && venue.amenities.length > 0}
      <div class="venue-amenities">
        <h4>Amenities</h4>
        <div class="amenities-list">
          {#each venue.amenities.slice(0, 6) as amenity}
            <span class="amenity-tag">{amenity}</span>
          {/each}
        </div>
      </div>
    {/if}

    <div class="venue-actions">
      {#if venue.website}
        <a href={venue.website} target="_blank" rel="noopener noreferrer" class="action-button website">
          🌐 Website
        </a>
      {/if}
      {#if venue.phone}
        <a href="tel:{venue.phone}" class="action-button phone">
          📞 Call
        </a>
      {/if}
      <button class="action-button directions" onclick={() => {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${venue.position.lat},${venue.position.lng}`;
        window.open(url, '_blank');
      }}>
        🧭 Directions
      </button>
    </div>

    {#if venue.photos && venue.photos.length > 0}
      <div class="venue-photos">
        <div class="photo-gallery">
          {#each venue.photos.slice(0, 3) as photo}
            <img src={photo} alt="{venue.name} photo" class="venue-photo" />
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .venue-info-window {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 320px;
    padding: 0;
    margin: 0;
  }

  .venue-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e5e7eb;
  }

  .venue-icon {
    font-size: 24px;
    flex-shrink: 0;
  }

  .venue-basic-info {
    flex-grow: 1;
  }

  .venue-name {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
    color: #1f2937;
    line-height: 1.4;
  }

  .venue-type {
    font-size: 12px;
    color: #6b7280;
    margin: 2px 0 0 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .venue-status {
    flex-shrink: 0;
  }

  .status-indicator {
    font-size: 11px;
    padding: 4px 8px;
    border-radius: 12px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .status-indicator.open {
    background-color: #d1fae5;
    color: #065f46;
  }

  .status-indicator.closed {
    background-color: #fee2e2;
    color: #991b1b;
  }

  .venue-address {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 12px;
    font-size: 14px;
    color: #4b5563;
  }

  .address-icon {
    font-size: 12px;
    opacity: 0.7;
  }

  .venue-ratings {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding: 8px;
    background-color: #f9fafb;
    border-radius: 6px;
  }

  .rating {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .stars {
    color: #fbbf24;
    font-size: 14px;
  }

  .rating-value {
    font-weight: 600;
    font-size: 14px;
    color: #1f2937;
  }

  .review-count {
    font-size: 12px;
    color: #6b7280;
  }

  .price-level {
    font-weight: 600;
    color: #059669;
  }

  .venue-description {
    margin-bottom: 12px;
  }

  .venue-description p {
    font-size: 14px;
    color: #4b5563;
    line-height: 1.5;
    margin: 0;
  }

  .venue-amenities {
    margin-bottom: 12px;
  }

  .venue-amenities h4 {
    font-size: 13px;
    font-weight: 600;
    margin: 0 0 6px 0;
    color: #374151;
  }

  .amenities-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .amenity-tag {
    font-size: 11px;
    padding: 3px 6px;
    background-color: #e5e7eb;
    color: #374151;
    border-radius: 4px;
    white-space: nowrap;
  }

  .venue-actions {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }

  .action-button {
    font-size: 12px;
    padding: 6px 10px;
    border-radius: 4px;
    text-decoration: none;
    font-weight: 500;
    border: 1px solid #d1d5db;
    background-color: white;
    color: #374151;
    cursor: pointer;
    transition: all 0.2s;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .action-button:hover {
    background-color: #f3f4f6;
    border-color: #9ca3af;
  }

  .action-button.website {
    background-color: #eff6ff;
    border-color: #3b82f6;
    color: #1d4ed8;
  }

  .action-button.phone {
    background-color: #f0fdf4;
    border-color: #22c55e;
    color: #16a34a;
  }

  .action-button.directions {
    background-color: #fef3c7;
    border-color: #f59e0b;
    color: #d97706;
  }

  .venue-photos {
    margin-top: 8px;
    border-top: 1px solid #e5e7eb;
    padding-top: 8px;
  }

  .photo-gallery {
    display: flex;
    gap: 4px;
    overflow-x: auto;
  }

  .venue-photo {
    width: 60px;
    height: 60px;
    border-radius: 4px;
    object-fit: cover;
    flex-shrink: 0;
  }

  /* Mobile responsive adjustments */
  @media (max-width: 480px) {
    .venue-info-window {
      max-width: 280px;
    }
    
    .venue-actions {
      flex-direction: column;
    }
    
    .action-button {
      justify-content: center;
    }
  }
</style>