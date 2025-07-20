# Database Workflows and Best Practices

Master production-ready database development workflows, deployment strategies, and operational best practices.

## 📚 What You'll Learn

- Database development workflows for teams
- Production deployment strategies
- Backup and disaster recovery
- Performance optimization techniques
- Monitoring and maintenance routines
- Scaling considerations

## 🔄 Development Workflow

### Team Database Development Process

```
Developer Branch → Local Testing → Code Review → Staging → Production
       ↓              ↓             ↓           ↓           ↓
   Local DB    →  Test Suite  →  Team Review → Staging DB → Prod DB
   Migration      Unit Tests     Migration     Integration   Final
   Testing        RLS Tests      Review        Testing       Deploy
```

### Branch-Based Development

```bash
# Start new feature
git checkout -b feature/venue-tags
npm run db:reset # Fresh local database

# Create migration
touch database/migrations/003_add_venue_tags.sql
# ... write migration SQL

# Test migration locally
npm run db:setup
npm run test

# Update TypeScript types
npm run generate-types

# Commit changes
git add .
git commit -m "Add venue tagging system

- Create venue_tags table
- Create venue_tag_assignments junction table
- Add RLS policies for tag system
- Update TypeScript types
- Add test coverage"

# Push for review
git push origin feature/venue-tags
```

### Code Review Checklist

**Database Changes Review:**
- [ ] **Migration Safety**: No data loss, backwards compatible
- [ ] **Performance**: Indexes on new columns, no table locks
- [ ] **Security**: RLS policies present and tested
- [ ] **Testing**: Unit tests cover new functionality
- [ ] **Types**: TypeScript types updated
- [ ] **Documentation**: Migration documented with comments

**SQL Quality:**
- [ ] **Naming**: Consistent table/column naming conventions
- [ ] **Constraints**: Appropriate foreign keys and checks
- [ ] **Indexes**: Proper indexing strategy
- [ ] **Functions**: Well-documented custom functions

## 🚀 Deployment Strategy

### Environment Setup

```yaml
# environments.yml
development:
  database_url: "postgresql://localhost:5432/digitalnomadfriendly_dev"
  supabase_url: "https://dev-project.supabase.co"
  
staging:
  database_url: "${STAGING_DATABASE_URL}"
  supabase_url: "https://staging-project.supabase.co"
  
production:
  database_url: "${PRODUCTION_DATABASE_URL}"
  supabase_url: "https://prod-project.supabase.co"
```

### Pre-Deployment Validation

```bash
#!/bin/bash
# scripts/pre-deploy-validation.sh

set -e

echo "🔍 Pre-deployment validation started..."

# 1. Check migration syntax
echo "Validating SQL syntax..."
for migration in database/migrations/*.sql; do
  psql $STAGING_DATABASE_URL -f "$migration" --dry-run
done

# 2. Run test suite
echo "Running test suite..."
npm run test:db

# 3. Check for breaking changes
echo "Checking for breaking changes..."
npm run test:compatibility

# 4. Validate performance
echo "Running performance tests..."
npm run test:performance

# 5. Security audit
echo "Running security audit..."
npm run audit:security

echo "✅ Pre-deployment validation passed!"
```

### Safe Deployment Process

```bash
#!/bin/bash
# scripts/deploy-database.sh

ENVIRONMENT=${1:-staging}
MIGRATION_FILE=${2}

echo "🚀 Deploying to $ENVIRONMENT..."

# 1. Backup before deployment
echo "Creating backup..."
BACKUP_FILE="backup_${ENVIRONMENT}_$(date +%Y%m%d_%H%M%S).sql"
pg_dump $DATABASE_URL > backups/$BACKUP_FILE
echo "Backup saved: $BACKUP_FILE"

# 2. Apply migration in transaction
echo "Applying migration: $MIGRATION_FILE"
psql $DATABASE_URL << EOF
BEGIN;

-- Apply migration
\i $MIGRATION_FILE

-- Validate migration success
DO \$\$
DECLARE
    table_count INTEGER;
BEGIN
    -- Check critical tables exist
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('users', 'venues', 'reviews');
    
    IF table_count < 3 THEN
        RAISE EXCEPTION 'Critical tables missing after migration';
    END IF;
    
    RAISE NOTICE 'Migration validation passed';
END;
\$\$;

COMMIT;
EOF

# 3. Run smoke tests
echo "Running smoke tests..."
npm run test:smoke

# 4. Update application
echo "Updating application..."
# Deploy application code here

echo "✅ Deployment completed successfully!"
```

## 💾 Backup and Recovery

### Automated Backup Strategy

```bash
#!/bin/bash
# scripts/backup-database.sh

# Configuration
BACKUP_DIR="/backups/digitalnomadfriendly"
RETENTION_DAYS=30
S3_BUCKET="your-backup-bucket"

# Create timestamped backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="digitalnomadfriendly_${TIMESTAMP}.sql"

echo "Creating backup: $BACKUP_FILE"

# Full database backup
pg_dump $DATABASE_URL \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  > $BACKUP_DIR/$BACKUP_FILE

# Compress backup
gzip $BACKUP_DIR/$BACKUP_FILE

# Upload to cloud storage
aws s3 cp $BACKUP_DIR/${BACKUP_FILE}.gz s3://$S3_BUCKET/database/

# Clean old backups
find $BACKUP_DIR -name "*.gz" -mtime +$RETENTION_DAYS -delete

echo "✅ Backup completed: ${BACKUP_FILE}.gz"
```

### Disaster Recovery Plan

```bash
#!/bin/bash
# scripts/restore-database.sh

BACKUP_FILE=${1}
TARGET_DATABASE=${2:-$STAGING_DATABASE_URL}

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file> [target_database_url]"
  exit 1
fi

echo "🔄 Starting database restore..."
echo "Backup file: $BACKUP_FILE"
echo "Target database: $TARGET_DATABASE"

# Confirmation prompt
read -p "This will REPLACE the target database. Are you sure? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
  echo "Restore cancelled."
  exit 1
fi

# Download backup from S3 if needed
if [[ $BACKUP_FILE == s3://* ]]; then
  echo "Downloading backup from S3..."
  aws s3 cp $BACKUP_FILE ./temp_backup.sql.gz
  BACKUP_FILE="./temp_backup.sql.gz"
fi

# Decompress if needed
if [[ $BACKUP_FILE == *.gz ]]; then
  echo "Decompressing backup..."
  gunzip -c $BACKUP_FILE > temp_restore.sql
  BACKUP_FILE="temp_restore.sql"
fi

# Restore database
echo "Restoring database..."
psql $TARGET_DATABASE < $BACKUP_FILE

# Cleanup
rm -f temp_backup.sql.gz temp_restore.sql

echo "✅ Database restore completed!"
```

## 📊 Performance Optimization

### Query Optimization Workflow

```sql
-- 1. Identify slow queries
SELECT 
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  rows,
  100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- 2. Analyze problematic queries
EXPLAIN (ANALYZE, BUFFERS, VERBOSE) 
SELECT v.*, va.*, array_agg(vt.name) as tags
FROM venues v
LEFT JOIN venue_amenities va ON v.id = va.venue_id
LEFT JOIN venue_tag_assignments vta ON v.id = vta.venue_id
LEFT JOIN venue_tags vt ON vta.tag_id = vt.id
WHERE ST_DWithin(v.location, ST_MakePoint(-122.4194, 37.7749)::geography, 5000)
GROUP BY v.id, va.id;

-- 3. Add missing indexes
CREATE INDEX CONCURRENTLY idx_venue_tag_assignments_venue_id 
ON venue_tag_assignments(venue_id);

-- 4. Optimize query structure
-- Rewrite expensive joins, use CTEs, etc.
```

### Index Management

```sql
-- Monitor index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch,
  idx_scan,
  CASE WHEN idx_scan = 0 THEN 'UNUSED' ELSE 'USED' END as status
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC;

-- Find unused indexes (candidates for removal)
SELECT 
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND NOT indisprimary
AND NOT indisunique;

-- Check index bloat
SELECT 
  schemaname,
  tablename,
  indexname,
  ROUND(100 * (pgstatindex(schemaname||'.'||indexname)).free_percent, 2) as bloat_percent
FROM pg_stat_user_indexes
WHERE (pgstatindex(schemaname||'.'||indexname)).free_percent > 20;
```

### Connection Pool Optimization

```typescript
// src/lib/database/pool.ts
import { createClient } from '@supabase/supabase-js'

// Production connection configuration
export const productionSupabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    db: {
      schema: 'public',
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'x-application-name': 'digitalnomadfriendly'
      }
    }
  }
)

// Connection health monitoring
export async function monitorConnectionHealth() {
  try {
    const start = performance.now()
    
    const { data, error } = await productionSupabase
      .from('users')
      .select('count')
      .limit(1)
    
    const duration = performance.now() - start
    
    if (error) throw error
    
    console.log(`Database connection healthy: ${duration.toFixed(2)}ms`)
    return { healthy: true, latency: duration }
  } catch (error) {
    console.error('Database connection unhealthy:', error)
    return { healthy: false, error: error.message }
  }
}
```

## 📈 Monitoring and Maintenance

### Health Check System

```sql
-- Create comprehensive health check function
CREATE OR REPLACE FUNCTION system_health_check()
RETURNS json AS $$
DECLARE
  result json;
  db_size bigint;
  connection_count int;
  slow_query_count int;
  index_hit_ratio numeric;
BEGIN
  -- Database size
  SELECT pg_database_size(current_database()) INTO db_size;
  
  -- Active connections
  SELECT count(*) INTO connection_count
  FROM pg_stat_activity 
  WHERE state = 'active';
  
  -- Slow queries (> 1 second average)
  SELECT count(*) INTO slow_query_count
  FROM pg_stat_statements 
  WHERE mean_exec_time > 1000;
  
  -- Cache hit ratio
  SELECT 
    round(100.0 * sum(blks_hit) / nullif(sum(blks_hit) + sum(blks_read), 0), 2)
  INTO index_hit_ratio
  FROM pg_stat_database
  WHERE datname = current_database();
  
  -- Build result
  SELECT json_build_object(
    'timestamp', now(),
    'database_size_mb', round(db_size / 1024.0 / 1024.0, 2),
    'active_connections', connection_count,
    'slow_queries', slow_query_count,
    'cache_hit_ratio', index_hit_ratio,
    'status', CASE 
      WHEN connection_count > 50 THEN 'warning'
      WHEN slow_query_count > 10 THEN 'warning'
      WHEN index_hit_ratio < 95 THEN 'warning'
      ELSE 'healthy'
    END
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

### Automated Maintenance Tasks

```bash
#!/bin/bash
# scripts/maintenance.sh

echo "🔧 Starting database maintenance..."

# 1. Update table statistics
echo "Updating statistics..."
psql $DATABASE_URL -c "ANALYZE;"

# 2. Reindex if needed
echo "Checking for index bloat..."
psql $DATABASE_URL << 'EOF'
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN 
    SELECT schemaname, indexname 
    FROM pg_stat_user_indexes 
    WHERE (pgstatindex(schemaname||'.'||indexname)).free_percent > 30
  LOOP
    EXECUTE format('REINDEX INDEX CONCURRENTLY %I.%I', rec.schemaname, rec.indexname);
    RAISE NOTICE 'Reindexed %', rec.indexname;
  END LOOP;
END $$;
EOF

# 3. Clean up old data
echo "Cleaning up old data..."
psql $DATABASE_URL << 'EOF'
-- Delete soft-deleted records older than 30 days
DELETE FROM reviews 
WHERE deleted_at < NOW() - INTERVAL '30 days';

DELETE FROM venues 
WHERE deleted_at < NOW() - INTERVAL '30 days';

-- Clean up old venue visits (keep 1 year)
DELETE FROM venue_visits 
WHERE visit_date < NOW() - INTERVAL '1 year';
EOF

# 4. Check health
echo "Running health check..."
psql $DATABASE_URL -c "SELECT system_health_check();" | jq .

echo "✅ Maintenance completed!"
```

### Alerting System

```typescript
// src/lib/monitoring/alerts.ts
interface AlertThresholds {
  slowQueryTime: number      // ms
  connectionCount: number    // count
  cacheHitRatio: number     // percentage
  diskUsage: number         // percentage
}

const ALERT_THRESHOLDS: AlertThresholds = {
  slowQueryTime: 2000,
  connectionCount: 50,
  cacheHitRatio: 90,
  diskUsage: 80
}

export async function checkSystemAlerts(): Promise<void> {
  const { data: health } = await supabase.rpc('system_health_check')
  
  const alerts: string[] = []
  
  if (health.active_connections > ALERT_THRESHOLDS.connectionCount) {
    alerts.push(`High connection count: ${health.active_connections}`)
  }
  
  if (health.cache_hit_ratio < ALERT_THRESHOLDS.cacheHitRatio) {
    alerts.push(`Low cache hit ratio: ${health.cache_hit_ratio}%`)
  }
  
  if (health.slow_queries > 5) {
    alerts.push(`High slow query count: ${health.slow_queries}`)
  }
  
  if (alerts.length > 0) {
    await sendAlert({
      level: 'warning',
      message: 'Database performance issues detected',
      details: alerts,
      timestamp: new Date()
    })
  }
}

async function sendAlert(alert: Alert) {
  // Send to Slack, email, PagerDuty, etc.
  console.error('ALERT:', alert)
  
  // Example: Send to webhook
  await fetch(process.env.ALERT_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alert)
  })
}
```

## 📈 Scaling Considerations

### Read Replicas Strategy

```typescript
// Database routing for read/write operations
class DatabaseRouter {
  private writeClient: SupabaseClient
  private readClient: SupabaseClient
  
  constructor() {
    this.writeClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Read replica configuration (if available)
    this.readClient = createClient(
      process.env.SUPABASE_READ_REPLICA_URL || process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  
  // Route read operations to read replica
  async read<T>(operation: (client: SupabaseClient) => Promise<T>): Promise<T> {
    return operation(this.readClient)
  }
  
  // Route write operations to primary database
  async write<T>(operation: (client: SupabaseClient) => Promise<T>): Promise<T> {
    return operation(this.writeClient)
  }
  
  // Transactions must use primary database
  async transaction<T>(operation: (client: SupabaseClient) => Promise<T>): Promise<T> {
    return operation(this.writeClient)
  }
}

export const dbRouter = new DatabaseRouter()

// Usage in services
export const scalableVenueService = {
  async getVenues() {
    return dbRouter.read(client => 
      client.from('venues').select('*')
    )
  },
  
  async createVenue(venue: VenueInsert) {
    return dbRouter.write(client =>
      client.from('venues').insert(venue)
    )
  }
}
```

### Caching Strategy

```typescript
// src/lib/cache/redis.ts
import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL!)

export class DatabaseCache {
  private defaultTTL = 3600 // 1 hour
  
  async get<T>(key: string): Promise<T | null> {
    const cached = await redis.get(key)
    return cached ? JSON.parse(cached) : null
  }
  
  async set<T>(key: string, value: T, ttl = this.defaultTTL): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value))
  }
  
  async invalidate(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }
  
  // Cache-aside pattern
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl = this.defaultTTL
  ): Promise<T> {
    const cached = await this.get<T>(key)
    if (cached !== null) return cached
    
    const fresh = await fetcher()
    await this.set(key, fresh, ttl)
    return fresh
  }
}

export const dbCache = new DatabaseCache()

// Usage in venue service
export const cachedVenueService = {
  async getNearbyVenues(lat: number, lng: number, radius: number) {
    const cacheKey = `venues:nearby:${lat}:${lng}:${radius}`
    
    return dbCache.getOrSet(
      cacheKey,
      () => venueService.findNearbyVenues(lat, lng, radius),
      1800 // 30 minutes for location data
    )
  },
  
  async invalidateVenueCache(venueId: string) {
    await dbCache.invalidate(`venues:*${venueId}*`)
    await dbCache.invalidate('venues:nearby:*')
  }
}
```

## 🎯 Best Practices Summary

### Development
- **Version Control**: Track all schema changes in migrations
- **Testing**: Comprehensive test coverage for database operations
- **Documentation**: Comment complex queries and business logic
- **Code Review**: Always review database changes

### Security
- **RLS Policies**: Implement row-level security for all tables
- **Input Validation**: Validate all inputs before database operations
- **Least Privilege**: Grant minimal necessary permissions
- **Audit Logging**: Track sensitive operations

### Performance
- **Indexing**: Strategic index placement and monitoring
- **Query Optimization**: Regular analysis of slow queries
- **Connection Pooling**: Efficient connection management
- **Caching**: Cache frequently accessed data

### Operations
- **Monitoring**: Continuous health monitoring and alerting
- **Backups**: Automated backup and tested recovery procedures
- **Maintenance**: Regular maintenance tasks and optimization
- **Scaling**: Plan for growth with read replicas and caching

### Team Collaboration
- **Standards**: Consistent naming and coding conventions
- **Documentation**: Keep database documentation up to date
- **Communication**: Clear communication of schema changes
- **Training**: Ensure team understands database best practices

## 📚 Next Steps

Congratulations! You've mastered database development for Digital Nomad Friendly. Your next steps:

1. **Apply These Practices**: Implement these workflows in your development process
2. **Monitor Production**: Set up monitoring and alerting for your production database
3. **Optimize Performance**: Regularly review and optimize database performance
4. **Scale Gracefully**: Plan for growth with appropriate scaling strategies

## 🎯 Key Takeaways

- Systematic workflows prevent production issues
- Automation reduces human error and saves time
- Monitoring and alerting catch problems early
- Good practices scale with your application
- Database operations are critical to application success

You're now equipped to build and maintain a production-ready database system! 🚀💪