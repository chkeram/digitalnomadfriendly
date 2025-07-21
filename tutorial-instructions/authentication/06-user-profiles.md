# User Profile System

Complete guide to implementing user profile creation, management, and synchronization with authentication.

## 🎯 Learning Objectives
- Implement automatic user profile creation on first login
- Build user profile management interfaces
- Handle profile data synchronization between auth and database
- Create user preferences and statistics tracking
- Implement profile update workflows

## 🏗️ User Profile Architecture

### Data Flow
```
┌─────────────┐    Login     ┌─────────────┐    Profile    ┌─────────────┐
│   Google    │─────────────▶│  Supabase   │──────────────▶│  Database   │
│   OAuth     │              │    Auth     │              │    Users    │
└─────────────┘              └─────────────┘              └─────────────┘
       │                            │                            │
       │                            │                            │
   User Data                   JWT + Metadata              App User Profile
   (email, name,              (id, email, name,           (preferences,
    avatar, etc.)              avatar_url, etc.)           statistics, etc.)
```

### Profile Components
1. **Auth Profile**: Google OAuth data (managed by Supabase)
2. **Database Profile**: Application-specific user data
3. **Profile Sync**: Automatic synchronization between both
4. **Profile Management**: User interface for editing preferences

## 🗄️ Database Schema

### Users Table Structure
```sql
-- Complete users table from migration
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- User preferences for personalized recommendations
    noise_tolerance INTEGER CHECK (noise_tolerance >= 1 AND noise_tolerance <= 5),
    wifi_importance INTEGER CHECK (wifi_importance >= 1 AND wifi_importance <= 5),
    preferred_seating preferred_seating DEFAULT 'any',
    work_style user_work_style DEFAULT 'mixed',
    
    -- User activity tracking
    total_reviews INTEGER DEFAULT 0,
    total_venues_visited INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP WITH TIME ZONE,
    
    -- Soft delete support
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Custom types for user preferences
CREATE TYPE user_work_style AS ENUM ('focused', 'collaborative', 'mixed');
CREATE TYPE preferred_seating AS ENUM ('quiet', 'social', 'outdoor', 'any');
```

### TypeScript Types
```typescript
// src/lib/types/database.ts
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  
  // User preferences
  noise_tolerance?: number; // 1-5 scale
  wifi_importance?: number; // 1-5 scale
  preferred_seating?: PreferredSeating;
  work_style?: UserWorkStyle;
  
  // User activity tracking
  total_reviews: number;
  total_venues_visited: number;
  is_verified: boolean;
  verification_date?: string;
  
  // Soft delete
  deleted_at?: string;
}

export type UserWorkStyle = 'focused' | 'collaborative' | 'mixed';
export type PreferredSeating = 'quiet' | 'social' | 'outdoor' | 'any';
```

## 🔄 Profile Synchronization Service

### User Service Implementation
```typescript
// src/lib/services/users.ts
import type { User } from '$lib/types/database'
import type { User as SupabaseUser, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '$lib/types/database'

/**
 * Create or update user profile in database from Supabase Auth user
 * This runs automatically on every login to sync profile data
 */
export async function upsertUserProfile(
  supabaseUser: SupabaseUser, 
  supabaseClient: SupabaseClient<Database>
): Promise<User | null> {
  try {
    console.log('🔄 Syncing user profile for:', supabaseUser.email)
    
    // Map Supabase user to our database User format
    const userData = {
      id: supabaseUser.id,  // Use Supabase auth ID as primary key
      email: supabaseUser.email || '',
      name: supabaseUser.user_metadata?.full_name || 
            supabaseUser.user_metadata?.name || '',
      avatar_url: supabaseUser.user_metadata?.avatar_url || '',
      last_login_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
      // Note: We don't override existing preferences on sync
    }

    console.log('📝 Upserting user data:', userData)

    const { data, error } = await supabaseClient
      .from('users')
      .upsert(userData, { 
        onConflict: 'id',
        ignoreDuplicates: false  // Always update last_login_at
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error upserting user profile:', error)
      return null
    }

    console.log('✅ User profile synced successfully')
    return data
  } catch (error) {
    console.error('❌ Unexpected error in upsertUserProfile:', error)
    return null
  }
}

/**
 * Get user profile from database by ID
 */
export async function getUserProfile(
  userId: string, 
  supabaseClient: SupabaseClient<Database>
): Promise<User | null> {
  try {
    const { data, error } = await supabaseClient
      .from('users')
      .select('*')
      .eq('id', userId)
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // User not found - normal for first-time users before sync
        return null
      }
      console.error('❌ Error fetching user profile:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('❌ Unexpected error in getUserProfile:', error)
    return null
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: string, 
  preferences: {
    noise_tolerance?: number
    wifi_importance?: number
    preferred_seating?: 'quiet' | 'social' | 'outdoor' | 'any'
    work_style?: 'focused' | 'collaborative' | 'mixed'
  },
  supabaseClient: SupabaseClient<Database>
): Promise<boolean> {
  try {
    const { error } = await supabaseClient
      .from('users')
      .update({
        ...preferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('❌ Error updating user preferences:', error)
      return false
    }

    console.log('✅ User preferences updated')
    return true
  } catch (error) {
    console.error('❌ Unexpected error in updateUserPreferences:', error)
    return false
  }
}

/**
 * Get user statistics (reviews, venues visited, etc.)
 */
export async function getUserStats(
  userId: string,
  supabaseClient: SupabaseClient<Database>
): Promise<{
  total_reviews: number
  total_venues_visited: number
  favorite_venues: number
} | null> {
  try {
    // Get review count
    const { count: reviewCount } = await supabaseClient
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('deleted_at', null)

    // Get venue visit count (unique venues)
    const { data: venueVisits } = await supabaseClient
      .from('venue_visits')
      .select('venue_id')
      .eq('user_id', userId)

    const uniqueVenues = new Set(venueVisits?.map(visit => visit.venue_id) || [])

    // Get favorites count
    const { count: favoritesCount } = await supabaseClient
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    return {
      total_reviews: reviewCount || 0,
      total_venues_visited: uniqueVenues.size,
      favorite_venues: favoritesCount || 0
    }
  } catch (error) {
    console.error('❌ Error getting user stats:', error)
    return null
  }
}
```

## 🔗 Profile Integration with Authentication

### OAuth Callback Integration
```typescript
// src/routes/auth/callback/+server.ts
import { redirect } from '@sveltejs/kit'
import { upsertUserProfile } from '$lib/services/users'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ url, locals }) => {
  const code = url.searchParams.get('code')
  const next = url.searchParams.get('redirectTo') ?? '/'

  if (code) {
    // Exchange OAuth code for session
    const { data, error } = await locals.supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.session) {
      // Verify session is valid
      const { data: userData, error: userError } = await locals.supabase.auth.getUser()
      
      if (!userError && userData.user) {
        console.log('✅ User authenticated:', userData.user.email)
        
        // 🔄 CRITICAL: Sync user profile to database
        const dbUser = await upsertUserProfile(userData.user, locals.supabase)
        
        if (dbUser) {
          console.log('✅ User profile synced to database')
        } else {
          console.log('⚠️ User profile sync failed, but authentication successful')
          // Continue with authentication even if profile sync fails
        }
        
        throw redirect(303, next)
      }
    }
    
    console.error('❌ OAuth callback error:', error)
    throw redirect(303, '/auth/login?error=Authentication failed')
  }

  throw redirect(303, '/auth/login?error=Invalid callback')
}
```

## 🎨 Profile Management Interface

### Profile Page Server Logic
```typescript
// src/routes/profile/+page.server.ts
import { fail } from '@sveltejs/kit'
import { getUserProfile, getUserStats, updateUserPreferences } from '$lib/services/users'
import type { PageServerLoad, Actions } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
  const { session, user } = await locals.safeGetSession()
  
  if (!session || !user) {
    return {
      session: null,
      user: null,
      dbUser: null,
      userStats: null
    }
  }

  // Get user profile from database
  const dbUser = await getUserProfile(user.id, locals.supabase)
  
  // Get user statistics
  const userStats = await getUserStats(user.id, locals.supabase)

  return {
    session,
    user,        // Auth user data
    dbUser,      // Database user profile
    userStats    // User activity statistics
  }
}

export const actions: Actions = {
  updatePreferences: async ({ request, locals }) => {
    const { session, user } = await locals.safeGetSession()
    
    if (!session || !user) {
      return fail(401, { error: 'Unauthorized' })
    }

    const formData = await request.formData()
    const preferences = {
      noise_tolerance: parseInt(formData.get('noise_tolerance') as string),
      wifi_importance: parseInt(formData.get('wifi_importance') as string),
      preferred_seating: formData.get('preferred_seating') as 'quiet' | 'social' | 'outdoor' | 'any',
      work_style: formData.get('work_style') as 'focused' | 'collaborative' | 'mixed'
    }

    // Validate preferences
    if (preferences.noise_tolerance < 1 || preferences.noise_tolerance > 5 ||
        preferences.wifi_importance < 1 || preferences.wifi_importance > 5) {
      return fail(400, { error: 'Invalid preference values' })
    }

    const success = await updateUserPreferences(user.id, preferences, locals.supabase)
    
    if (!success) {
      return fail(500, { error: 'Failed to update preferences' })
    }

    return { success: true }
  }
}
```

### Profile Page Component
```svelte
<!-- src/routes/profile/+page.svelte -->
<script lang="ts">
  import { enhance } from '$app/forms'
  import type { PageData } from './$types'
  
  export let data: PageData
  
  // Use server-provided data as source of truth
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
  {#if isUserAuthenticated && displayUser}
    <div class="max-w-2xl">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Your Profile</h1>
      
      <div class="card space-y-6">
        <!-- Profile Header -->
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
            
            <!-- Sync Status Indicator -->
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
        
        <!-- Account Information -->
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
        
        <!-- Work Preferences -->
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
            <!-- Preferences Edit Form -->
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
                
                <!-- Other preference fields... -->
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
            <!-- Preferences Display -->
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt class="text-sm font-medium text-gray-500">Noise Tolerance</dt>
                <dd class="text-sm text-gray-900">
                  {dbUser?.noise_tolerance || 'Not set'} 
                  {dbUser?.noise_tolerance ? '/ 5' : ''}
                </dd>
              </div>
              <!-- Other preference displays... -->
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
    <!-- Not authenticated -->
    <div class="text-center py-12">
      <h1 class="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
      <p class="text-gray-600 mb-6">You need to be signed in to view your profile.</p>
      <a href="/auth/login?redirectTo=/profile" class="btn-primary">
        Sign In
      </a>
    </div>
  {/if}
</div>
```

## 🔍 Profile State Management

### Understanding Profile Data Sources
```typescript
// Three potential sources of user data:
1. Auth User (authUser): From Supabase Auth (Google OAuth data)
2. Database User (dbUser): From our users table (preferences, stats)
3. Display User (displayUser): Combined view for UI

// Priority order:
displayUser = dbUser || authUser

// Why this matters:
- authUser: Always available when logged in, but limited data
- dbUser: Rich profile data, but may not exist for new users
- displayUser: Best data available for UI, handles both cases
```

### Sync Status Indicator
```svelte
<!-- Visual feedback for sync status -->
{#if dbUser}
  <span class="status-badge status-success">
    Profile Synced
  </span>
{:else}
  <span class="status-badge status-warning">
    Sync Pending
  </span>
{/if}

<style>
  .status-badge {
    @apply inline-flex items-center px-2 py-1 rounded-full text-xs font-medium;
  }
  .status-success {
    @apply bg-green-100 text-green-800;
  }
  .status-warning {
    @apply bg-yellow-100 text-yellow-800;
  }
</style>
```

## 🧪 Testing Profile System

### Manual Testing Checklist
- [ ] New user login creates database profile
- [ ] Profile page shows correct sync status
- [ ] Preferences can be updated and persist
- [ ] User statistics display correctly
- [ ] Profile sync works on subsequent logins

### Automated Testing
```typescript
// Test profile creation
test('creates user profile on first login', async () => {
  const mockSupabaseUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
      full_name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg'
    }
  }
  
  const result = await upsertUserProfile(mockSupabaseUser, mockSupabaseClient)
  
  expect(result).toBeDefined()
  expect(result.email).toBe('test@example.com')
  expect(result.name).toBe('Test User')
})

// Test preferences update
test('updates user preferences correctly', async () => {
  const preferences = {
    noise_tolerance: 4,
    wifi_importance: 5,
    preferred_seating: 'quiet',
    work_style: 'focused'
  }
  
  const success = await updateUserPreferences('test-user-id', preferences, mockSupabaseClient)
  
  expect(success).toBe(true)
})
```

## 🔗 Next Steps

1. **[Row Level Security](./07-rls-security.md)** - Secure profile data
2. **[Route Protection](./08-route-protection.md)** - Protect profile routes
3. **[Error Handling](./10-error-handling.md)** - Handle profile errors

---

The user profile system bridges authentication and application functionality, providing a foundation for personalized features and user preferences.