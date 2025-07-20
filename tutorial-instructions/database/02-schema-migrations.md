# Schema Migration Guide

Learn how to safely modify your database schema, create migrations, and manage database changes over time.

## 📚 What You'll Learn

- Understanding database migrations and versioning
- Creating new migration files
- Adding/modifying tables, columns, and indexes
- Handling data transformations
- Rolling back changes safely
- Managing migrations in production

## 🔄 Migration Workflow Overview

```
1. Plan Changes → 2. Create Migration → 3. Test Locally → 4. Apply to Production
     ↓                    ↓                  ↓                     ↓
   Document          Update Schema      Run Tests           Deploy Safely
   Requirements         File           & Validate           & Monitor
```

## 📁 Migration File Structure

```
database/
├── migrations/
│   ├── 001_initial_schema.sql     ← Initial database setup
│   ├── 002_add_venue_tags.sql     ← Add venue tagging system
│   └── 003_update_user_prefs.sql  ← Modify user preferences
├── seed/
│   └── sample_data.sql             ← Test data for development
└── test_schema.sql                 ← Schema validation tests
```

## 🆕 Creating New Migrations

### Step 1: Plan Your Changes

Before creating a migration, document what you need to change:

**Example: Adding a venue tagging system**
- Add `venue_tags` table
- Add `venue_tag_assignments` junction table  
- Create indexes for performance
- Update TypeScript types
- Add sample data

### Step 2: Create Migration File

Create a new migration file with incrementing number:

```bash
# Create new migration file
touch database/migrations/002_add_venue_tags.sql
```

### Step 3: Write Migration SQL

```sql
-- Migration 002: Add Venue Tagging System
-- Created: 2024-01-XX
-- Purpose: Allow venues to be tagged with categories like "quiet", "good-wifi", etc.

-- =============================================================================
-- VENUE_TAGS TABLE
-- Predefined tags that can be applied to venues
-- =============================================================================
CREATE TABLE venue_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7), -- Hex color code for UI
    icon VARCHAR(50), -- Icon name for UI
    category VARCHAR(30), -- 'amenity', 'atmosphere', 'accessibility', etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert predefined tags
INSERT INTO venue_tags (name, description, color, icon, category) VALUES
('quiet', 'Very quiet environment, good for focused work', '#28a745', 'volume-off', 'atmosphere'),
('fast-wifi', 'High-speed WiFi (>50 Mbps)', '#007bff', 'wifi', 'amenity'),
('power-outlets', 'Plenty of accessible power outlets', '#ffc107', 'plug', 'amenity'),
('good-coffee', 'High-quality coffee and beverages', '#6f42c1', 'coffee', 'amenity'),
('outdoor-seating', 'Outdoor seating available', '#20c997', 'sun', 'amenity'),
('24-7', 'Open 24 hours', '#fd7e14', 'clock', 'hours'),
('pet-friendly', 'Pets welcome', '#e83e8c', 'heart', 'policy'),
('meeting-rooms', 'Private meeting spaces available', '#6c757d', 'users', 'amenity');

-- =============================================================================
-- VENUE_TAG_ASSIGNMENTS TABLE
-- Junction table linking venues to tags
-- =============================================================================
CREATE TABLE venue_tag_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES venue_tags(id) ON DELETE CASCADE,
    assigned_by_user_id UUID REFERENCES users(id),
    confidence_score DECIMAL(3,2) DEFAULT 1.0, -- AI confidence or user votes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate assignments
    CONSTRAINT unique_venue_tag UNIQUE (venue_id, tag_id)
);

-- =============================================================================
-- INDEXES for performance
-- =============================================================================
CREATE INDEX idx_venue_tags_category ON venue_tags(category);
CREATE INDEX idx_venue_tags_active ON venue_tags(is_active) WHERE is_active = true;
CREATE INDEX idx_venue_tag_assignments_venue ON venue_tag_assignments(venue_id);
CREATE INDEX idx_venue_tag_assignments_tag ON venue_tag_assignments(tag_id);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================
ALTER TABLE venue_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_tag_assignments ENABLE ROW LEVEL SECURITY;

-- Anyone can view active tags
CREATE POLICY "Anyone can view active venue tags" ON venue_tags
    FOR SELECT USING (is_active = true);

-- Anyone can view tag assignments
CREATE POLICY "Anyone can view venue tag assignments" ON venue_tag_assignments
    FOR SELECT USING (true);

-- Authenticated users can assign tags
CREATE POLICY "Authenticated users can assign tags" ON venue_tag_assignments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =============================================================================
-- UTILITY FUNCTIONS
-- =============================================================================

-- Function to get venues by tag
CREATE OR REPLACE FUNCTION get_venues_by_tag(
    tag_names TEXT[],
    center_lat DECIMAL DEFAULT NULL,
    center_lng DECIMAL DEFAULT NULL,
    radius_km DECIMAL DEFAULT 10.0
)
RETURNS TABLE (
    venue_id UUID,
    venue_name VARCHAR(255),
    venue_address TEXT,
    distance_km DECIMAL,
    overall_rating DECIMAL,
    matching_tags TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.name,
        v.address,
        CASE 
            WHEN center_lat IS NOT NULL AND center_lng IS NOT NULL 
            THEN ROUND(ST_Distance(v.location, ST_MakePoint(center_lng, center_lat)::geography) / 1000, 2)
            ELSE NULL
        END as distance_km,
        v.overall_rating,
        ARRAY_AGG(vt.name) as matching_tags
    FROM venues v
    JOIN venue_tag_assignments vta ON v.id = vta.venue_id
    JOIN venue_tags vt ON vta.tag_id = vt.id
    WHERE 
        v.status = 'active' 
        AND v.deleted_at IS NULL
        AND vt.name = ANY(tag_names)
        AND (
            center_lat IS NULL OR center_lng IS NULL OR
            ST_DWithin(v.location, ST_MakePoint(center_lng, center_lat)::geography, radius_km * 1000)
        )
    GROUP BY v.id, v.name, v.address, v.location, v.overall_rating
    ORDER BY 
        CASE 
            WHEN center_lat IS NOT NULL AND center_lng IS NOT NULL 
            THEN v.location <-> ST_MakePoint(center_lng, center_lat)::geography
            ELSE v.overall_rating
        END DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMMENTS for documentation
-- =============================================================================
COMMENT ON TABLE venue_tags IS 'Predefined tags for categorizing venues';
COMMENT ON TABLE venue_tag_assignments IS 'Junction table linking venues to tags';
COMMENT ON FUNCTION get_venues_by_tag IS 'Find venues matching specific tags with optional location filtering';
```

## 🔧 Advanced Migration Patterns

### Adding Columns Safely

```sql
-- ✅ Safe: Add nullable column with default
ALTER TABLE users 
ADD COLUMN timezone VARCHAR(50) DEFAULT 'UTC';

-- ✅ Safe: Add column then populate
ALTER TABLE venues 
ADD COLUMN slug VARCHAR(255);

-- Update existing records
UPDATE venues 
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL;

-- Make not null after populating
ALTER TABLE venues 
ALTER COLUMN slug SET NOT NULL;
```

### Modifying Existing Columns

```sql
-- ⚠️ Careful: Changing column types
-- First, check if data will fit
SELECT COUNT(*) FROM reviews 
WHERE LENGTH(title) > 100; -- If > 0, handle manually

-- If safe, modify
ALTER TABLE reviews 
ALTER COLUMN title TYPE VARCHAR(100);

-- 🚫 Dangerous: Dropping columns (add migration to restore)
-- Instead, deprecate first:
ALTER TABLE users 
ALTER COLUMN old_field_name SET DEFAULT NULL;
-- Remove references in code, then drop in future migration
```

### Creating Indexes Efficiently

```sql
-- ✅ Create index concurrently (doesn't lock table)
CREATE INDEX CONCURRENTLY idx_reviews_created_at_new 
ON reviews(created_at DESC);

-- For large tables, create partial indexes
CREATE INDEX idx_active_venues 
ON venues(created_at) 
WHERE status = 'active' AND deleted_at IS NULL;
```

## 🧪 Testing Migrations

### Step 1: Test Locally

```bash
# Run your new migration
npm run db:setup

# Run tests to verify everything works
npm run db:test

# Test your application
npm run dev
```

### Step 2: Create Test Data

Update `database/seed/sample_data.sql` to include test data for new features:

```sql
-- Add sample venue tags
INSERT INTO venue_tag_assignments (venue_id, tag_id) 
SELECT v.id, vt.id 
FROM venues v, venue_tags vt 
WHERE v.name = 'Blue Bottle Coffee' 
  AND vt.name IN ('good-coffee', 'fast-wifi');
```

### Step 3: Update TypeScript Types

Always update your TypeScript definitions in `src/lib/types/database.ts`:

```typescript
export interface VenueTag {
  id: string
  name: string
  description: string | null
  color: string | null
  icon: string | null
  category: string | null
  is_active: boolean
  created_at: string
}

export interface VenueTagAssignment {
  id: string
  venue_id: string
  tag_id: string
  assigned_by_user_id: string | null
  confidence_score: number
  created_at: string
}
```

## 🚀 Applying Migrations

### Development Environment

```bash
# Reset and apply all migrations
npm run db:reset

# Or apply specific migration manually
psql $DATABASE_URL -f database/migrations/002_add_venue_tags.sql
```

### Production Environment

```bash
# 1. Backup database first
pg_dump $PROD_DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Apply migration in transaction
psql $PROD_DATABASE_URL -c "
BEGIN;
\i database/migrations/002_add_venue_tags.sql
-- Test critical queries here
SELECT COUNT(*) FROM venue_tags;
COMMIT;
"

# 3. Verify application still works
# 4. Monitor for errors
```

## 🔄 Rollback Strategies

### Create Rollback Script

For each migration, consider creating a rollback script:

```sql
-- rollback_002_add_venue_tags.sql
-- Rollback for Migration 002: Remove venue tagging system

-- Drop functions first
DROP FUNCTION IF EXISTS get_venues_by_tag;

-- Drop tables (CASCADE removes foreign key constraints)
DROP TABLE IF EXISTS venue_tag_assignments;
DROP TABLE IF EXISTS venue_tags;
```

### Safe Rollback Process

```bash
# 1. Stop application
# 2. Backup current state
pg_dump $DATABASE_URL > backup_before_rollback.sql

# 3. Apply rollback
psql $DATABASE_URL -f database/rollbacks/rollback_002_add_venue_tags.sql

# 4. Test application
# 5. If successful, restart application
```

## 📋 Migration Checklist

Before applying any migration:

### Pre-Migration
- [ ] **Backup**: Create database backup
- [ ] **Test**: Verify migration on development copy
- [ ] **Review**: Code review for SQL syntax and logic
- [ ] **Downtime**: Plan for any required downtime
- [ ] **Rollback**: Prepare rollback plan

### During Migration
- [ ] **Transaction**: Wrap in transaction if possible
- [ ] **Monitor**: Watch for lock timeouts or errors
- [ ] **Validate**: Test critical queries after migration
- [ ] **Document**: Record any issues or deviations

### Post-Migration
- [ ] **Verify**: Test application functionality
- [ ] **Performance**: Check query performance
- [ ] **Monitor**: Watch error logs and metrics
- [ ] **Update**: Update documentation and types

## 🚨 Common Pitfalls and Solutions

### Long-Running Migrations

**Problem**: Migration locks table for too long
```sql
-- ❌ Dangerous on large tables
ALTER TABLE reviews ADD COLUMN new_field TEXT NOT NULL DEFAULT 'default_value';
```

**Solution**: Multi-step approach
```sql
-- Step 1: Add nullable column
ALTER TABLE reviews ADD COLUMN new_field TEXT;

-- Step 2: Update in batches
UPDATE reviews SET new_field = 'default_value' WHERE id IN (
  SELECT id FROM reviews WHERE new_field IS NULL LIMIT 1000
);
-- Repeat until all updated

-- Step 3: Make not null
ALTER TABLE reviews ALTER COLUMN new_field SET NOT NULL;
```

### Foreign Key Violations

**Problem**: Adding foreign key to existing data
```sql
-- ❌ May fail if referential integrity violated
ALTER TABLE reviews ADD CONSTRAINT fk_reviews_venue 
FOREIGN KEY (venue_id) REFERENCES venues(id);
```

**Solution**: Clean data first
```sql
-- Find orphaned records
SELECT COUNT(*) FROM reviews r 
LEFT JOIN venues v ON r.venue_id = v.id 
WHERE v.id IS NULL;

-- Handle orphaned records (delete or update)
DELETE FROM reviews WHERE venue_id NOT IN (SELECT id FROM venues);

-- Then add constraint
ALTER TABLE reviews ADD CONSTRAINT fk_reviews_venue 
FOREIGN KEY (venue_id) REFERENCES venues(id);
```

### Index Creation Blocking

**Problem**: Index creation blocks table
```sql
-- ❌ Locks table during creation
CREATE INDEX idx_large_table_field ON large_table(field);
```

**Solution**: Use CONCURRENTLY
```sql
-- ✅ Non-blocking index creation
CREATE INDEX CONCURRENTLY idx_large_table_field ON large_table(field);
```

## 🎯 Best Practices

1. **Incremental Changes**: Make small, focused changes
2. **Backward Compatibility**: Ensure new schema works with old code
3. **Data Preservation**: Never lose data without explicit approval
4. **Performance**: Consider impact on query performance
5. **Testing**: Always test on production-like data volumes
6. **Documentation**: Document complex migrations thoroughly
7. **Monitoring**: Set up alerts for migration failures

## 📚 Next Steps

- [PostGIS and Geospatial Queries](03-postgis-geospatial.md) - Working with location data
- [Supabase Integration](04-supabase-integration.md) - Advanced Supabase features
- [RLS Policies and Security](05-rls-security.md) - Database security best practices

## 🎯 Key Takeaways

- Migrations should be incremental and reversible
- Always backup before applying migrations
- Test migrations thoroughly on development data
- Use transactions for safety
- Update TypeScript types after schema changes
- Plan for rollback scenarios
- Monitor application after migrations

Remember: A good migration is one you never notice! 🚀