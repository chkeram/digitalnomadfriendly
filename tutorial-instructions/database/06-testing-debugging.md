# Database Testing and Debugging Guide

Master database testing strategies, debugging techniques, and performance optimization for robust, reliable applications.

## 📚 What You'll Learn

- Setting up comprehensive database tests
- Testing RLS policies and security
- Debugging common database issues
- Performance testing and optimization
- Integration testing with Supabase
- Monitoring and alerting strategies

## 🧪 Database Testing Strategy

### Testing Pyramid for Databases

```
    /\     Unit Tests
   /  \    - Test individual functions
  /____\   - Mock database calls
 /      \  
/________\  Integration Tests
           - Test with real database
           - Test RLS policies
           - Test geospatial queries

     🗄️ End-to-End Tests
        - Full user workflows
        - Real environment testing
```

### Test Environment Setup

```typescript
// src/lib/test/setup.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '$lib/types/database'

// Test database configuration
export const testSupabase = createClient<Database>(
  process.env.TEST_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL!,
  process.env.TEST_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Test data cleanup utility
export async function cleanupTestData() {
  // Delete test data in reverse dependency order
  await testSupabase.from('review_votes').delete().neq('id', '')
  await testSupabase.from('reviews').delete().neq('id', '')
  await testSupabase.from('favorites').delete().neq('id', '')
  await testSupabase.from('venue_visits').delete().neq('id', '')
  await testSupabase.from('venue_photos').delete().neq('id', '')
  await testSupabase.from('venue_amenities').delete().neq('id', '')
  await testSupabase.from('venues').delete().neq('id', '')
  await testSupabase.from('users').delete().neq('id', '')
}

// Test user creation
export async function createTestUser(overrides = {}) {
  const userData = {
    id: crypto.randomUUID(),
    email: `test-${Date.now()}@example.com`,
    name: 'Test User',
    ...overrides
  }
  
  const { data, error } = await testSupabase
    .from('users')
    .insert(userData)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Test venue creation
export async function createTestVenue(userId: string, overrides = {}) {
  const venueData = {
    id: crypto.randomUUID(),
    name: 'Test Cafe',
    address: '123 Test St, San Francisco, CA',
    city: 'San Francisco',
    country: 'USA',
    location: 'POINT(-122.4194 37.7749)', // PostGIS format
    status: 'active' as const,
    created_by_user_id: userId,
    ...overrides
  }
  
  const { data, error } = await testSupabase
    .from('venues')
    .insert(venueData)
    .select()
    .single()
  
  if (error) throw error
  return data
}
```

## 🔧 Unit Testing Database Functions

### Testing Geospatial Functions

```typescript
// src/lib/services/__tests__/venues.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { cleanupTestData, createTestUser, createTestVenue, testSupabase } from '$lib/test/setup'
import { venueService } from '$lib/services/venues'

describe('Venue Service', () => {
  let testUser: any
  
  beforeEach(async () => {
    await cleanupTestData()
    testUser = await createTestUser()
  })
  
  afterEach(async () => {
    await cleanupTestData()
  })

  describe('findNearbyVenues', () => {
    it('should find venues within specified radius', async () => {
      // Arrange: Create venues at different distances
      const sfDowntown = await createTestVenue(testUser.id, {
        name: 'SF Downtown Cafe',
        location: 'POINT(-122.4194 37.7749)' // SF downtown
      })
      
      const sfMission = await createTestVenue(testUser.id, {
        name: 'Mission Cafe', 
        location: 'POINT(-122.4194 37.7582)' // SF Mission (≈2km away)
      })
      
      const oakland = await createTestVenue(testUser.id, {
        name: 'Oakland Cafe',
        location: 'POINT(-122.2711 37.8044)' // Oakland (≈15km away)
      })

      // Act: Search within 5km of SF downtown
      const { data, error } = await testSupabase.rpc('find_venues_within_radius', {
        center_lat: 37.7749,
        center_lng: -122.4194,
        radius_km: 5
      })

      // Assert
      expect(error).toBeNull()
      expect(data).toHaveLength(2) // Should find SF venues but not Oakland
      
      const venueNames = data!.map(v => v.venue_name)
      expect(venueNames).toContain('SF Downtown Cafe')
      expect(venueNames).toContain('Mission Cafe')
      expect(venueNames).not.toContain('Oakland Cafe')
      
      // Check distances are calculated correctly
      const distances = data!.map(v => v.distance_km)
      expect(distances[0]).toBeLessThan(1) // Downtown should be very close
      expect(distances[1]).toBeLessThan(5) // Mission should be within 5km
    })

    it('should return empty array when no venues in radius', async () => {
      // Arrange: Create venue far away
      await createTestVenue(testUser.id, {
        name: 'Distant Cafe',
        location: 'POINT(-73.9857 40.7484)' // New York
      })

      // Act: Search in SF
      const { data, error } = await testSupabase.rpc('find_venues_within_radius', {
        center_lat: 37.7749,
        center_lng: -122.4194,
        radius_km: 5
      })

      // Assert
      expect(error).toBeNull()
      expect(data).toHaveLength(0)
    })
  })

  describe('venue recommendations', () => {
    it('should provide personalized recommendations based on user preferences', async () => {
      // Arrange: Update user preferences
      await testSupabase
        .from('users')
        .update({
          noise_tolerance: 2, // Prefers quiet places
          wifi_importance: 5   // Wifi is very important
        })
        .eq('id', testUser.id)

      // Create venues with different characteristics
      const quietVenue = await createTestVenue(testUser.id, {
        name: 'Quiet Library Cafe',
        location: 'POINT(-122.4194 37.7749)'
      })
      
      const noisyVenue = await createTestVenue(testUser.id, {
        name: 'Loud Sports Bar', 
        location: 'POINT(-122.4194 37.7750)'
      })

      // Add amenities
      await testSupabase.from('venue_amenities').insert([
        { venue_id: quietVenue.id, noise_level: 1, wifi_quality: 5 },
        { venue_id: noisyVenue.id, noise_level: 5, wifi_quality: 2 }
      ])

      // Act: Get recommendations
      const { data, error } = await testSupabase.rpc('get_venue_recommendations', {
        user_id_param: testUser.id,
        center_lat: 37.7749,
        center_lng: -122.4194,
        radius_km: 5
      })

      // Assert
      expect(error).toBeNull()
      expect(data).toHaveLength(2)
      
      // Quiet venue should have higher compatibility score
      const quietResult = data!.find(v => v.venue_name === 'Quiet Library Cafe')
      const noisyResult = data!.find(v => v.venue_name === 'Loud Sports Bar')
      
      expect(quietResult!.compatibility_score).toBeGreaterThan(noisyResult!.compatibility_score)
    })
  })
})
```

### Testing RLS Policies

```typescript
// src/lib/test/__tests__/rls-policies.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { cleanupTestData, createTestUser, createTestVenue, testSupabase } from '$lib/test/setup'

describe('RLS Policies', () => {
  let user1: any, user2: any, venue: any
  
  beforeEach(async () => {
    await cleanupTestData()
    user1 = await createTestUser({ name: 'User 1' })
    user2 = await createTestUser({ name: 'User 2' })
    venue = await createTestVenue(user1.id)
  })
  
  afterEach(async () => {
    await cleanupTestData()
  })

  describe('Reviews RLS', () => {
    it('should allow users to create reviews', async () => {
      // Simulate authenticated user context
      const userSupabase = createClient(
        process.env.PUBLIC_SUPABASE_URL!,
        process.env.PUBLIC_SUPABASE_ANON_KEY!
      )
      
      // Mock auth context (in real app, this would be set by authentication)
      const { data, error } = await testSupabase
        .from('reviews')
        .insert({
          user_id: user1.id,
          venue_id: venue.id,
          overall_rating: 4,
          title: 'Great place!',
          text: 'Really enjoyed working here.'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.user_id).toBe(user1.id)
    })

    it('should prevent users from creating reviews for other users', async () => {
      // Try to create review with wrong user_id
      const { data, error } = await testSupabase
        .from('reviews')
        .insert({
          user_id: user2.id, // Different user
          venue_id: venue.id,
          overall_rating: 4,
          title: 'Fake review',
          text: 'This should fail due to RLS.'
        })

      // In real testing, you'd need to properly mock auth context
      // This test demonstrates the concept
      expect(error).toBeTruthy() // Should fail RLS check
    })

    it('should allow users to update their own reviews within time limit', async () => {
      // Create review
      const { data: review } = await testSupabase
        .from('reviews')
        .insert({
          user_id: user1.id,
          venue_id: venue.id,
          overall_rating: 4,
          title: 'Original title',
          text: 'Original text here.'
        })
        .select()
        .single()

      // Update review (should succeed)
      const { data, error } = await testSupabase
        .from('reviews')
        .update({
          title: 'Updated title',
          text: 'Updated text here.'
        })
        .eq('id', review.id)
        .eq('user_id', user1.id) // Ensure we're updating as the owner
        .select()
        .single()

      expect(error).toBeNull()
      expect(data.title).toBe('Updated title')
    })
  })

  describe('Favorites RLS', () => {
    it('should allow users to manage their own favorites', async () => {
      // Create favorite
      const { data: favorite, error: createError } = await testSupabase
        .from('favorites')
        .insert({
          user_id: user1.id,
          venue_id: venue.id
        })
        .select()
        .single()

      expect(createError).toBeNull()
      expect(favorite.user_id).toBe(user1.id)

      // User should be able to see their own favorites
      const { data: myFavorites, error: selectError } = await testSupabase
        .from('favorites')
        .select('*')
        .eq('user_id', user1.id)

      expect(selectError).toBeNull()
      expect(myFavorites).toHaveLength(1)

      // Delete favorite
      const { error: deleteError } = await testSupabase
        .from('favorites')
        .delete()
        .eq('id', favorite.id)
        .eq('user_id', user1.id)

      expect(deleteError).toBeNull()
    })
  })
})
```

## 🔍 Integration Testing

### API Endpoint Testing

```typescript
// src/routes/api/venues/__tests__/nearby.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { GET } from '../nearby/+server'
import { cleanupTestData, createTestUser, createTestVenue } from '$lib/test/setup'

describe('/api/venues/nearby', () => {
  let testUser: any
  
  beforeEach(async () => {
    await cleanupTestData()
    testUser = await createTestUser()
  })
  
  afterEach(async () => {
    await cleanupTestData()
  })

  it('should return nearby venues', async () => {
    // Arrange
    await createTestVenue(testUser.id, {
      name: 'Nearby Cafe',
      location: 'POINT(-122.4194 37.7749)'
    })

    // Create mock request
    const url = new URL('http://localhost:5173/api/venues/nearby?lat=37.7749&lng=-122.4194&radius=5')
    const request = new Request(url)
    
    // Act
    const response = await GET({ url, request } as any)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data).toHaveLength(1)
    expect(data[0].venue_name).toBe('Nearby Cafe')
  })

  it('should validate query parameters', async () => {
    // Invalid coordinates
    const url = new URL('http://localhost:5173/api/venues/nearby?lat=invalid&lng=-122.4194')
    const request = new Request(url)
    
    const response = await GET({ url, request } as any)
    
    expect(response.status).toBe(400)
  })

  it('should handle authentication', async () => {
    // Test with authenticated vs anonymous users
    // Implementation depends on your auth setup
  })
})
```

### Component Testing with Database

```typescript
// src/lib/components/__tests__/VenueList.test.ts
import { render, screen, waitFor } from '@testing-library/svelte'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import VenueList from '$lib/components/VenueList.svelte'
import { venueService } from '$lib/services/venues'

// Mock the venue service
vi.mock('$lib/services/venues', () => ({
  venueService: {
    findNearbyVenues: vi.fn()
  }
}))

describe('VenueList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display venues when loaded', async () => {
    // Mock successful response
    vi.mocked(venueService.findNearbyVenues).mockResolvedValue({
      data: [
        {
          venue_id: '1',
          venue_name: 'Test Cafe',
          venue_address: '123 Test St',
          distance_km: 0.5,
          overall_rating: 4.5
        }
      ],
      error: null
    })

    render(VenueList, {
      props: {
        userLocation: { lat: 37.7749, lng: -122.4194 }
      }
    })

    await waitFor(() => {
      expect(screen.getByText('Test Cafe')).toBeInTheDocument()
      expect(screen.getByText('0.5 km away')).toBeInTheDocument()
    })
  })

  it('should display error message when loading fails', async () => {
    vi.mocked(venueService.findNearbyVenues).mockResolvedValue({
      data: null,
      error: { message: 'Network error' }
    })

    render(VenueList, {
      props: {
        userLocation: { lat: 37.7749, lng: -122.4194 }
      }
    })

    await waitFor(() => {
      expect(screen.getByText(/error loading venues/i)).toBeInTheDocument()
    })
  })
})
```

## 🐛 Debugging Database Issues

### Common Issues and Solutions

#### 1. RLS Policy Debugging

```sql
-- Enable query logging to see what's happening
SET log_statement = 'all';
SET log_min_duration_statement = 0;

-- Check current user context
SELECT 
  current_user,
  session_user,
  auth.uid() as auth_user_id,
  auth.role() as auth_role;

-- Test policy conditions manually
SELECT 
  r.*,
  (auth.uid() = r.user_id) as user_owns_review,
  (r.is_flagged = false) as not_flagged,
  (r.deleted_at IS NULL) as not_deleted
FROM reviews r
WHERE r.id = 'specific-review-id';

-- Check if any policies exist
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'reviews';
```

#### 2. Performance Issues

```sql
-- Find slow queries
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  rows
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_tup_read > 0
ORDER BY idx_tup_read DESC;

-- Analyze specific slow query
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT * FROM venues 
WHERE ST_DWithin(location, ST_MakePoint(-122.4194, 37.7749)::geography, 5000);
```

#### 3. Connection Issues

```typescript
// Debug Supabase connection
export async function debugConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Connection failed:', error)
      return false
    }
    
    console.log('✅ Connection successful')
    
    // Test auth state
    const { data: { session } } = await supabase.auth.getSession()
    console.log('Auth session:', session ? 'Authenticated' : 'Anonymous')
    
    // Test RLS
    const { data: userCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
    
    console.log('Accessible users count:', userCount)
    
    return true
  } catch (error) {
    console.error('Debug failed:', error)
    return false
  }
}
```

### Database Health Monitoring

```sql
-- Create health check queries
CREATE OR REPLACE FUNCTION database_health_check()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'timestamp', NOW(),
    'database_size', pg_database_size(current_database()),
    'active_connections', (
      SELECT count(*) FROM pg_stat_activity 
      WHERE state = 'active'
    ),
    'table_stats', (
      SELECT json_object_agg(
        schemaname || '.' || relname,
        json_build_object(
          'rows', n_tup_ins + n_tup_upd + n_tup_del,
          'size', pg_total_relation_size(schemaname||'.'||relname)
        )
      )
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
    ),
    'slow_queries', (
      SELECT count(*) FROM pg_stat_statements 
      WHERE mean_exec_time > 1000
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Use in monitoring
SELECT database_health_check();
```

## 📊 Performance Testing

### Load Testing Database Operations

```typescript
// src/lib/test/performance/load-test.ts
import { performance } from 'perf_hooks'
import { testSupabase, createTestUser, createTestVenue } from '$lib/test/setup'

export async function loadTestVenueSearch() {
  const startTime = performance.now()
  const testUser = await createTestUser()
  
  // Create test venues
  const venuePromises = Array.from({ length: 100 }, (_, i) =>
    createTestVenue(testUser.id, {
      name: `Venue ${i}`,
      location: `POINT(${-122.4 + Math.random() * 0.1} ${37.7 + Math.random() * 0.1})`
    })
  )
  
  await Promise.all(venuePromises)
  console.log(`Created 100 venues in ${performance.now() - startTime}ms`)
  
  // Test concurrent searches
  const searchStartTime = performance.now()
  const searchPromises = Array.from({ length: 50 }, () =>
    testSupabase.rpc('find_venues_within_radius', {
      center_lat: 37.7749,
      center_lng: -122.4194,
      radius_km: 5
    })
  )
  
  const results = await Promise.all(searchPromises)
  const searchTime = performance.now() - searchStartTime
  
  console.log(`50 concurrent searches completed in ${searchTime}ms`)
  console.log(`Average search time: ${searchTime / 50}ms`)
  
  // Verify all searches succeeded
  const errors = results.filter(r => r.error)
  if (errors.length > 0) {
    console.error(`${errors.length} searches failed:`, errors)
  }
  
  return {
    totalTime: performance.now() - startTime,
    searchTime,
    avgSearchTime: searchTime / 50,
    errors: errors.length
  }
}
```

### Benchmark Critical Queries

```typescript
// src/lib/test/performance/benchmark.ts
export async function benchmarkCriticalQueries() {
  const benchmarks = [
    {
      name: 'Find nearby venues',
      query: () => testSupabase.rpc('find_venues_within_radius', {
        center_lat: 37.7749,
        center_lng: -122.4194,
        radius_km: 5
      })
    },
    {
      name: 'Get venue recommendations',
      query: () => testSupabase.rpc('get_venue_recommendations', {
        user_id_param: 'test-user-id',
        center_lat: 37.7749,
        center_lng: -122.4194,
        radius_km: 10
      })
    },
    {
      name: 'Complex venue search',
      query: () => testSupabase
        .from('venues')
        .select(`
          *,
          venue_amenities(*),
          reviews(overall_rating, created_at)
        `)
        .eq('status', 'active')
        .gte('overall_rating', 4)
        .limit(20)
    }
  ]
  
  for (const benchmark of benchmarks) {
    console.log(`\nBenchmarking: ${benchmark.name}`)
    
    const times = []
    for (let i = 0; i < 10; i++) {
      const start = performance.now()
      await benchmark.query()
      const time = performance.now() - start
      times.push(time)
    }
    
    const avg = times.reduce((sum, t) => sum + t, 0) / times.length
    const min = Math.min(...times)
    const max = Math.max(...times)
    
    console.log(`  Average: ${avg.toFixed(2)}ms`)
    console.log(`  Min: ${min.toFixed(2)}ms`)
    console.log(`  Max: ${max.toFixed(2)}ms`)
    
    if (avg > 500) {
      console.warn(`⚠️  Query is slow: ${avg.toFixed(2)}ms`)
    }
  }
}
```

## 📈 Monitoring and Alerting

### Application-Level Monitoring

```typescript
// src/lib/utils/monitoring.ts
import { dev } from '$app/environment'

interface QueryMetrics {
  query: string
  duration: number
  success: boolean
  timestamp: Date
}

class DatabaseMonitor {
  private metrics: QueryMetrics[] = []
  
  async trackQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now()
    let success = true
    
    try {
      const result = await queryFn()
      return result
    } catch (error) {
      success = false
      throw error
    } finally {
      const duration = performance.now() - start
      
      this.metrics.push({
        query: queryName,
        duration,
        success,
        timestamp: new Date()
      })
      
      // Log slow queries in development
      if (dev && duration > 1000) {
        console.warn(`Slow query: ${queryName} took ${duration.toFixed(2)}ms`)
      }
      
      // Send to analytics in production
      if (!dev && duration > 2000) {
        this.reportSlowQuery(queryName, duration)
      }
    }
  }
  
  private async reportSlowQuery(query: string, duration: number) {
    // Send to your analytics service
    // e.g., PostHog, Mixpanel, custom endpoint
    console.error(`SLOW_QUERY: ${query} - ${duration}ms`)
  }
  
  getMetrics() {
    return this.metrics
  }
  
  clearMetrics() {
    this.metrics = []
  }
}

export const dbMonitor = new DatabaseMonitor()

// Usage in service functions
export const monitoredVenueService = {
  async findNearbyVenues(lat: number, lng: number, radius: number) {
    return dbMonitor.trackQuery(
      'findNearbyVenues',
      () => venueService.findNearbyVenues(lat, lng, radius)
    )
  }
}
```

### Error Tracking

```typescript
// src/lib/utils/error-tracking.ts
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public query?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export function handleSupabaseError(error: any, context?: string): never {
  const dbError = new DatabaseError(
    error.message || 'Database operation failed',
    error.code || 'UNKNOWN',
    context,
    error.details
  )
  
  // Log for debugging
  console.error('Database Error:', {
    message: dbError.message,
    code: dbError.code,
    query: dbError.query,
    details: dbError.details,
    stack: dbError.stack
  })
  
  // Send to error tracking service
  // e.g., Sentry, Rollbar, etc.
  
  throw dbError
}
```

## 🎯 Testing Best Practices

1. **Isolated Tests**: Each test should be independent
2. **Realistic Data**: Use data that resembles production
3. **Test Edge Cases**: Empty results, invalid inputs, large datasets
4. **Performance Tests**: Benchmark critical operations
5. **Security Tests**: Verify RLS policies work correctly
6. **Monitor in Production**: Track query performance and errors
7. **Automated Cleanup**: Always clean up test data
8. **Mock External Services**: Use mocks for third-party APIs

## 📚 Next Steps

- [Database Workflows](07-workflows-best-practices.md) - Production workflows and best practices
- [Deployment Guide](08-deployment.md) - Deploying database changes safely

## 🎯 Key Takeaways

- Comprehensive testing prevents production issues
- RLS policies need thorough testing with different user contexts
- Performance testing catches bottlenecks early
- Monitoring helps identify issues in production
- Good debugging tools save hours of troubleshooting
- Automated testing ensures reliability as your app grows

Your database is now thoroughly tested and ready for production! 🧪🚀