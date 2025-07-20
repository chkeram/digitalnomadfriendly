# Supabase Integration Tutorial

Master Supabase features including authentication, real-time subscriptions, edge functions, and advanced database operations.

## 📚 What You'll Learn

- Setting up Supabase client and authentication
- Working with Supabase's JavaScript client
- Real-time subscriptions for live updates
- File storage and image uploads
- Edge functions for server-side logic
- Advanced querying with PostgREST
- Supabase CLI and local development

## 🚀 Supabase Client Setup

### Basic Client Configuration

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/database'

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Type-safe database client
export type SupabaseClient = typeof supabase
```

### Environment Configuration

```typescript
// src/app.d.ts - Add environment variable types
declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient
      getSession(): Promise<Session | null>
    }
    interface PageData {
      session: Session | null
    }
  }
}

// Environment variables
interface ImportMetaEnv {
  readonly VITE_PUBLIC_SUPABASE_URL: string
  readonly VITE_PUBLIC_SUPABASE_ANON_KEY: string
}
```

## 🔐 Authentication Integration

### SvelteKit Auth Setup

```typescript
// src/hooks.server.ts
import { createSupabaseServerClient } from '@supabase/auth-helpers-sveltekit'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

export const handle = async ({ event, resolve }) => {
  event.locals.supabase = createSupabaseServerClient({
    supabaseUrl: PUBLIC_SUPABASE_URL,
    supabaseKey: PUBLIC_SUPABASE_ANON_KEY,
    event,
  })

  event.locals.getSession = async () => {
    const {
      data: { session },
    } = await event.locals.supabase.auth.getSession()
    return session
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range'
    },
  })
}
```

### Auth Store

```typescript
// src/lib/stores/auth.ts
import { writable } from 'svelte/store'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '$lib/supabase'

export const user = writable<User | null>(null)
export const session = writable<Session | null>(null)

// Initialize auth state
supabase.auth.getSession().then(({ data: { session } }) => {
  user.set(session?.user ?? null)
  session.set(session)
})

// Listen for auth changes
supabase.auth.onAuthStateChange((event, newSession) => {
  user.set(newSession?.user ?? null)
  session.set(newSession)
})

// Auth helper functions
export const authHelpers = {
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })
    return { data, error }
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async updateProfile(updates: Partial<UserProfile>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    
    return { data, error }
  }
}
```

### Auth Callback Handler

```typescript
// src/routes/auth/callback/+server.ts
import { redirect } from '@sveltejs/kit'

export const GET = async ({ url, locals: { supabase } }) => {
  const code = url.searchParams.get('code')

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      throw redirect(303, '/')
    }
  }

  throw redirect(303, '/auth/error')
}
```

## 📊 Database Operations

### Type-Safe Queries

```typescript
// src/lib/services/venues.ts
import { supabase } from '$lib/supabase'
import type { Venue, VenueWithAmenities } from '$lib/types'

export const venueService = {
  // Get venues with full details
  async getVenuesWithDetails(filters: VenueFilters = {}) {
    let query = supabase
      .from('venues')
      .select(`
        *,
        venue_amenities (*),
        venue_photos (
          id,
          photo_url,
          thumbnail_url,
          is_primary
        ),
        reviews (
          id,
          overall_rating,
          created_at,
          user:users(name, avatar_url)
        )
      `)
      .eq('status', 'active')
      .is('deleted_at', null)

    // Apply filters
    if (filters.city) {
      query = query.eq('city', filters.city)
    }
    
    if (filters.minRating) {
      query = query.gte('overall_rating', filters.minRating)
    }

    const { data, error } = await query
    return { data, error }
  },

  // Location-based search using RPC
  async findNearbyVenues(lat: number, lng: number, radiusKm: number = 5) {
    const { data, error } = await supabase.rpc('find_venues_within_radius', {
      center_lat: lat,
      center_lng: lng,
      radius_km: radiusKm
    })
    
    return { data, error }
  },

  // Get personalized recommendations
  async getRecommendations(userId: string, lat: number, lng: number) {
    const { data, error } = await supabase.rpc('get_venue_recommendations', {
      user_id_param: userId,
      center_lat: lat,
      center_lng: lng,
      radius_km: 10
    })
    
    return { data, error }
  },

  // Create new venue
  async createVenue(venue: Omit<Venue, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('venues')
      .insert(venue)
      .select()
      .single()
    
    return { data, error }
  },

  // Update venue
  async updateVenue(id: string, updates: Partial<Venue>) {
    const { data, error } = await supabase
      .from('venues')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    return { data, error }
  }
}
```

### Batch Operations

```typescript
// Efficient batch operations
export const batchOperations = {
  // Insert multiple reviews
  async createMultipleReviews(reviews: Omit<Review, 'id' | 'created_at'>[]) {
    const { data, error } = await supabase
      .from('reviews')
      .insert(reviews)
      .select()
    
    return { data, error }
  },

  // Update multiple venue ratings (triggered by review changes)
  async updateVenueRatings(venueIds: string[]) {
    // This would typically be handled by database triggers
    // But you can also do it manually for specific cases
    const updates = await Promise.all(
      venueIds.map(async (venueId) => {
        const { data: reviews } = await supabase
          .from('reviews')
          .select('overall_rating')
          .eq('venue_id', venueId)
          .is('deleted_at', null)
        
        if (reviews && reviews.length > 0) {
          const avgRating = reviews.reduce((sum, r) => sum + r.overall_rating, 0) / reviews.length
          
          return supabase
            .from('venues')
            .update({ 
              overall_rating: Math.round(avgRating * 10) / 10,
              total_reviews: reviews.length 
            })
            .eq('id', venueId)
        }
      })
    )
    
    return updates
  }
}
```

## 🔄 Real-time Subscriptions

### Live Venue Updates

```typescript
// src/lib/stores/liveVenues.ts
import { writable } from 'svelte/store'
import { supabase } from '$lib/supabase'
import type { Venue } from '$lib/types'

export const liveVenues = writable<Venue[]>([])

// Subscribe to venue changes
export function subscribeTo VenueUpdates() {
  const channel = supabase
    .channel('venue-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'venues',
        filter: 'status=eq.active'
      },
      (payload) => {
        console.log('Venue change received:', payload)
        
        liveVenues.update(venues => {
          const { eventType, new: newVenue, old: oldVenue } = payload
          
          switch (eventType) {
            case 'INSERT':
              return [...venues, newVenue as Venue]
            
            case 'UPDATE':
              return venues.map(v => 
                v.id === newVenue.id ? newVenue as Venue : v
              )
            
            case 'DELETE':
              return venues.filter(v => v.id !== oldVenue.id)
            
            default:
              return venues
          }
        })
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
```

### Review Activity Feed

```typescript
// Real-time review notifications
export function subscribeToReviewActivity(venueId?: string) {
  const filter = venueId ? `venue_id=eq.${venueId}` : undefined
  
  return supabase
    .channel('review-activity')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'reviews',
        filter
      },
      (payload) => {
        // Handle new review
        const newReview = payload.new as Review
        
        // You could show a toast notification
        // or update a live activity feed
        console.log('New review posted:', newReview)
      }
    )
    .subscribe()
}
```

## 🗄️ File Storage

### Image Upload for Venues

```typescript
// src/lib/services/storage.ts
import { supabase } from '$lib/supabase'

export const storageService = {
  // Upload venue photo
  async uploadVenuePhoto(venueId: string, file: File, isMain = false) {
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${venueId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('venue-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) return { data: null, error: uploadError }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('venue-photos')
      .getPublicUrl(fileName)
    
    // Save photo record to database
    const { data: photoData, error: dbError } = await supabase
      .from('venue_photos')
      .insert({
        venue_id: venueId,
        photo_url: publicUrl,
        is_primary: isMain,
        uploaded_by_user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single()
    
    return { data: photoData, error: dbError }
  },

  // Generate thumbnail
  async generateThumbnail(originalUrl: string) {
    // Use Supabase's image transformation
    const thumbnailUrl = originalUrl + '?width=300&height=200&resize=cover'
    return thumbnailUrl
  },

  // Delete photo
  async deleteVenuePhoto(photoId: string) {
    // Get photo details
    const { data: photo } = await supabase
      .from('venue_photos')
      .select('photo_url')
      .eq('id', photoId)
      .single()
    
    if (photo) {
      // Extract file path from URL
      const filePath = photo.photo_url.split('/').slice(-2).join('/')
      
      // Delete from storage
      await supabase.storage
        .from('venue-photos')
        .remove([filePath])
    }
    
    // Delete database record
    const { error } = await supabase
      .from('venue_photos')
      .delete()
      .eq('id', photoId)
    
    return { error }
  }
}
```

### Image Upload Component

```svelte
<!-- src/lib/components/ImageUpload.svelte -->
<script lang="ts">
  import { storageService } from '$lib/services/storage'
  
  export let venueId: string
  export let onUpload: (photoUrl: string) => void = () => {}
  
  let files: FileList
  let uploading = false
  let uploadProgress = 0
  
  async function uploadPhoto() {
    if (!files || files.length === 0) return
    
    uploading = true
    uploadProgress = 0
    
    try {
      const file = files[0]
      
      // Validate file
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('File size must be less than 5MB')
      }
      
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image')
      }
      
      // Upload with progress simulation
      const progressInterval = setInterval(() => {
        uploadProgress = Math.min(uploadProgress + 10, 90)
      }, 100)
      
      const { data, error } = await storageService.uploadVenuePhoto(venueId, file)
      
      clearInterval(progressInterval)
      uploadProgress = 100
      
      if (error) throw error
      
      onUpload(data.photo_url)
      
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed: ' + error.message)
    } finally {
      uploading = false
      uploadProgress = 0
    }
  }
</script>

<div class="upload-container">
  <input 
    type="file" 
    bind:files 
    accept="image/*" 
    disabled={uploading}
    class="file-input"
  />
  
  {#if files && files.length > 0}
    <button 
      on:click={uploadPhoto} 
      disabled={uploading}
      class="upload-btn"
    >
      {uploading ? 'Uploading...' : 'Upload Photo'}
    </button>
  {/if}
  
  {#if uploading}
    <div class="progress-bar">
      <div class="progress-fill" style="width: {uploadProgress}%"></div>
    </div>
  {/if}
</div>
```

## ⚡ Edge Functions

### Venue Data Enrichment

```typescript
// supabase/functions/enrich-venue/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { venueId } = await req.json()
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  try {
    // Get venue details
    const { data: venue } = await supabase
      .from('venues')
      .select('*')
      .eq('id', venueId)
      .single()
    
    if (!venue) {
      throw new Error('Venue not found')
    }
    
    // Enrich with Google Places data (if place_id exists)
    if (venue.place_id) {
      const placesData = await fetchGooglePlacesData(venue.place_id)
      
      // Update venue with enriched data
      await supabase
        .from('venues')
        .update({
          google_rating: placesData.rating,
          google_review_count: placesData.user_ratings_total,
          phone: placesData.formatted_phone_number,
          website: placesData.website,
          hours: placesData.opening_hours
        })
        .eq('id', venueId)
    }
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

async function fetchGooglePlacesData(placeId: string) {
  const apiKey = Deno.env.get('GOOGLE_PLACES_API_KEY')
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=rating,user_ratings_total,formatted_phone_number,website,opening_hours`
  )
  
  const data = await response.json()
  return data.result
}
```

## 🔍 Advanced Querying

### Complex Filters with PostgREST

```typescript
// Advanced venue search with multiple filters
export async function searchVenues(searchParams: VenueSearchParams) {
  let query = supabase
    .from('venues')
    .select(`
      *,
      venue_amenities!inner(*),
      reviews(overall_rating),
      venue_photos(photo_url, is_primary)
    `)
    .eq('status', 'active')
    .is('deleted_at', null)

  // Text search
  if (searchParams.query) {
    query = query.or(
      `name.ilike.%${searchParams.query}%,address.ilike.%${searchParams.query}%,city.ilike.%${searchParams.query}%`
    )
  }

  // Rating filter
  if (searchParams.minRating) {
    query = query.gte('overall_rating', searchParams.minRating)
  }

  // Amenity filters
  if (searchParams.hasWifi) {
    query = query.gte('venue_amenities.wifi_quality', 3)
  }

  if (searchParams.hasOutlets) {
    query = query.eq('venue_amenities.power_outlets', true)
  }

  if (searchParams.isQuiet) {
    query = query.lte('venue_amenities.noise_level', 2)
  }

  // Price range
  if (searchParams.maxPrice) {
    query = query.lte('venue_amenities.price_range', searchParams.maxPrice)
  }

  // Limit and pagination
  const from = (searchParams.page - 1) * searchParams.limit
  const to = from + searchParams.limit - 1
  
  query = query.range(from, to)

  // Sorting
  if (searchParams.sortBy === 'rating') {
    query = query.order('overall_rating', { ascending: false })
  } else if (searchParams.sortBy === 'newest') {
    query = query.order('created_at', { ascending: false })
  }

  const { data, error, count } = await query

  return { 
    venues: data, 
    error, 
    totalCount: count,
    hasMore: count ? (from + searchParams.limit) < count : false
  }
}
```

### Performance Monitoring

```typescript
// Monitor query performance
export function withPerformanceTracking<T>(
  queryFn: () => Promise<T>,
  queryName: string
) {
  return async (): Promise<T> => {
    const startTime = Date.now()
    
    try {
      const result = await queryFn()
      const duration = Date.now() - startTime
      
      console.log(`Query "${queryName}" took ${duration}ms`)
      
      // Send to analytics if duration is high
      if (duration > 1000) {
        // Track slow query
        console.warn(`Slow query detected: ${queryName} (${duration}ms)`)
      }
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`Query "${queryName}" failed after ${duration}ms:`, error)
      throw error
    }
  }
}

// Usage
const getVenues = withPerformanceTracking(
  () => venueService.getVenuesWithDetails(),
  'getVenuesWithDetails'
)
```

## 🛠️ Supabase CLI and Local Development

### Local Development Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize project
supabase init

# Start local development
supabase start

# Reset local database
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > src/lib/types/supabase.ts
```

### Database Migrations with CLI

```bash
# Create new migration
supabase migration new add_venue_tags

# Apply migrations
supabase db push

# Generate migration from remote changes
supabase db pull
```

## 🎯 Best Practices

### 1. Type Safety

```typescript
// Always use generated types
import type { Database } from '$lib/types/supabase'

type Venue = Database['public']['Tables']['venues']['Row']
type VenueInsert = Database['public']['Tables']['venues']['Insert']
type VenueUpdate = Database['public']['Tables']['venues']['Update']
```

### 2. Error Handling

```typescript
// Consistent error handling
export async function handleSupabaseError<T>(
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  const { data, error } = await operation()
  
  if (error) {
    console.error('Supabase error:', error)
    throw new Error(error.message || 'Database operation failed')
  }
  
  if (!data) {
    throw new Error('No data returned')
  }
  
  return data
}
```

### 3. Connection Management

```typescript
// Singleton pattern for client
let supabaseClient: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    )
  }
  return supabaseClient
}
```

## 📚 Next Steps

- [RLS Policies and Security](05-rls-security.md) - Database security best practices
- [Database Testing](06-testing-debugging.md) - Testing Supabase integrations
- [Performance Optimization](07-performance.md) - Optimizing Supabase queries

## 🎯 Key Takeaways

- Supabase provides a complete backend platform with real-time features
- Type safety is crucial for maintainable applications
- Real-time subscriptions enable live user experiences
- Edge functions handle server-side logic close to users
- File storage integrates seamlessly with database records
- Local development with Supabase CLI speeds up development

Ready to build powerful real-time applications! ⚡🚀