-- Database Schema Test Script
-- This script tests the database schema with sample data and common queries

-- Test 1: Basic table creation and constraints
\echo 'Test 1: Verifying table structure...'

-- Check if all tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN (
        'users', 'venues', 'venue_amenities', 'venue_photos', 
        'reviews', 'review_photos', 'favorites', 'review_votes', 
        'venue_visits', 'venue_reports'
    )
ORDER BY table_name;

-- Test 2: Check PostGIS extension and geography columns
\echo 'Test 2: Checking PostGIS functionality...'

-- Verify PostGIS is installed
SELECT PostGIS_Version();

-- Check geography columns
SELECT 
    table_name, 
    column_name, 
    data_type,
    udt_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND data_type = 'USER-DEFINED' 
    AND udt_name = 'geography';

-- Test 3: Sample data insertion and basic queries
\echo 'Test 3: Testing sample data queries...'

-- Count records in each table
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'venues', COUNT(*) FROM venues
UNION ALL  
SELECT 'venue_amenities', COUNT(*) FROM venue_amenities
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews
UNION ALL
SELECT 'favorites', COUNT(*) FROM favorites
UNION ALL
SELECT 'review_votes', COUNT(*) FROM review_votes
UNION ALL
SELECT 'venue_visits', COUNT(*) FROM venue_visits
UNION ALL
SELECT 'venue_photos', COUNT(*) FROM venue_photos
ORDER BY table_name;

-- Test 4: Geospatial functionality
\echo 'Test 4: Testing geospatial queries...'

-- Test basic distance calculation
SELECT 
    v.name,
    v.address,
    ROUND(ST_Distance(v.location, ST_MakePoint(-122.4194, 37.7749)::geography) / 1000, 2) as distance_km_from_downtown_sf
FROM venues v
WHERE v.status = 'active'
ORDER BY v.location <-> ST_MakePoint(-122.4194, 37.7749)::geography;

-- Test venues within radius function
SELECT 
    venue_name,
    venue_address,
    distance_km,
    overall_rating
FROM find_venues_within_radius(37.7749, -122.4194, 10.0)
ORDER BY distance_km;

-- Test 5: User recommendations function
\echo 'Test 5: Testing recommendation algorithm...'

-- Test personalized recommendations
SELECT 
    venue_name,
    distance_km,
    overall_rating,
    compatibility_score
FROM get_venue_recommendations(
    '123e4567-e89b-12d3-a456-426614174000', -- Alice's user ID
    37.7749, 
    -122.4194, 
    10.0
)
ORDER BY compatibility_score DESC;

-- Test 6: Aggregate functions and triggers
\echo 'Test 6: Testing aggregation triggers...'

-- Check if venue aggregates are correctly calculated
SELECT 
    v.name,
    v.overall_rating as venue_avg_rating,
    v.total_reviews as venue_review_count,
    ROUND(AVG(r.overall_rating), 1) as calculated_avg_rating,
    COUNT(r.id) as calculated_review_count
FROM venues v
LEFT JOIN reviews r ON v.id = r.venue_id AND r.deleted_at IS NULL
WHERE v.status = 'active'
GROUP BY v.id, v.name, v.overall_rating, v.total_reviews
ORDER BY v.name;

-- Check user review counts
SELECT 
    u.name,
    u.total_reviews as user_review_count,
    COUNT(r.id) as calculated_review_count
FROM users u
LEFT JOIN reviews r ON u.id = r.user_id AND r.deleted_at IS NULL
GROUP BY u.id, u.name, u.total_reviews
ORDER BY u.name;

-- Test 7: Review voting system
\echo 'Test 7: Testing review voting system...'

SELECT 
    r.title,
    r.helpful_votes,
    r.total_votes,
    COUNT(rv.id) as calculated_total_votes,
    COUNT(CASE WHEN rv.is_helpful THEN 1 END) as calculated_helpful_votes
FROM reviews r
LEFT JOIN review_votes rv ON r.id = rv.review_id
GROUP BY r.id, r.title, r.helpful_votes, r.total_votes
ORDER BY r.helpful_votes DESC;

-- Test 8: Complex joins and relationships
\echo 'Test 8: Testing complex queries...'

-- Venue details with amenities and reviews
SELECT 
    v.name,
    v.address,
    v.overall_rating,
    va.wifi_quality,
    va.noise_level,
    va.power_outlets,
    COUNT(r.id) as review_count,
    COUNT(vp.id) as photo_count
FROM venues v
LEFT JOIN venue_amenities va ON v.id = va.venue_id
LEFT JOIN reviews r ON v.id = r.venue_id AND r.deleted_at IS NULL
LEFT JOIN venue_photos vp ON v.id = vp.venue_id AND vp.is_approved = true
WHERE v.status = 'active'
GROUP BY v.id, v.name, v.address, v.overall_rating, va.wifi_quality, va.noise_level, va.power_outlets
ORDER BY v.overall_rating DESC;

-- User activity summary
SELECT 
    u.name,
    u.total_reviews,
    COUNT(DISTINCT f.venue_id) as favorited_venues,
    COUNT(DISTINCT vv.venue_id) as visited_venues,
    AVG(r.overall_rating) as avg_rating_given
FROM users u
LEFT JOIN reviews r ON u.id = r.user_id AND r.deleted_at IS NULL
LEFT JOIN favorites f ON u.id = f.user_id
LEFT JOIN venue_visits vv ON u.id = vv.user_id
GROUP BY u.id, u.name, u.total_reviews
ORDER BY u.name;

-- Test 9: Data integrity constraints
\echo 'Test 9: Testing data integrity...'

-- Check for orphaned records
SELECT 'Orphaned venue_amenities' as issue, COUNT(*) as count
FROM venue_amenities va
LEFT JOIN venues v ON va.venue_id = v.id
WHERE v.id IS NULL

UNION ALL

SELECT 'Orphaned reviews', COUNT(*)
FROM reviews r
LEFT JOIN venues v ON r.venue_id = v.id
LEFT JOIN users u ON r.user_id = u.id
WHERE v.id IS NULL OR u.id IS NULL

UNION ALL

SELECT 'Orphaned favorites', COUNT(*)
FROM favorites f
LEFT JOIN venues v ON f.venue_id = v.id
LEFT JOIN users u ON f.user_id = u.id
WHERE v.id IS NULL OR u.id IS NULL;

-- Test 10: Performance checks
\echo 'Test 10: Checking indexes and performance...'

-- Check index usage
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
    AND tablename IN ('venues', 'reviews', 'users')
    AND attname IN ('location', 'venue_id', 'user_id', 'overall_rating')
ORDER BY tablename, attname;

\echo 'Schema tests completed!'
\echo 'Review the output above to verify:'
\echo '1. All tables exist and have proper structure'
\echo '2. PostGIS extension is working correctly'
\echo '3. Sample data was inserted successfully'
\echo '4. Geospatial queries return accurate results'
\echo '5. Recommendation algorithm produces reasonable scores'
\echo '6. Aggregate triggers maintain data consistency'
\echo '7. Review voting system calculates correctly'
\echo '8. Complex joins work as expected'
\echo '9. No data integrity violations exist'
\echo '10. Indexes are properly configured'