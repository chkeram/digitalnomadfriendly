<script lang="ts">
  import { enhance } from '$app/forms'
  import type { PageData } from './$types'
  
  export let data: PageData
  
  // Use server-provided data
  $: ({ session, user: authUser, dbUser, userStats } = data)
  $: isUserAuthenticated = Boolean(session && authUser)
  
  // Use database user data if available, fallback to auth user
  $: displayUser = dbUser || authUser
  
  let isEditingPreferences = false
  let preferencesForm = {
    noise_tolerance: dbUser?.noise_tolerance || 3,
    wifi_importance: dbUser?.wifi_importance || 4,
    preferred_seating: dbUser?.preferred_seating || 'any',
    work_style: dbUser?.work_style || 'mixed'
  }
</script>

<svelte:head>
  <title>Profile - Digital Nomad Friendly</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  {#if !data}
    <div class="text-center py-12">
      <div class="text-lg text-gray-600">Loading...</div>
    </div>
  {:else if isUserAuthenticated && displayUser}
    <div class="max-w-2xl">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Your Profile</h1>
      
      <div class="card space-y-6">
        <div class="flex items-center space-x-4">
          {#if displayUser.avatar_url}
            <img 
              src={displayUser.avatar_url} 
              alt="Profile"
              class="w-16 h-16 rounded-full"
            >
          {:else}
            <div class="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
              <span class="text-xl font-medium text-gray-600">
                {displayUser.name?.charAt(0) || displayUser.email.charAt(0)}
              </span>
            </div>
          {/if}
          
          <div>
            <h2 class="text-xl font-semibold text-gray-900">
              {displayUser.name || 'Digital Nomad'}
            </h2>
            <p class="text-gray-600">{displayUser.email}</p>
            {#if dbUser}
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                Profile Synced
              </span>
            {:else}
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-1">
                Sync Pending
              </span>
            {/if}
          </div>
        </div>
        
        <div class="border-t border-gray-200 pt-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
          <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt class="text-sm font-medium text-gray-500">Member since</dt>
              <dd class="text-sm text-gray-900">
                {new Date(displayUser.created_at).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Last login</dt>
              <dd class="text-sm text-gray-900">
                {dbUser?.last_login_at 
                  ? new Date(dbUser.last_login_at).toLocaleDateString()
                  : 'Never'
                }
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Reviews written</dt>
              <dd class="text-sm text-gray-900">{userStats?.total_reviews || 0}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Venues visited</dt>
              <dd class="text-sm text-gray-900">{userStats?.total_venues_visited || 0}</dd>
            </div>
          </dl>
        </div>
        
        <div class="border-t border-gray-200 pt-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-gray-900">Work Preferences</h3>
            <button 
              type="button"
              class="text-sm text-blue-600 hover:text-blue-700"
              on:click={() => isEditingPreferences = !isEditingPreferences}
            >
              {isEditingPreferences ? 'Cancel' : 'Edit'}
            </button>
          </div>
          
          {#if isEditingPreferences}
            <form method="POST" action="?/updatePreferences" use:enhance class="space-y-4">
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label for="noise_tolerance" class="block text-sm font-medium text-gray-700 mb-1">
                    Noise Tolerance (1-5)
                  </label>
                  <select 
                    id="noise_tolerance" 
                    name="noise_tolerance" 
                    bind:value={preferencesForm.noise_tolerance}
                    class="w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value={1}>1 - Very Quiet</option>
                    <option value={2}>2 - Quiet</option>
                    <option value={3}>3 - Moderate</option>
                    <option value={4}>4 - Lively</option>
                    <option value={5}>5 - Very Busy</option>
                  </select>
                </div>
                
                <div>
                  <label for="wifi_importance" class="block text-sm font-medium text-gray-700 mb-1">
                    WiFi Importance (1-5)
                  </label>
                  <select 
                    id="wifi_importance" 
                    name="wifi_importance" 
                    bind:value={preferencesForm.wifi_importance}
                    class="w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value={1}>1 - Not Important</option>
                    <option value={2}>2 - Somewhat Important</option>
                    <option value={3}>3 - Important</option>
                    <option value={4}>4 - Very Important</option>
                    <option value={5}>5 - Critical</option>
                  </select>
                </div>
                
                <div>
                  <label for="preferred_seating" class="block text-sm font-medium text-gray-700 mb-1">
                    Preferred Seating
                  </label>
                  <select 
                    id="preferred_seating" 
                    name="preferred_seating" 
                    bind:value={preferencesForm.preferred_seating}
                    class="w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="quiet">Quiet Area</option>
                    <option value="social">Social Area</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="any">Any</option>
                  </select>
                </div>
                
                <div>
                  <label for="work_style" class="block text-sm font-medium text-gray-700 mb-1">
                    Work Style
                  </label>
                  <select 
                    id="work_style" 
                    name="work_style" 
                    bind:value={preferencesForm.work_style}
                    class="w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="focused">Focused</option>
                    <option value="collaborative">Collaborative</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
              </div>
              
              <div class="flex space-x-3">
                <button type="submit" class="btn-primary">
                  Save Preferences
                </button>
                <button 
                  type="button" 
                  class="btn-secondary"
                  on:click={() => isEditingPreferences = false}
                >
                  Cancel
                </button>
              </div>
            </form>
          {:else}
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt class="text-sm font-medium text-gray-500">Noise Tolerance</dt>
                <dd class="text-sm text-gray-900">
                  {dbUser?.noise_tolerance || 'Not set'} 
                  {dbUser?.noise_tolerance ? '/ 5' : ''}
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">WiFi Importance</dt>
                <dd class="text-sm text-gray-900">
                  {dbUser?.wifi_importance || 'Not set'}
                  {dbUser?.wifi_importance ? '/ 5' : ''}
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Preferred Seating</dt>
                <dd class="text-sm text-gray-900 capitalize">
                  {dbUser?.preferred_seating || 'Not set'}
                </dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">Work Style</dt>
                <dd class="text-sm text-gray-900 capitalize">
                  {dbUser?.work_style || 'Not set'}
                </dd>
              </div>
            </div>
            
            {#if !dbUser}
              <p class="text-sm text-gray-600 mt-4">
                Complete your profile by setting your work preferences to get better venue recommendations.
              </p>
            {/if}
          {/if}
        </div>
      </div>
    </div>
  {:else}
    <div class="text-center py-12">
      <h1 class="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
      <p class="text-gray-600 mb-6">You need to be signed in to view your profile.</p>
      <a href="/auth/login?redirectTo=/profile" class="btn-primary">
        Sign In
      </a>
    </div>
  {/if}
</div>