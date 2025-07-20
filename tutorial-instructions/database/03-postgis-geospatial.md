# PostGIS and Geospatial Queries Tutorial

Master location-based features using PostGIS for venue discovery, distance calculations, and geospatial analysis.

## 📚 What You'll Learn

- Understanding PostGIS and spatial data types
- Working with coordinates, projections, and geography
- Writing distance and proximity queries
- Creating location-based search functions
- Optimizing geospatial queries with indexes
- Building recommendation systems with location data

## 🌍 PostGIS Fundamentals

### What is PostGIS?

PostGIS extends PostgreSQL with geospatial capabilities:
- **Geometry & Geography**: Store points, lines, polygons
- **Spatial Functions**: Distance, intersection, containment
- **Spatial Indexes**: Fast location-based queries
- **Coordinate Systems**: Handle different map projections

### Key Concepts

```sql
-- POINT: A single location (longitude, latitude)
ST_MakePoint(-122.4194, 37.7749) -- San Francisco

-- GEOGRAPHY vs GEOMETRY:
-- - GEOGRAPHY: Real-world coordinates on Earth's surface
-- - GEOMETRY: Mathematical coordinates on a plane

-- Our schema uses GEOGRAPHY for accurate distance calculations
location GEOGRAPHY(POINT, 4326) -- 4326 = WGS84 (GPS coordinates)
```

## 📍 Working with Venue Locations

### Understanding Our Location Storage

```sql
-- Venues table stores locations as GEOGRAPHY points
CREATE TABLE venues (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    location GEOGRAPHY(POINT, 4326) NOT NULL, -- longitude, latitude
    -- ... other fields
);

-- Creating a location point
INSERT INTO venues (name, location) VALUES 
('Blue Bottle Coffee', ST_MakePoint(-122.4194, 37.7749)::geography);
--                                    longitude   latitude
--                                    (X coord)   (Y coord)
```

### Coordinate System (SRID 4326)

- **SRID 4326**: World Geodetic System 1984 (WGS84)
- **Standard GPS coordinates**: What your phone uses
- **Longitude**: -180 to +180 (East/West)
- **Latitude**: -90 to +90 (North/South)
- **Format**: Always longitude first, then latitude!

```sql
-- San Francisco coordinates
-- Longitude: -122.4194 (West of Prime Meridian)
-- Latitude: 37.7749 (North of Equator)
SELECT ST_MakePoint(-122.4194, 37.7749)::geography;
```

## 🔍 Basic Geospatial Queries

### 1. Distance Calculations

```sql
-- Calculate distance between two points (in meters)
SELECT ST_Distance(
    ST_MakePoint(-122.4194, 37.7749)::geography, -- San Francisco
    ST_MakePoint(-122.4089, 37.7849)::geography  -- Another SF location
) as distance_meters;

-- Convert to kilometers
SELECT ROUND(
    ST_Distance(
        ST_MakePoint(-122.4194, 37.7749)::geography,
        ST_MakePoint(-122.4089, 37.7849)::geography
    ) / 1000, 2
) as distance_km;

-- Find distance from venues to a specific point
SELECT 
    name,
    address,
    ROUND(ST_Distance(
        location, 
        ST_MakePoint(-122.4194, 37.7749)::geography
    ) / 1000, 2) as distance_km
FROM venues
ORDER BY distance_km;
```

### 2. Proximity Queries (Within Radius)

```sql
-- Find venues within 5km of San Francisco downtown
SELECT name, address
FROM venues
WHERE ST_DWithin(
    location,
    ST_MakePoint(-122.4194, 37.7749)::geography,
    5000 -- 5000 meters = 5km
)
ORDER BY location <-> ST_MakePoint(-122.4194, 37.7749)::geography;
-- The <-> operator orders by distance (closest first)
```

### 3. Bounding Box Queries

```sql
-- Find venues within a rectangular area
SELECT name, address
FROM venues
WHERE ST_Within(
    location,
    ST_MakeEnvelope(
        -122.5, 37.7,  -- Southwest corner (lon, lat)
        -122.3, 37.8,  -- Northeast corner (lon, lat)
        4326            -- SRID
    )::geography
);
```

## 🎯 Advanced Geospatial Functions

### Custom Function: Find Venues Within Radius

Our database includes a pre-built function for venue discovery:

```sql
-- Using our custom function
SELECT * FROM find_venues_within_radius(
    37.7749,    -- center latitude
    -122.4194,  -- center longitude  
    5.0         -- radius in kilometers
);

-- Returns:
-- - venue_id, venue_name, venue_address
-- - distance_km (calculated distance)
-- - overall_rating, total_reviews
```

### Custom Function: Personalized Recommendations

```sql
-- Get recommendations based on user preferences and location
SELECT * FROM get_venue_recommendations(
    '123e4567-e89b-12d3-a456-426614174000', -- user_id
    37.7749,     -- center latitude
    -122.4194,   -- center longitude
    10.0         -- radius in kilometers
);

-- Returns venues sorted by compatibility score:
-- - User's noise tolerance vs venue noise level
-- - User's WiFi importance vs venue WiFi quality
-- - Distance factor
-- - Overall rating
```

## 🏃‍♂️ Performance Optimization

### Spatial Indexes

Our schema includes optimized indexes:

```sql
-- GIST index for fast spatial queries
CREATE INDEX idx_venues_location ON venues USING GIST(location);

-- Check if index is being used
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM venues 
WHERE ST_DWithin(location, ST_MakePoint(-122.4194, 37.7749)::geography, 5000);
```

### Query Optimization Tips

```sql
-- ✅ Good: Use distance operator for ordering
SELECT name FROM venues 
ORDER BY location <-> ST_MakePoint(-122.4194, 37.7749)::geography
LIMIT 10;

-- ✅ Good: Filter first, then calculate exact distance
SELECT 
    name,
    ST_Distance(location, point.geom) / 1000 as distance_km
FROM venues,
     (SELECT ST_MakePoint(-122.4194, 37.7749)::geography as geom) point
WHERE ST_DWithin(location, point.geom, 10000) -- Filter within 10km first
ORDER BY location <-> point.geom;

-- ❌ Avoid: Calculating distance for all rows
SELECT name, ST_Distance(location, ST_MakePoint(-122.4194, 37.7749)::geography) as dist
FROM venues 
ORDER BY dist; -- This calculates distance for every venue!
```

## 🧪 Practical Examples

### Example 1: Coffee Shops Near User

```sql
-- Find coffee shops within walking distance (500m)
WITH user_location AS (
    SELECT ST_MakePoint(-122.4194, 37.7749)::geography as location
)
SELECT 
    v.name,
    v.address,
    ROUND(ST_Distance(v.location, ul.location)) as distance_meters,
    v.overall_rating
FROM venues v, user_location ul
WHERE 
    v.status = 'active'
    AND ST_DWithin(v.location, ul.location, 500) -- 500 meters
    AND EXISTS (
        SELECT 1 FROM venue_amenities va 
        WHERE va.venue_id = v.id AND va.has_coffee = true
    )
ORDER BY v.location <-> ul.location;
```

### Example 2: Best WiFi Venues by Area

```sql
-- Find venues with best WiFi in different neighborhoods
WITH neighborhoods AS (
    SELECT 
        'Downtown' as area,
        ST_MakePoint(-122.4194, 37.7749)::geography as center,
        1000 as radius_meters
    UNION ALL
    SELECT 
        'Mission District',
        ST_MakePoint(-122.4194, 37.7582)::geography,
        1500
)
SELECT 
    n.area,
    v.name,
    va.wifi_quality,
    v.overall_rating
FROM neighborhoods n
JOIN venues v ON ST_DWithin(v.location, n.center, n.radius_meters)
JOIN venue_amenities va ON v.id = va.venue_id
WHERE 
    v.status = 'active'
    AND va.wifi_quality >= 4
ORDER BY n.area, va.wifi_quality DESC, v.overall_rating DESC;
```

### Example 3: Venue Density Analysis

```sql
-- Analyze venue density in different areas
WITH grid AS (
    -- Create a 1km grid over San Francisco
    SELECT 
        ROUND(lng, 2) as grid_lng,
        ROUND(lat, 2) as grid_lat,
        ST_MakePoint(lng, lat)::geography as center
    FROM generate_series(-122.5, -122.3, 0.01) lng,
         generate_series(37.7, 37.8, 0.01) lat
)
SELECT 
    grid_lng,
    grid_lat,
    COUNT(v.id) as venue_count,
    ROUND(AVG(v.overall_rating), 1) as avg_rating
FROM grid g
LEFT JOIN venues v ON ST_DWithin(v.location, g.center, 500) -- 500m radius per grid cell
WHERE v.status = 'active' OR v.status IS NULL
GROUP BY grid_lng, grid_lat
HAVING COUNT(v.id) > 0
ORDER BY venue_count DESC;
```

## 🔄 Working with User Location

### Client-Side Location Access

```javascript
// Get user's current location (frontend)
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // Send to your API
        findNearbyVenues(lat, lng);
    });
}
```

### Server-Side Query (SvelteKit)

```typescript
// src/routes/api/venues/nearby/+server.ts
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';

export async function GET({ url }) {
    const lat = parseFloat(url.searchParams.get('lat') || '0');
    const lng = parseFloat(url.searchParams.get('lng') || '0');
    const radius = parseFloat(url.searchParams.get('radius') || '5');
    
    const { data, error } = await supabase.rpc('find_venues_within_radius', {
        center_lat: lat,
        center_lng: lng,
        radius_km: radius
    });
    
    if (error) throw error;
    return json(data);
}
```

## 🗺️ Location Data Sources

### Getting Venue Coordinates

```sql
-- Option 1: Manual entry (for testing)
INSERT INTO venues (name, address, location) VALUES 
('Test Cafe', '123 Main St, San Francisco, CA', 
 ST_MakePoint(-122.4194, 37.7749)::geography);

-- Option 2: From Google Places API (recommended)
-- Store Google Place ID and coordinates
INSERT INTO venues (name, address, location, place_id, google_rating) VALUES 
('Blue Bottle Coffee', '66 Mint St, San Francisco, CA 94103',
 ST_MakePoint(-122.3954, 37.7849)::geography,
 'ChIJXxxxxxxxxxxxxxxxxx', -- Google Place ID
 4.2);
```

### Validating Coordinates

```sql
-- Check if coordinates are reasonable (within expected bounds)
SELECT 
    name,
    ST_X(location::geometry) as longitude,
    ST_Y(location::geometry) as latitude,
    CASE 
        WHEN ST_X(location::geometry) BETWEEN -180 AND 180 
         AND ST_Y(location::geometry) BETWEEN -90 AND 90 
        THEN 'Valid'
        ELSE 'Invalid'
    END as coordinate_status
FROM venues
WHERE coordinate_status = 'Invalid'; -- Should return no rows
```

## 🧭 Common Spatial Patterns

### 1. Nearest Neighbor Search

```sql
-- Find the 5 closest venues to a point
SELECT name, 
       ROUND(ST_Distance(location, ST_MakePoint(-122.4194, 37.7749)::geography) / 1000, 2) as km
FROM venues
WHERE status = 'active'
ORDER BY location <-> ST_MakePoint(-122.4194, 37.7749)::geography
LIMIT 5;
```

### 2. Route Planning

```sql
-- Find venues along a route (simplified)
WITH route AS (
    SELECT ST_MakeLine(ARRAY[
        ST_MakePoint(-122.4194, 37.7749)::geography, -- Start
        ST_MakePoint(-122.4089, 37.7849)::geography  -- End
    ]) as line
)
SELECT v.name
FROM venues v, route r
WHERE ST_DWithin(v.location, r.line, 1000) -- Within 1km of route
  AND v.status = 'active';
```

### 3. Area Coverage Analysis

```sql
-- Calculate area covered by venues (using convex hull)
SELECT 
    ST_Area(ST_ConvexHull(ST_Collect(location))::geometry) / 1000000 as coverage_sq_km
FROM venues 
WHERE status = 'active';
```

## 📊 Geospatial Analytics

### Venue Distribution by Distance

```sql
-- Analyze venue distribution by distance from city center
WITH distances AS (
    SELECT 
        name,
        ROUND(ST_Distance(
            location, 
            ST_MakePoint(-122.4194, 37.7749)::geography
        ) / 1000, 1) as distance_km
    FROM venues 
    WHERE status = 'active'
)
SELECT 
    CASE 
        WHEN distance_km <= 1 THEN '0-1km'
        WHEN distance_km <= 2 THEN '1-2km'
        WHEN distance_km <= 5 THEN '2-5km'
        WHEN distance_km <= 10 THEN '5-10km'
        ELSE '10km+'
    END as distance_range,
    COUNT(*) as venue_count
FROM distances
GROUP BY distance_range
ORDER BY MIN(distance_km);
```

## 🚨 Common Pitfalls

### 1. Longitude/Latitude Order

```sql
-- ❌ Wrong: Latitude first
ST_MakePoint(37.7749, -122.4194)

-- ✅ Correct: Longitude first
ST_MakePoint(-122.4194, 37.7749)
```

### 2. Units Confusion

```sql
-- ❌ Wrong: Using degrees for distance
ST_DWithin(location, point, 0.05) -- 0.05 degrees ≈ 5.5km at equator

-- ✅ Correct: Using meters
ST_DWithin(location, point, 5000) -- 5000 meters = 5km
```

### 3. Missing Spatial Index

```sql
-- Always ensure spatial index exists
CREATE INDEX IF NOT EXISTS idx_venues_location 
ON venues USING GIST(location);
```

## 🎯 Best Practices

1. **Always use GEOGRAPHY for real-world distances**
2. **Longitude comes before latitude in ST_MakePoint**
3. **Use meters for distance calculations**
4. **Create GIST indexes on geography columns**
5. **Filter with ST_DWithin before expensive calculations**
6. **Use <-> operator for nearest neighbor queries**
7. **Validate coordinates before inserting**
8. **Cache expensive geospatial calculations**

## 📚 Next Steps

- [Supabase Integration](04-supabase-integration.md) - Working with Supabase and PostGIS
- [Database Testing](05-testing-debugging.md) - Testing geospatial queries
- [RLS Security](06-rls-security.md) - Securing location data

## 🎯 Key Takeaways

- PostGIS enables powerful location-based features
- Geography data type provides accurate real-world distances
- Spatial indexes are crucial for query performance
- Always validate coordinates and handle edge cases
- Understanding coordinate systems prevents common mistakes

Ready to build amazing location-based features! 🗺️🚀