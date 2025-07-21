# Supabase Auth Integration

Deep dive into integrating Supabase Auth with SvelteKit for secure authentication.

## 🎯 Learning Objectives
- Configure Supabase Auth for SvelteKit
- Understand Supabase SSR (Server-Side Rendering)
- Implement secure session management
- Handle authentication state across client and server

## 🏗️ Supabase Auth Architecture

### Core Components
```typescript
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Browser       │    │   SvelteKit     │    │   Supabase      │
│   Client        │    │   Server        │    │   Auth          │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • User Actions  │    │ • Session Mgmt  │    │ • JWT Tokens    │
│ • Auth State    │    │ • Route Guards  │    │ • OAuth         │
│ • Reactive UI   │    │ • Cookie Mgmt   │    │ • User Mgmt     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Supabase Client Configuration

### Environment Variables
```bash
# .env
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key
PUBLIC_SUPABASE_AUTH_REDIRECT_URL=http://localhost:5173/auth/callback
```

### Client Setup (`src/lib/supabase.ts`)
```typescript
import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public'
import type { Database } from './types/database'

// Browser client (client-side operations)
export const supabase = createBrowserClient<Database>(
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      // Optional configurations
      // autoRefreshToken: true,
      // persistSession: true,
      // detectSessionInUrl: true
    }
  }
)

// Server client factory (server-side operations)
export function createSupabaseServerClient(fetch: typeof globalThis.fetch) {
  return createServerClient<Database>(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      global: { fetch },
      cookies: {
        getAll: () => [],
        setAll: () => {}
      }
    }
  )
}

// Admin client (bypasses RLS)
export function createSupabaseAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
  }
  
  return createServerClient<Database>(
    PUBLIC_SUPABASE_URL,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      cookies: {
        getAll: () => [],
        setAll: () => {}
      }
    }
  )
}
```

## 🔐 Server-Side Session Management

### Hooks Configuration (`src/hooks.server.ts`)
```typescript
import { createServerClient } from '@supabase/ssr'
import { type Handle, redirect } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import type { Database, User } from '$lib/types/database'

// Primary Supabase hook - handles session management
const supabase: Handle = async ({ event, resolve }) => {
  // Create request-specific Supabase client
  event.locals.supabase = createServerClient<Database>(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll: () => event.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            event.cookies.set(name, value, { 
              ...options, 
              path: '/',
              httpOnly: true,
              secure: event.url.protocol === 'https:',
              sameSite: 'lax'
            })
          })
        }
      }
    }
  )

  // Secure session validation function
  event.locals.safeGetSession = async () => {
    // CRITICAL: Always validate with getUser() first
    const { data: { user }, error: userError } = await event.locals.supabase.auth.getUser()

    if (userError || !user) {
      return { session: null, user: null }
    }

    // Only get session if user is validated
    const { data: { session }, error: sessionError } = await event.locals.supabase.auth.getSession()

    if (!session || sessionError) {
      return { session: null, user: null }
    }

    // Map Supabase user to our User type
    const mappedUser: User = {
      id: user.id,
      email: user.email || '',
      name: user.user_metadata?.full_name || user.user_metadata?.name || '',
      avatar_url: user.user_metadata?.avatar_url || '',
      created_at: user.created_at || new Date().toISOString(),
      updated_at: user.updated_at || new Date().toISOString(),
      last_login_at: user.last_sign_in_at || undefined,
      // Default values for database fields
      noise_tolerance: undefined,
      wifi_importance: undefined,
      preferred_seating: undefined,
      work_style: undefined,
      total_reviews: 0,
      total_venues_visited: 0,
      is_verified: false,
      verification_date: undefined,
      deleted_at: undefined
    }

    return { session, user: mappedUser }
  }

  // Set session and user in locals for use across the app
  const { session, user } = await event.locals.safeGetSession()
  event.locals.session = session
  event.locals.user = user

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      // Required for Supabase
      return name === 'content-range' || name === 'x-supabase-api-version'
    }
  })
}

// Authentication guard hook
const authGuard: Handle = async ({ event, resolve }) => {
  // Define protected routes
  const protectedPaths = [
    '/profile',
    '/favorites', 
    '/reviews',
    '/venues/new',
    '/venues/edit'
  ]

  // Check if current route requires authentication
  const requiresAuth = protectedPaths.some(path => 
    event.url.pathname.startsWith(path)
  )

  if (requiresAuth && !event.locals.session) {
    // Redirect to login with return URL
    const redirectTo = event.url.pathname + event.url.search
    throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`)
  }

  return resolve(event)
}

// Combine hooks in sequence
export const handle: Handle = sequence(supabase, authGuard)
```

### TypeScript Definitions (`src/app.d.ts`)
```typescript
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import type { Database, User } from '$lib/types/database'

declare global {
  namespace App {
    interface Locals {
      user: User | null;
      supabase: SupabaseClient<Database>
      safeGetSession: () => Promise<{ session: Session | null; user: User | null }>
      session: Session | null
    }
    interface PageData {
      user: User | null;
      session: Session | null
    }
  }
}
```

## 🔄 Client-Side Auth State

### Auth Stores (`src/lib/stores/auth.ts`)
```typescript
import { writable, derived } from 'svelte/store'
import { browser } from '$app/environment'
import { supabase } from '$lib/supabase'
import type { Session, User as SupabaseUser } from '@supabase/supabase-js'
import type { User } from '$lib/types/database'

// Core auth stores
export const session = writable<Session | null>(null)
export const user = writable<User | null>(null)
export const authLoading = writable<boolean>(false)
export const authError = writable<string | null>(null)

// Derived stores
export const isAuthenticated = derived(
  [session, user],
  ([$session, $user]) => Boolean($session && $user)
)

export const userDisplayName = derived(
  user,
  ($user) => $user?.name || $user?.email || 'User'
)

// Map Supabase user to our User type
function mapSupabaseUser(supabaseUser: SupabaseUser): User {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: supabaseUser.user_metadata?.full_name || 
          supabaseUser.user_metadata?.name || '',
    avatar_url: supabaseUser.user_metadata?.avatar_url || '',
    created_at: supabaseUser.created_at || new Date().toISOString(),
    updated_at: supabaseUser.updated_at || new Date().toISOString(),
    last_login_at: supabaseUser.last_sign_in_at || undefined,
    // Default user preferences
    noise_tolerance: undefined,
    wifi_importance: undefined,
    preferred_seating: undefined,
    work_style: undefined,
    // Default activity tracking
    total_reviews: 0,
    total_venues_visited: 0,
    is_verified: false,
    verification_date: undefined,
    deleted_at: undefined
  }
}

// Initialize auth state from server data
export function initializeAuth(initialSession: Session | null, initialUser: User | null) {
  // Set initial state from server (source of truth)
  session.set(initialSession)
  user.set(initialUser)

  // Set up reactive auth state changes (client-side only)
  if (browser) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        console.log('🔄 Auth state change:', event)
        
        // Always validate with getUser() for security
        const { data: userData, error: userError } = await supabase.auth.getUser()
        
        if (!userError && userData.user) {
          // Valid user - update client state
          const mappedUser = mapSupabaseUser(userData.user)
          user.set(mappedUser)
          console.log('✅ Auth state validated')
        } else {
          // No valid user - clear state
          session.set(null)
          user.set(null)
          console.log('✅ Auth state cleared')
        }
        
        authError.set(null)
      }
    )

    // Return cleanup function
    return () => {
      subscription.unsubscribe()
    }
  }
}

// Sign out helper
export async function signOut() {
  authLoading.set(true)
  authError.set(null)

  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('❌ Sign out error:', error)
      authError.set('Failed to sign out. Please try again.')
    } else {
      console.log('✅ User signed out successfully')
      // State will be updated automatically by auth state change listener
    }
  } catch (error) {
    console.error('❌ Unexpected sign out error:', error)
    authError.set('An unexpected error occurred. Please try again.')
  } finally {
    authLoading.set(false)
  }
}
```

## 🔗 State Synchronization

### Layout Server Load (`src/routes/+layout.server.ts`)
```typescript
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals }) => {
  // Get validated session and user from hooks
  const { session, user } = await locals.safeGetSession()
  
  return {
    session,
    user
  }
}
```

### Layout Client Initialization (`src/routes/+layout.svelte`)
```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import { initializeAuth } from '$lib/stores/auth'
  import type { LayoutData } from './$types'
  
  export let data: LayoutData
  
  // Initialize auth state from server data
  onMount(() => {
    const cleanup = initializeAuth(data.session, data.user || null)
    return cleanup
  })
</script>
```

## 🛡️ Security Best Practices

### 1. Always Validate Server-Side
```typescript
// ❌ WRONG - Don't trust session data directly
const session = await supabase.auth.getSession()
// This could be tampered with

// ✅ CORRECT - Always validate with getUser()
const { data: { user }, error } = await supabase.auth.getUser()
if (!error && user) {
  // Now we know the user is valid
}
```

### 2. Use Secure Cookie Settings
```typescript
event.cookies.set(name, value, { 
  path: '/',
  httpOnly: true,                    // Prevent XSS
  secure: event.url.protocol === 'https:',  // HTTPS only in production
  sameSite: 'lax'                   // CSRF protection
})
```

### 3. Implement Proper Error Handling
```typescript
try {
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  
  if (error) {
    console.error('OAuth error:', error)
    throw redirect(303, '/auth/login?error=Authentication failed')
  }
  
  // Continue with success flow
} catch (error) {
  console.error('Unexpected error:', error)
  throw redirect(303, '/auth/login?error=Unexpected error')
}
```

## 🧪 Testing Supabase Auth

### Manual Testing Checklist
- [ ] Login flow works correctly
- [ ] Session persists across page refreshes
- [ ] Logout clears session properly
- [ ] Protected routes redirect to login
- [ ] Auth state syncs between server and client

### Automated Testing
```typescript
// Test session validation
test('safeGetSession validates user properly', async () => {
  // Mock Supabase client
  const mockClient = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null })
    }
  }
  
  // Test the session validation logic
  const result = await safeGetSession(mockClient)
  expect(result.user).toBeDefined()
  expect(result.session).toBeDefined()
})
```

## 🚨 Common Issues and Solutions

### Issue 1: "Invalid Refresh Token" Error
```typescript
// Cause: Token has expired or been invalidated
// Solution: Clear session and redirect to login
if (error?.message?.includes('Invalid Refresh Token')) {
  await supabase.auth.signOut()
  throw redirect(303, '/auth/login')
}
```

### Issue 2: Session Not Persisting
```typescript
// Cause: Missing cookie configuration
// Solution: Ensure proper cookie settings in hooks
cookies: {
  getAll: () => event.cookies.getAll(),
  setAll: (cookiesToSet) => {
    cookiesToSet.forEach(({ name, value, options }) => {
      event.cookies.set(name, value, { 
        ...options, 
        path: '/',      // Important!
        httpOnly: true  // Important!
      })
    })
  }
}
```

### Issue 3: Type Conflicts
```typescript
// Cause: Mismatched User types between Supabase and app
// Solution: Create consistent type mapping
function mapSupabaseUser(supabaseUser: SupabaseUser): User {
  return {
    // Map all required fields consistently
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    // ... other fields
  }
}
```

## 📊 Performance Optimization

### 1. Session Caching
```typescript
// Cache session validation for a short time
let sessionCache: { session: Session; user: User; timestamp: number } | null = null
const CACHE_DURATION = 30000 // 30 seconds

export async function getCachedSession() {
  if (sessionCache && Date.now() - sessionCache.timestamp < CACHE_DURATION) {
    return sessionCache
  }
  
  const result = await safeGetSession()
  if (result.session && result.user) {
    sessionCache = { ...result, timestamp: Date.now() }
  }
  
  return result
}
```

### 2. Efficient Auth Checks
```typescript
// Use derived stores to avoid unnecessary computations
export const isAuthenticated = derived(
  [session, user],
  ([$session, $user], set) => {
    set(Boolean($session && $user))
  }
)
```

## 🔗 Next Steps

1. **[Security Best Practices](./03-security-practices.md)** - Learn comprehensive security
2. **[OAuth Setup](./04-oauth-setup.md)** - Configure Google OAuth
3. **[User Profile System](./06-user-profiles.md)** - Implement user profiles

---

Supabase Auth provides a robust foundation for authentication, but proper implementation requires careful attention to security and state management.