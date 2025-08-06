<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Venue } from '$lib/services/places';

  // Props interface
  interface Props {
    searchQuery?: string;
    selectedVenueTypes?: string[];
    searchRadius?: number;
    minRating?: number;
    maxPriceLevel?: number;
    isSearching?: boolean;
  }

  // Get props with defaults
  const {
    searchQuery: initialSearchQuery = '',
    selectedVenueTypes: initialSelectedVenueTypes = ['cafe', 'restaurant', 'library'],
    searchRadius: initialSearchRadius = 2000,
    minRating: initialMinRating = 0,
    maxPriceLevel: initialMaxPriceLevel = 4,
    isSearching = false
  }: Props = $props();

  // Internal state using $state
  let searchQuery = $state(initialSearchQuery);
  let selectedVenueTypes = $state<string[]>(initialSelectedVenueTypes);
  let searchRadius = $state(initialSearchRadius);
  let minRating = $state(initialMinRating);
  let maxPriceLevel = $state(initialMaxPriceLevel);

  // Event dispatcher for parent component
  const dispatch = createEventDispatcher<{
    search: { 
      query: string; 
      filters: {
        venueTypes: string[];
        radius: number;
        minRating: number;
        maxPriceLevel: number;
      }
    };
    clear: void;
  }>();

  // Venue type options with icons
  const venueTypeOptions = [
    { value: 'cafe', label: 'Cafés', icon: '☕', color: 'bg-amber-100 text-amber-800' },
    { value: 'restaurant', label: 'Restaurants', icon: '🍽️', color: 'bg-red-100 text-red-800' },
    { value: 'library', label: 'Libraries', icon: '📚', color: 'bg-blue-100 text-blue-800' },
    { value: 'coworking', label: 'Co-working', icon: '💼', color: 'bg-purple-100 text-purple-800' }
  ];

  // Search radius options
  const radiusOptions = [
    { value: 500, label: '500m' },
    { value: 1000, label: '1km' },
    { value: 2000, label: '2km' },
    { value: 5000, label: '5km' },
    { value: 10000, label: '10km' }
  ];

  // Price level labels
  const priceLevels = [
    { value: 1, label: '€', description: 'Budget' },
    { value: 2, label: '€€', description: 'Moderate' },
    { value: 3, label: '€€€', description: 'Expensive' },
    { value: 4, label: '€€€€', description: 'Very Expensive' }
  ];

  // Toggle venue type selection
  function toggleVenueType(type: string) {
    if (selectedVenueTypes.includes(type)) {
      selectedVenueTypes = selectedVenueTypes.filter(t => t !== type);
    } else {
      selectedVenueTypes = [...selectedVenueTypes, type];
    }
    triggerSearch();
  }

  // Trigger search with current filters
  function triggerSearch() {
    dispatch('search', {
      query: searchQuery.trim(),
      filters: {
        venueTypes: selectedVenueTypes,
        radius: searchRadius,
        minRating,
        maxPriceLevel
      }
    });
  }

  // Clear all filters
  function clearFilters() {
    searchQuery = '';
    selectedVenueTypes = ['cafe', 'restaurant', 'library'];
    searchRadius = 2000;
    minRating = 0;
    maxPriceLevel = 4;
    dispatch('clear');
  }

  // Handle search input with debouncing
  let searchTimeout: ReturnType<typeof setTimeout>;
  function handleSearchInput() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      triggerSearch();
    }, 500); // 500ms debounce
  }

  // Handle Enter key in search input
  function handleSearchKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      clearTimeout(searchTimeout);
      triggerSearch();
    }
  }
</script>

<div class="venue-search-filters">
  <!-- Search Header -->
  <div class="search-header">
    <h2 class="search-title">
      <span class="search-icon">🔍</span>
      Find Venues
    </h2>
    <button 
      class="clear-button"
      onclick={clearFilters}
      title="Clear all filters"
    >
      Clear All
    </button>
  </div>

  <!-- Main Search Input -->
  <div class="search-input-container">
    <input
      type="text"
      bind:value={searchQuery}
      oninput={handleSearchInput}
      onkeydown={handleSearchKeydown}
      placeholder="Search venues by name or keyword..."
      class="search-input"
      disabled={isSearching}
    />
    {#if isSearching}
      <div class="search-spinner"></div>
    {:else}
      <button 
        class="search-button"
        onclick={triggerSearch}
        title="Search"
      >
        🔍
      </button>
    {/if}
  </div>

  <!-- Filters Grid -->
  <div class="filters-grid">
    
    <!-- Venue Types Filter -->
    <div class="filter-section">
      <label class="filter-label">Venue Types</label>
      <div class="venue-types-grid">
        {#each venueTypeOptions as option}
          <button
            class="venue-type-button {selectedVenueTypes.includes(option.value) ? 'selected' : ''} {option.color}"
            onclick={() => toggleVenueType(option.value)}
            title={option.label}
          >
            <span class="venue-type-icon">{option.icon}</span>
            <span class="venue-type-label">{option.label}</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- Search Radius Filter -->
    <div class="filter-section">
      <label class="filter-label">Search Radius</label>
      <select 
        bind:value={searchRadius}
        onchange={triggerSearch}
        class="radius-select"
      >
        {#each radiusOptions as option}
          <option value={option.value}>{option.label}</option>
        {/each}
      </select>
    </div>

    <!-- Rating Filter -->
    <div class="filter-section">
      <label class="filter-label">
        Minimum Rating: {minRating > 0 ? `${minRating}+ ⭐` : 'Any'}
      </label>
      <input
        type="range"
        min="0"
        max="5"
        step="0.5"
        bind:value={minRating}
        onchange={triggerSearch}
        class="rating-slider"
      />
      <div class="rating-labels">
        <span>Any</span>
        <span>⭐⭐⭐⭐⭐</span>
      </div>
    </div>

    <!-- Price Level Filter -->
    <div class="filter-section">
      <label class="filter-label">
        Maximum Price: {maxPriceLevel < 4 ? priceLevels.find(p => p.value === maxPriceLevel)?.label : 'Any'}
      </label>
      <div class="price-buttons">
        {#each priceLevels as price}
          <button
            class="price-button {maxPriceLevel >= price.value ? 'selected' : ''}"
            onclick={() => { maxPriceLevel = price.value; triggerSearch(); }}
            title={price.description}
          >
            {price.label}
          </button>
        {/each}
        <button
          class="price-button any-price {maxPriceLevel === 4 ? 'selected' : ''}"
          onclick={() => { maxPriceLevel = 4; triggerSearch(); }}
          title="Any price level"
        >
          Any
        </button>
      </div>
    </div>

  </div>

  <!-- Active Filters Summary -->
  {#if selectedVenueTypes.length < 4 || searchQuery || minRating > 0 || maxPriceLevel < 4}
    <div class="active-filters">
      <span class="active-filters-label">Active filters:</span>
      
      {#if searchQuery}
        <span class="filter-tag">
          Search: "{searchQuery}"
          <button onclick={() => { searchQuery = ''; triggerSearch(); }}>×</button>
        </span>
      {/if}

      {#if selectedVenueTypes.length < 4}
        <span class="filter-tag">
          Types: {selectedVenueTypes.map(t => venueTypeOptions.find(o => o.value === t)?.label).join(', ')}
          <button onclick={() => { selectedVenueTypes = ['cafe', 'restaurant', 'library']; triggerSearch(); }}>×</button>
        </span>
      {/if}

      {#if minRating > 0}
        <span class="filter-tag">
          Rating: {minRating}+ ⭐
          <button onclick={() => { minRating = 0; triggerSearch(); }}>×</button>
        </span>
      {/if}

      {#if maxPriceLevel < 4}
        <span class="filter-tag">
          Price: {priceLevels.find(p => p.value === maxPriceLevel)?.label} max
          <button onclick={() => { maxPriceLevel = 4; triggerSearch(); }}>×</button>
        </span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .venue-search-filters {
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    padding: 1.5rem;
    margin-bottom: 1rem;
    border: 1px solid #e5e7eb;
  }

  /* Header */
  .search-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .search-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
  }

  .search-icon {
    font-size: 1rem;
  }

  .clear-button {
    background: #f3f4f6;
    color: #6b7280;
    border: none;
    padding: 0.5rem 0.75rem;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .clear-button:hover {
    background: #e5e7eb;
    color: #4b5563;
  }

  /* Search Input */
  .search-input-container {
    position: relative;
    margin-bottom: 1.5rem;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem 3rem 0.75rem 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    font-size: 1rem;
    transition: border-color 0.2s;
  }

  .search-input:focus {
    outline: none;
    border-color: #3b82f6;
  }

  .search-input:disabled {
    background: #f9fafb;
    color: #9ca3af;
  }

  .search-button {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    background: #3b82f6;
    color: white;
    border: none;
    padding: 0.5rem;
    border-radius: 0.375rem;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.2s;
  }

  .search-button:hover {
    background: #2563eb;
  }

  .search-spinner {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    width: 1rem;
    height: 1rem;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  /* Filters Grid */
  .filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .filter-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .filter-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
  }

  /* Venue Types */
  .venue-types-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .venue-type-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    border: 2px solid transparent;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .venue-type-button:hover {
    opacity: 0.8;
  }

  .venue-type-button.selected {
    border-color: currentColor;
    box-shadow: 0 0 0 2px currentColor;
  }

  .venue-type-icon {
    font-size: 1.25rem;
  }

  /* Radius Select */
  .radius-select {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    background: white;
    cursor: pointer;
  }

  .radius-select:focus {
    outline: none;
    border-color: #3b82f6;
  }

  /* Rating Slider */
  .rating-slider {
    -webkit-appearance: none;
    appearance: none;
    height: 0.5rem;
    background: #e5e7eb;
    border-radius: 0.25rem;
    outline: none;
    cursor: pointer;
  }

  .rating-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 1.25rem;
    height: 1.25rem;
    background: #3b82f6;
    border-radius: 50%;
    cursor: pointer;
  }

  .rating-slider::-moz-range-thumb {
    width: 1.25rem;
    height: 1.25rem;
    background: #3b82f6;
    border-radius: 50%;
    cursor: pointer;
    border: none;
  }

  .rating-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: #6b7280;
  }

  /* Price Buttons */
  .price-buttons {
    display: flex;
    gap: 0.25rem;
  }

  .price-button {
    flex: 1;
    padding: 0.5rem;
    border: 2px solid #e5e7eb;
    background: white;
    border-radius: 0.375rem;
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    color: #6b7280;
    transition: all 0.2s;
  }

  .price-button:hover {
    border-color: #d1d5db;
    color: #4b5563;
  }

  .price-button.selected {
    border-color: #3b82f6;
    background: #eff6ff;
    color: #1d4ed8;
  }

  /* Active Filters */
  .active-filters {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #e5e7eb;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }

  .active-filters-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
  }

  .filter-tag {
    background: #3b82f6;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .filter-tag button {
    background: none;
    border: none;
    color: white;
    font-size: 1rem;
    cursor: pointer;
    padding: 0;
    width: 1rem;
    height: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    opacity: 0.8;
  }

  .filter-tag button:hover {
    opacity: 1;
    background: rgba(255, 255, 255, 0.2);
  }

  /* Animations */
  @keyframes spin {
    0% { transform: translateY(-50%) rotate(0deg); }
    100% { transform: translateY(-50%) rotate(360deg); }
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .venue-search-filters {
      padding: 1rem;
    }

    .filters-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .venue-types-grid {
      grid-template-columns: 1fr;
    }

    .price-buttons {
      flex-wrap: wrap;
    }

    .active-filters {
      flex-direction: column;
      align-items: flex-start;
    }
  }
</style>