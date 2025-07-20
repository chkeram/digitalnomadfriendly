# RLS Policies and Security Guide

Master Row Level Security (RLS) to protect your data while maintaining functionality. Learn security best practices for Supabase applications.

## 📚 What You'll Learn

- Understanding Row Level Security (RLS) fundamentals
- Writing and testing RLS policies
- Common security patterns and best practices
- Debugging RLS policy issues
- Performance optimization for secure queries
- API key management and environment security

## 🔒 RLS Fundamentals

### What is Row Level Security?

RLS allows you to control which rows users can see, insert, update, or delete based on policies you define.

```sql
-- Without RLS: Users can access ALL data
SELECT * FROM reviews; -- Returns all reviews in database

-- With RLS: Users only see what policies allow
SELECT * FROM reviews; -- Returns only reviews they're allowed to see
```

### How RLS Works

1. **Enable RLS** on a table
2. **Create policies** that define access rules
3. **PostgreSQL enforces** policies automatically
4. **Queries are filtered** based on current user context

```sql
-- Enable RLS on a table
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create a policy
CREATE POLICY "Users can view their own reviews" 
ON reviews FOR SELECT 
USING (auth.uid() = user_id);
```

## 🛡️ Understanding Our Security Model

### Authentication Context

Supabase provides these functions in RLS policies:

```sql
-- Current user's UUID
auth.uid() -> UUID | NULL

-- Current user's role ('authenticated', 'anon', 'service_role')  
auth.role() -> TEXT

-- Current user's JWT claims
auth.jwt() -> JSONB

-- Example: Check if user is authenticated
auth.role() = 'authenticated'

-- Example: Check if user owns a resource
auth.uid() = user_id
```

### Policy Types

```sql
-- SELECT policies (what users can read)
CREATE POLICY "policy_name" ON table_name 
FOR SELECT USING (condition);

-- INSERT policies (what users can create)
CREATE POLICY "policy_name" ON table_name 
FOR INSERT WITH CHECK (condition);

-- UPDATE policies (what users can modify)
CREATE POLICY "policy_name" ON table_name 
FOR UPDATE USING (condition) WITH CHECK (new_condition);

-- DELETE policies (what users can remove)
CREATE POLICY "policy_name" ON table_name 
FOR DELETE USING (condition);

-- ALL operations (shorthand)
CREATE POLICY "policy_name" ON table_name 
FOR ALL USING (condition) WITH CHECK (condition);
```

## 📝 Real-World Policy Examples

### User Profile Security

```sql
-- Users table: Users can only access their own profile
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (auth.uid() = id);

-- Public data: Anyone can see basic user info for reviews/etc
CREATE POLICY "Public user data visible" ON users
FOR SELECT USING (
  -- Only show name and avatar, handled by SELECT clause in app
  true -- Policy allows access, app controls which columns
);

-- Note: Use separate queries for public vs private data
-- Private: SELECT id, email, preferences FROM users WHERE id = auth.uid()
-- Public: SELECT id, name, avatar_url FROM users WHERE id = $1
```

### Venue Data Security

```sql
-- Venues: Public read, authenticated write
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;

-- Anyone can view active venues
CREATE POLICY "Anyone can view active venues" ON venues
FOR SELECT USING (status = 'active' AND deleted_at IS NULL);

-- Authenticated users can create venues
CREATE POLICY "Authenticated users can create venues" ON venues
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' 
  AND auth.uid() = created_by_user_id
);

-- Users can update venues they created
CREATE POLICY "Users can update own venues" ON venues
FOR UPDATE USING (auth.uid() = created_by_user_id);

-- Only venue creators can delete (soft delete)
CREATE POLICY "Users can delete own venues" ON venues
FOR UPDATE USING (
  auth.uid() = created_by_user_id 
  AND deleted_at IS NULL
);
```

### Review System Security

```sql
-- Reviews: Complex permissions
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can read non-flagged reviews
CREATE POLICY "Anyone can view non-flagged reviews" ON reviews
FOR SELECT USING (
  is_flagged = false 
  AND deleted_at IS NULL
);

-- Authenticated users can create reviews
CREATE POLICY "Authenticated users can create reviews" ON reviews
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
  AND auth.uid() = user_id
  -- Prevent duplicate reviews (also enforced by unique constraint)
  AND NOT EXISTS (
    SELECT 1 FROM reviews r2 
    WHERE r2.user_id = user_id 
    AND r2.venue_id = venue_id 
    AND r2.deleted_at IS NULL
  )
);

-- Users can update their own reviews (within time limit)
CREATE POLICY "Users can update own recent reviews" ON reviews
FOR UPDATE USING (
  auth.uid() = user_id
  AND created_at > NOW() - INTERVAL '24 hours' -- 24-hour edit window
  AND deleted_at IS NULL
);

-- Users can soft-delete their own reviews
CREATE POLICY "Users can delete own reviews" ON reviews
FOR UPDATE USING (
  auth.uid() = user_id
  AND deleted_at IS NULL
) WITH CHECK (
  deleted_at IS NOT NULL -- Only allow setting deleted_at
);
```

### Favorites Security

```sql
-- Favorites: Strictly personal
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Users can only see their own favorites
CREATE POLICY "Users can view own favorites" ON favorites
FOR SELECT USING (auth.uid() = user_id);

-- Users can add to their favorites
CREATE POLICY "Users can create own favorites" ON favorites
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can remove their favorites
CREATE POLICY "Users can delete own favorites" ON favorites
FOR DELETE USING (auth.uid() = user_id);
```

## 🔧 Advanced Security Patterns

### Time-Based Permissions

```sql
-- Allow editing reviews for 24 hours after creation
CREATE POLICY "Users can edit recent reviews" ON reviews
FOR UPDATE USING (
  auth.uid() = user_id
  AND created_at > NOW() - INTERVAL '24 hours'
);

-- Business hours posting (if needed)
CREATE POLICY "Venues can be created during business hours" ON venues
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
  AND EXTRACT(hour FROM NOW()) BETWEEN 9 AND 17 -- 9 AM to 5 PM
);
```

### Role-Based Access

```sql
-- Admin-only operations
CREATE POLICY "Admins can moderate content" ON reviews
FOR UPDATE USING (
  auth.jwt() ->> 'role' = 'admin'
  OR (
    auth.uid() = user_id 
    AND created_at > NOW() - INTERVAL '24 hours'
  )
);

-- Moderator permissions
CREATE POLICY "Moderators can flag content" ON reviews
FOR UPDATE USING (
  auth.jwt() ->> 'role' IN ('admin', 'moderator')
  OR auth.uid() = user_id
) WITH CHECK (
  -- Moderators can only set is_flagged, not edit content
  CASE 
    WHEN auth.jwt() ->> 'role' IN ('admin', 'moderator') 
    THEN true
    ELSE NEW.title = OLD.title AND NEW.text = OLD.text
  END
);
```

### Location-Based Security

```sql
-- Only allow venue creation in certain areas
CREATE POLICY "Venues must be in allowed cities" ON venues
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
  AND city IN ('San Francisco', 'New York', 'Seattle', 'Austin')
);

-- Privacy: Only show location to verified users
CREATE POLICY "Location visible to verified users" ON venues
FOR SELECT USING (
  status = 'active'
  AND (
    auth.role() = 'anon' -- Public venues without exact location
    OR (
      auth.role() = 'authenticated' 
      AND EXISTS (
        SELECT 1 FROM users u 
        WHERE u.id = auth.uid() 
        AND u.is_verified = true
      )
    )
  )
);
```

### Data Validation in Policies

```sql
-- Ensure data quality in policies
CREATE POLICY "Reviews must have valid ratings" ON reviews
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
  AND overall_rating BETWEEN 1 AND 5
  AND (wifi_rating IS NULL OR wifi_rating BETWEEN 1 AND 5)
  AND (noise_rating IS NULL OR noise_rating BETWEEN 1 AND 5)
  AND LENGTH(title) >= 5
  AND LENGTH(text) >= 20
);

-- Prevent spam
CREATE POLICY "Rate limit review creation" ON reviews
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated'
  AND (
    SELECT COUNT(*) 
    FROM reviews r 
    WHERE r.user_id = auth.uid() 
    AND r.created_at > NOW() - INTERVAL '1 hour'
  ) < 5 -- Max 5 reviews per hour
);
```

## 🐛 Debugging RLS Issues

### Common Problems and Solutions

#### 1. Policy Not Working

```sql
-- Problem: Users can't see their own data
SELECT * FROM reviews WHERE user_id = auth.uid(); -- Returns nothing

-- Debug: Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'reviews';

-- Debug: Check existing policies
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'reviews';

-- Solution: Ensure policy exists and is correct
CREATE POLICY "Users can view own reviews" ON reviews
FOR SELECT USING (auth.uid() = user_id);
```

#### 2. Authentication Issues

```sql
-- Problem: auth.uid() returns NULL
-- Debug: Check current auth state
SELECT 
  auth.uid() as current_user_id,
  auth.role() as current_role,
  auth.jwt() as jwt_claims;

-- Common causes:
-- - User not logged in (auth.uid() = NULL)
-- - Using anon key instead of service role key
-- - Session expired
```

#### 3. Policy Too Restrictive

```sql
-- Problem: Policy blocks legitimate access
-- Debug: Test policy logic
SELECT 
  r.*,
  auth.uid() as current_user,
  r.user_id as review_owner,
  (auth.uid() = r.user_id) as can_access
FROM reviews r
WHERE r.id = 'specific-review-id';

-- Solution: Adjust policy conditions
CREATE POLICY "Users can view reviews" ON reviews
FOR SELECT USING (
  deleted_at IS NULL 
  AND (
    is_flagged = false 
    OR auth.uid() = user_id -- Users can see their own flagged reviews
  )
);
```

### Testing Policies

```sql
-- Test as different user types
-- 1. Test as anonymous user
SET request.jwt.claims TO '{}';

-- 2. Test as specific authenticated user
SET request.jwt.claims TO json_build_object(
  'sub', '123e4567-e89b-12d3-a456-426614174000',
  'role', 'authenticated'
);

-- 3. Test as admin
SET request.jwt.claims TO json_build_object(
  'sub', '123e4567-e89b-12d3-a456-426614174000',
  'role', 'authenticated',
  'app_role', 'admin'
);

-- Run your queries to see what each user type can access
SELECT * FROM reviews;
```

## ⚡ Performance Considerations

### Efficient Policy Design

```sql
-- ✅ Good: Use indexes in policy conditions
CREATE POLICY "Users can view own reviews" ON reviews
FOR SELECT USING (auth.uid() = user_id);
-- Ensure index exists: CREATE INDEX idx_reviews_user_id ON reviews(user_id);

-- ❌ Avoid: Complex subqueries in policies
CREATE POLICY "Expensive policy" ON reviews
FOR SELECT USING (
  auth.uid() IN (
    SELECT u.id FROM users u 
    JOIN subscriptions s ON u.id = s.user_id 
    WHERE s.status = 'active'
  )
);

-- ✅ Better: Pre-compute expensive conditions
-- Add a computed column or use materialized views
ALTER TABLE users ADD COLUMN has_active_subscription BOOLEAN DEFAULT false;
-- Update via trigger when subscriptions change

CREATE POLICY "Efficient subscription check" ON reviews
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() 
    AND u.has_active_subscription = true
  )
);
```

### Policy Performance Monitoring

```sql
-- Monitor slow queries with RLS
SELECT 
  query,
  mean_exec_time,
  calls
FROM pg_stat_statements 
WHERE query LIKE '%reviews%'
ORDER BY mean_exec_time DESC;

-- Check if policies are using indexes
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM reviews 
WHERE auth.uid() = user_id;
```

## 🔐 API Security Best Practices

### Environment Variables

```bash
# .env.local (never commit to git)
PUBLIC_SUPABASE_URL=https://project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ... # Safe to expose (limited permissions)
SUPABASE_SERVICE_ROLE_KEY=eyJ... # Keep secret! (full permissions)

# Use different projects for different environments
# Development
PUBLIC_SUPABASE_URL=https://dev-project.supabase.co

# Production  
PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
```

### Key Management

```typescript
// ✅ Correct: Use appropriate keys
const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.PUBLIC_SUPABASE_ANON_KEY! // Client-side operations
)

const adminSupabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Server-side only!
)

// ❌ Never: Expose service role key to client
// This would bypass ALL RLS policies!
```

### Input Validation

```typescript
// Always validate inputs before database operations
import { z } from 'zod'

const createReviewSchema = z.object({
  venue_id: z.string().uuid(),
  overall_rating: z.number().min(1).max(5),
  title: z.string().min(5).max(255),
  text: z.string().min(20).max(5000)
})

export async function createReview(data: unknown) {
  // Validate input
  const validData = createReviewSchema.parse(data)
  
  // RLS policies will enforce user_id = auth.uid()
  const { data: review, error } = await supabase
    .from('reviews')
    .insert({
      ...validData,
      user_id: user.id // Set by auth context
    })
    .select()
    .single()
  
  return { review, error }
}
```

## 🚨 Security Checklist

### Before Deployment

- [ ] **RLS Enabled**: All tables have RLS enabled
- [ ] **Policies Tested**: Each policy tested with different user types
- [ ] **No Data Leaks**: Anonymous users can't access private data
- [ ] **Input Validation**: All inputs validated on client and server
- [ ] **Key Security**: Service role key only used server-side
- [ ] **Error Handling**: Errors don't leak sensitive information
- [ ] **Rate Limiting**: Prevent abuse with rate limiting
- [ ] **Audit Logging**: Track sensitive operations

### Regular Security Reviews

```sql
-- Check for tables without RLS
SELECT schemaname, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false;

-- Review all policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Find overly permissive policies
SELECT * FROM pg_policies 
WHERE qual = 'true' OR with_check = 'true';
```

## 🎯 Security Best Practices Summary

1. **Enable RLS on all tables** containing user data
2. **Use principle of least privilege** - grant minimal necessary access
3. **Test policies thoroughly** with different user types
4. **Validate all inputs** on both client and server
5. **Never expose service role key** to client-side code
6. **Monitor and audit** database access patterns
7. **Use indexes** to make secure queries performant
8. **Keep policies simple** to avoid bugs and performance issues

## 📚 Next Steps

- [Database Testing](06-testing-debugging.md) - Testing security policies
- [Performance Optimization](07-performance.md) - Optimizing secure queries
- [Deployment Guide](08-deployment.md) - Production security considerations

## 🎯 Key Takeaways

- RLS provides powerful, automatic row-level security
- Policies should be simple, efficient, and thoroughly tested
- Different user types need different access levels
- Security and performance must be balanced
- Regular security audits prevent vulnerabilities

Your data is now secure and your users' privacy is protected! 🔒🚀