# Database Schema Documentation

## Overview

This directory contains the database schema and related files for the Digital Nomad Friendly application. The database uses PostgreSQL with PostGIS extension for geospatial functionality.

## Structure

```
database/
├── migrations/           # Database migration files
│   └── 001_initial_schema.sql
├── functions/           # Custom database functions (future)
├── seed/               # Sample data for development
│   └── sample_data.sql
└── README.md           # This file
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

## Development Setup

1. **Create Database**: Ensure PostgreSQL with PostGIS is installed
2. **Run Migration**: Execute `001_initial_schema.sql` to create all tables
3. **Load Sample Data**: Execute `sample_data.sql` for development data
4. **Configure RLS**: Ensure Supabase auth is properly configured for RLS policies

## Migration Guidelines

- Always use UUID primary keys
- Include `created_at` and `updated_at` timestamps
- Add appropriate indexes for query patterns
- Use soft deletes with `deleted_at` for data retention
- Include comprehensive comments and documentation
- Test with sample data before deployment

## Performance Considerations

- PostGIS indexes are crucial for geospatial queries
- Consider partitioning for large tables (visits, reviews)
- Monitor query performance and add indexes as needed
- Use connection pooling for high-traffic scenarios
- Regular VACUUM and ANALYZE for PostgreSQL optimization

## Security Notes

- All tables have RLS enabled
- Policies enforce user-based access control
- Sensitive data is protected by appropriate policies
- Anonymous users can only read public data
- Authentication required for most write operations