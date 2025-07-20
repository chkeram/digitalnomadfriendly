<script lang="ts">
  import '../app.css'
  import { enhance } from '$app/forms'
  import type { LayoutData } from './$types'
  
  export let data: LayoutData
  $: ({ user, session } = data)
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
          {#if session && user}
            <span class="text-sm text-gray-700">
              Welcome, {user.name || user.email}
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