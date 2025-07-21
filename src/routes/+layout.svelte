<script lang="ts">
  import '../app.css'
  import { onMount } from 'svelte'
  import type { LayoutData } from './$types'
  import { initializeAuth, user, session, isAuthenticated, userDisplayName } from '$lib/stores/auth'
  
  export let data: LayoutData
  
  // Initialize auth store once when component mounts
  onMount(() => {
    const cleanup = initializeAuth(data.session, data.user || null)
    return cleanup
  })
  
  // Use server data as fallback for initial render
  $: currentUser = $user || data.user
  $: currentSession = $session || data.session
  $: isCurrentlyAuthenticated = $isAuthenticated || Boolean(data.session && data.user)
</script>

<div class="min-h-screen bg-gray-50">
  <!-- Simple header with auth status -->
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <div class="flex items-center">
          <h1 class="text-xl font-bold text-gray-900">
            <a href="/" class="hover:text-gray-700">Digital Nomad Friendly</a>
          </h1>
        </div>
        
        <div class="flex items-center space-x-4">
          {#if isCurrentlyAuthenticated}
            <span class="text-sm text-gray-700">
              Welcome, {currentUser?.name || currentUser?.email || 'User'}
            </span>
            <form method="POST" action="/auth/logout">
              <button 
                type="submit"
                class="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign out
              </button>
            </form>
          {:else}
            <a 
              href="/auth/login" 
              class="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign in
            </a>
          {/if}
        </div>
      </div>
    </div>
  </header>

  <main>
    <slot />
  </main>
</div>