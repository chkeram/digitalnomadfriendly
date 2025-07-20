# Digital Nomad Friendly - Database Documentation

Complete documentation for the PostgreSQL database with PostGIS geospatial features, powered by Supabase.

## 🎯 Overview

This database is designed to support a location-based application for digital nomads to discover work-friendly venues. It features:

- **PostgreSQL** with PostGIS for geospatial data
- **Row Level Security (RLS)** for data protection
- **Real-time capabilities** via Supabase
- **Performance optimization** with strategic indexing
- **Automated aggregation** with triggers

## 🚀 Quick Start

### Prerequisites
- Supabase account and project
- PostGIS extension enabled
- Environment variables configured

### Automated Setup

```bash
# Complete database setup
npm run db:setup

# Reset database (development)
npm run db:reset
```

### Manual Setup

If you prefer manual setup or automated setup fails:

1. **Enable PostGIS** in Supabase Dashboard → Database → Extensions
2. **Run Migration**: Copy `migrations/001_initial_schema.sql` to Supabase SQL Editor
3. **Load Sample Data**: Copy `seed/sample_data.sql` to SQL Editor
4. **Test Setup**: Run `test_schema.sql` to verify everything works

## 📁 Directory Structure

```
database/
├── migrations/           # SQL migration files
│   └── 001_initial_schema.sql
├── seed/               # Sample data for development
│   └── sample_data.sql
├── test_schema.sql     # Database testing script
└── README.md          # This documentation
```

## Schema Overview

### Core Tables

#### users
- User profiles and authentication data
- Stores user preferences for personalized recommendations
- Tracks user activity (reviews, visits)

#### venues
- Cafe/venue information with geospatial data (PostGIS)
- Integration with Google Places API
- Business hours stored as JSONB for flexibility
- Aggregate ratings updated automatically via triggers

#### venue_amenities
- Detailed amenity information for each venue
- Work-related features (WiFi quality, noise level, power outlets)
- Physical amenities and environment details
- Accessibility and parking information

#### reviews
- User reviews and ratings for venues
- Multiple rating categories (WiFi, noise, comfort, food)
- Visit context (date, time, duration, crowd level)
- Community voting system

#### Additional Tables
- `venue_photos` - Photos and images for venues
- `review_photos` - Photos attached to reviews
- `favorites` - User bookmarks and lists
- `review_votes` - Helpful/not helpful votes on reviews
- `venue_visits` - Visit tracking for analytics
- `venue_reports` - User reports for venue issues

### Key Features

#### Geospatial Functionality
- Uses PostGIS for location-based queries
- Venues stored with GEOGRAPHY(POINT, 4326) for accurate distance calculations
- Custom functions for radius-based venue searches
- Personalized recommendations based on user location and preferences

#### Security
- Row Level Security (RLS) enabled on all tables
- Comprehensive security policies for data access
- User-based access control for personal data

#### Performance
- Optimized indexes for common query patterns
- Geospatial indexes (GIST) for location queries
- Composite indexes for filtered searches

#### Data Integrity
- Comprehensive constraints and validations
- Custom types for enumerated values
- Foreign key relationships with appropriate cascade rules
- Soft delete support with `deleted_at` timestamps

#### Automation
- Automatic `updated_at` timestamp updates via triggers
- Aggregate rating calculations via triggers
- Review vote counting automation

## Custom Functions

### find_venues_within_radius
```sql
SELECT * FROM find_venues_within_radius(37.7749, -122.4194, 5.0);
```
Finds venues within a specified radius (km) of given coordinates.

### get_venue_recommendations
```sql
SELECT * FROM get_venue_recommendations('user-uuid', 37.7749, -122.4194, 10.0);
```
Returns personalized venue recommendations based on user preferences and location.

## Usage Examples

### Finding Nearby Venues
```sql
-- Find venues within 2km of downtown San Francisco
SELECT v.name, v.address, 
       ROUND(ST_Distance(v.location, ST_MakePoint(-122.4194, 37.7749)::geography) / 1000, 2) as distance_km
FROM venues v
WHERE ST_DWithin(v.location, ST_MakePoint(-122.4194, 37.7749)::geography, 2000)
  AND v.status = 'active'
ORDER BY v.location <-> ST_MakePoint(-122.4194, 37.7749)::geography;
```

### Venue Search with Filters
```sql
-- Find quiet venues with good WiFi and outdoor seating
SELECT v.name, v.overall_rating, va.wifi_quality, va.noise_level
FROM venues v
JOIN venue_amenities va ON v.id = va.venue_id
WHERE v.status = 'active'
  AND va.wifi_quality >= 4
  AND va.noise_level <= 2
  AND va.outdoor_seating = true;
```

### User's Favorite Venues
```sql
-- Get user's favorite venues with details
SELECT v.name, v.address, f.personal_notes, f.list_name
FROM favorites f
JOIN venues v ON f.venue_id = v.id
WHERE f.user_id = 'user-uuid'
ORDER BY f.created_at DESC;
```

## 🌍 PostGIS Geospatial Features

### Location Storage

Venues store location data as PostGIS GEOGRAPHY points:

```sql
-- Location stored as longitude, latitude (SRID 4326)
location GEOGRAPHY(POINT, 4326) NOT NULL
```

### Key Spatial Functions

#### find_venues_within_radius
Find venues within a specified distance from a point.

```sql
SELECT * FROM find_venues_within_radius(
    37.7749,    -- center latitude
    -122.4194,  -- center longitude
    5.0         -- radius in kilometers
);

-- Returns: venue_id, venue_name, venue_address, distance_km, overall_rating, total_reviews
```

#### get_venue_recommendations
Get personalized venue recommendations based on user preferences.

```sql
SELECT * FROM get_venue_recommendations(
    'user-uuid',  -- user ID for personalization
    37.7749,      -- center latitude
    -122.4194,    -- center longitude
    10.0          -- search radius in kilometers
);

-- Returns: venue_id, venue_name, distance_km, overall_rating, compatibility_score
```

## 🔒 Row Level Security (RLS)

All tables have RLS enabled with comprehensive policies:

- **User Data**: Users can only access their own profiles and data
- **Venue Access**: Anyone can view active venues, authenticated users can create
- **Review System**: Users can create/edit their own reviews, all can read public reviews
- **Favorites**: Strictly personal, users can only access their own favorites

## ⚡ Performance Optimization

### Strategic Indexing

```sql
-- Geospatial index for location queries
CREATE INDEX idx_venues_location ON venues USING GIST(location);

-- Composite indexes for common queries
CREATE INDEX idx_venues_status_rating ON venues(status, overall_rating DESC);
CREATE INDEX idx_reviews_venue_date ON reviews(venue_id, created_at DESC);
```

## 🔧 Development Workflow

### Local Development

1. **Make Schema Changes**: Edit migration files in `migrations/`
2. **Test Locally**: Run `npm run db:setup` to test changes
3. **Update Types**: Sync TypeScript types in `src/lib/types/database.ts`
4. **Add Sample Data**: Update `seed/sample_data.sql` if needed
5. **Test Thoroughly**: Run test suite and manual tests
6. **Document Changes**: Update this README with new features

### Migration Management

```bash
# Create new migration (manual)
touch database/migrations/002_add_new_feature.sql

# Apply all migrations
npm run db:setup

# Reset database for clean testing
npm run db:reset
```

## 🧪 Testing and Validation

### Schema Testing
Run comprehensive tests with `test_schema.sql`:

```bash
# Copy test_schema.sql to Supabase SQL Editor and run
# Or use psql directly:
psql $DATABASE_URL -f database/test_schema.sql
```

### Test Categories
1. **Table Structure**: Verify all tables and columns exist
2. **PostGIS Functions**: Test spatial operations
3. **Sample Data**: Validate data insertion and relationships
4. **Geospatial Queries**: Test location-based functions
5. **Aggregate Functions**: Verify triggers work correctly
6. **Data Integrity**: Check for orphaned records

### Manual Testing Queries

```sql
-- Verify PostGIS is working
SELECT PostGIS_Version();

-- Test venue search
SELECT * FROM find_venues_within_radius(37.7749, -122.4194, 5.0);

-- Check data integrity
SELECT table_name, column_name, data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;
```

## 🚨 Troubleshooting

### Common Issues

**PostGIS not available**
- Enable PostGIS extension in Supabase Dashboard → Database → Extensions

**RLS policy blocking queries**
- Check authentication state: `SELECT auth.uid(), auth.role()`
- Verify policy conditions match your use case

**Slow spatial queries**
- Ensure spatial index exists: `CREATE INDEX idx_venues_location ON venues USING GIST(location)`
- Use `ST_DWithin` for radius filtering before expensive calculations

### Debug Commands

```sql
-- Check current auth context
SELECT auth.uid() as user_id, auth.role() as role;

-- List all policies
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC;
```

## 📚 Additional Resources

### Documentation Links
- [PostGIS Documentation](https://postgis.net/documentation/)
- [Supabase Database Guide](https://supabase.com/docs/guides/database)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Learning Materials
- [Database Tutorial Series](../tutorial-instructions/database/) - Complete learning path
- [PostGIS Tutorial](../tutorial-instructions/database/03-postgis-geospatial.md) - Geospatial queries
- [RLS Security Guide](../tutorial-instructions/database/05-rls-security.md) - Security best practices

### Migration Guidelines

- Always use UUID primary keys
- Include `created_at` and `updated_at` timestamps
- Add appropriate indexes for query patterns
- Use soft deletes with `deleted_at` for data retention
- Include comprehensive comments and documentation
- Test with sample data before deployment

### Performance Best Practices

- PostGIS indexes are crucial for geospatial queries
- Monitor query performance and add indexes as needed
- Use connection pooling for high-traffic scenarios
- Regular VACUUM and ANALYZE for PostgreSQL optimization

### Security Best Practices

- All tables have RLS enabled with comprehensive policies
- Policies enforce user-based access control
- Sensitive data is protected by appropriate policies
- Anonymous users can only read public data
- Authentication required for most write operations

---

This database is designed to scale with your application while maintaining performance and security. For detailed implementation guides, see the [Database Tutorial Series](../tutorial-instructions/database/).

Built with ❤️ for the digital nomad community.