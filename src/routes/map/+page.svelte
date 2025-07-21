<script lang="ts">
  import MapContainer from '$lib/components/map/MapContainer.svelte';
  import { locationStore } from '$lib/stores/location';
  import { mapStore } from '$lib/stores/map';
  import { googleMapsService } from '$lib/services/maps.js';
  import { PUBLIC_GOOGLE_MAPS_API_KEY } from '$env/static/public';
  import type { LocationCoords } from '$lib/types';

  // Sample test locations
  const sampleLocations = [
    { name: 'NYC', coords: { lat: 40.7128, lng: -74.0060 } },
    { name: 'SF', coords: { lat: 37.7749, lng: -122.4194 } },
    { name: 'LA', coords: { lat: 34.0522, lng: -118.2437 } },
    { name: 'Chicago', coords: { lat: 41.8781, lng: -87.6298 } }
  ];

  let selectedLocation: LocationCoords | null = null;
  let mapHeight = '500px';
  let followUser = false;

  function setLocation(coords: LocationCoords) {
    selectedLocation = coords;
  }

  function centerOnCurrentLocation() {
    if ($locationStore.currentLocation) {
      selectedLocation = $locationStore.currentLocation;
    }
  }


  // API Key Test Function (development only)
  async function testApiKey() {
    console.log('🔑 API Key Configuration Test');
    console.log('API Key configured:', !!PUBLIC_GOOGLE_MAPS_API_KEY);
    
    if (PUBLIC_GOOGLE_MAPS_API_KEY) {
      console.log('✅ Google Maps API key is configured');
    } else {
      console.log('❌ Google Maps API key is missing');
    }
  }

  // Cost optimization test
  async function testCostOptimization() {
    try {
      const stats = googleMapsService.getCostOptimizationStats();
      console.log('💰 Cost Optimization Stats');
      console.log('Daily budget status:', stats.budget.withinBudget ? '✅ Within budget' : '⚠️ Over budget');
      console.log('API usage today:', stats.usage.costs.daily.toFixed(2), 'USD');
      console.log('Cache items:', stats.cache.size, 'Total hits:', stats.cache.totalHits);
      console.log('Usage breakdown:', stats.usage.costs.breakdown);
    } catch (error) {
      console.error('❌ Cost optimization test failed:', error);
    }
  }
</script>

<svelte:head>
  <title>Map Test - Digital Nomad Friendly</title>
</svelte:head>

<div class="container mx-auto px-4 py-8 space-y-6">
  <div class="text-center">
    <h1 class="text-3xl font-bold text-gray-900 mb-2">Google Maps Integration Test</h1>
    <p class="text-gray-600">Testing the MapContainer component with various features</p>
  </div>

  <!-- Controls -->
  <div class="bg-white rounded-lg shadow-md p-6">
    <h2 class="text-xl font-semibold mb-4">Map Controls</h2>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
      <div>
        <label for="mapHeight" class="block text-sm font-medium text-gray-700 mb-2">Map Height</label>
        <select id="mapHeight" bind:value={mapHeight} class="w-full border border-gray-300 rounded-md px-3 py-2">
          <option value="300px">300px</option>
          <option value="400px">400px</option>
          <option value="500px">500px</option>
          <option value="600px">600px</option>
        </select>
      </div>

      <div class="flex items-center">
        <input 
          type="checkbox" 
          id="followUser" 
          bind:checked={followUser}
          class="mr-2"
        >
        <label for="followUser" class="text-sm font-medium text-gray-700">
          Follow User Location
        </label>
      </div>

      <div>
        <button 
          onclick={centerOnCurrentLocation}
          disabled={!$locationStore.currentLocation}
          class="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Center on Current Location
        </button>
      </div>

      <div>
        <button 
          onclick={testApiKey}
          class="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
        >
          Test API Key
        </button>
      </div>

      <div>
        <button 
          onclick={testCostOptimization}
          class="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
        >
          Test Cost Optimization
        </button>
      </div>

    </div>

    <div>
      <h3 class="text-sm font-medium text-gray-700 mb-2">Quick Locations</h3>
      <div class="flex flex-wrap gap-2">
        {#each sampleLocations as location}
          <button 
            onclick={() => setLocation(location.coords)}
            class="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium"
          >
            {location.name}
          </button>
        {/each}
        <button 
          onclick={() => selectedLocation = null}
          class="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm font-medium"
        >
          Clear
        </button>
      </div>
    </div>
  </div>

  <!-- Map -->
  <div class="bg-white rounded-lg shadow-md p-6">
    <h2 class="text-xl font-semibold mb-4">Map Component</h2>
    
    <MapContainer 
      center={selectedLocation}
      height={mapHeight}
      enableCurrentLocation={true}
      showVenues={true}
      venueSearchRadius={5000}
      className="border border-gray-200"
    />
  </div>

  <!-- Status Information -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <!-- Location Status -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold mb-4">Location Status</h2>
      
      <div class="space-y-3">
        <div class="flex justify-between">
          <span class="text-gray-600">Permission:</span>
          <span class="font-medium capitalize">{$locationStore.permissionStatus}</span>
        </div>
        
        <div class="flex justify-between">
          <span class="text-gray-600">Loading:</span>
          <span class="font-medium">{$locationStore.isLoading ? 'Yes' : 'No'}</span>
        </div>
        
        {#if $locationStore.currentLocation}
          <div>
            <span class="text-gray-600">Current Location:</span>
            <div class="text-sm font-mono bg-gray-100 rounded p-2 mt-1">
              Lat: {$locationStore.currentLocation.lat.toFixed(6)}<br>
              Lng: {$locationStore.currentLocation.lng.toFixed(6)}
            </div>
          </div>
        {:else}
          <div>
            <span class="text-gray-600">Current Location:</span>
            <span class="text-gray-400 italic">Not detected</span>
          </div>
        {/if}
        
        {#if $locationStore.error}
          <div class="text-red-600 text-sm">
            Error: {$locationStore.error}
          </div>
        {/if}
      </div>
    </div>

    <!-- Map Status -->
    <div class="bg-white rounded-lg shadow-md p-6">
      <h2 class="text-xl font-semibold mb-4">Map Status</h2>
      
      <div class="space-y-3">
        <div class="flex justify-between">
          <span class="text-gray-600">Loaded:</span>
          <span class="font-medium">{$mapStore.isLoaded ? 'Yes' : 'No'}</span>
        </div>
        
        <div class="flex justify-between">
          <span class="text-gray-600">Loading:</span>
          <span class="font-medium">{$mapStore.isLoading ? 'Yes' : 'No'}</span>
        </div>
        
        <div class="flex justify-between">
          <span class="text-gray-600">Zoom:</span>
          <span class="font-medium">{$mapStore.zoom}</span>
        </div>
        
        {#if $mapStore.center}
          <div>
            <span class="text-gray-600">Center:</span>
            <div class="text-sm font-mono bg-gray-100 rounded p-2 mt-1">
              Lat: {$mapStore.center.lat.toFixed(6)}<br>
              Lng: {$mapStore.center.lng.toFixed(6)}
            </div>
          </div>
        {:else}
          <div>
            <span class="text-gray-600">Center:</span>
            <span class="text-gray-400 italic">Not set</span>
          </div>
        {/if}
        
        {#if $mapStore.error}
          <div class="text-red-600 text-sm">
            Error: {$mapStore.error}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  /* Ensure consistent styling with Tailwind */
  :global(body) {
    background-color: #f9fafb;
  }
</style>