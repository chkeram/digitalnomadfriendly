<script lang="ts">
  import { user, isAuthenticated, authLoading, authError } from '$lib/stores/auth'
  import type { PageData } from './$types'
  
  export let data: PageData
  
  // Use server-provided auth state as the source of truth
  $: authenticatedUser = data.user
  $: isUserAuthenticated = Boolean(data.session && data.user)
</script>

<svelte:head>
  <title>Profile - Digital Nomad Friendly</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  {#if $authLoading}
    <div class="text-center py-12">
      <div class="text-lg text-gray-600">Loading...</div>
    </div>
  {:else if $authError}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div class="text-red-800">{$authError}</div>
    </div>
  {:else if isUserAuthenticated && authenticatedUser}
    <div class="max-w-2xl">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Your Profile</h1>
      
      <div class="card space-y-6">
        <div class="flex items-center space-x-4">
          {#if authenticatedUser.avatar_url}
            <img 
              src={authenticatedUser.avatar_url} 
              alt="Profile"
              class="w-16 h-16 rounded-full"
            >
          {:else}
            <div class="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
              <span class="text-xl font-medium text-gray-600">
                {authenticatedUser.name?.charAt(0) || authenticatedUser.email.charAt(0)}
              </span>
            </div>
          {/if}
          
          <div>
            <h2 class="text-xl font-semibold text-gray-900">
              {authenticatedUser.name || 'Digital Nomad'}
            </h2>
            <p class="text-gray-600">{authenticatedUser.email}</p>
          </div>
        </div>
        
        <div class="border-t border-gray-200 pt-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
          <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt class="text-sm font-medium text-gray-500">Member since</dt>
              <dd class="text-sm text-gray-900">
                {new Date(authenticatedUser.created_at).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Last login</dt>
              <dd class="text-sm text-gray-900">
                {authenticatedUser.last_login_at 
                  ? new Date(authenticatedUser.last_login_at).toLocaleDateString()
                  : 'Never'
                }
              </dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Reviews written</dt>
              <dd class="text-sm text-gray-900">{authenticatedUser.total_reviews}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">Venues visited</dt>
              <dd class="text-sm text-gray-900">{authenticatedUser.total_venues_visited}</dd>
            </div>
          </dl>
        </div>
        
        <div class="border-t border-gray-200 pt-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Work Preferences</h3>
          <p class="text-sm text-gray-600 mb-4">
            Customize your preferences to get better venue recommendations.
          </p>
          <button class="btn-primary">
            Update Preferences
          </button>
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