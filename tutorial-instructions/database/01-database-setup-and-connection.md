# Database Setup and Connection Tutorial

Welcome to the Digital Nomad Friendly database tutorial series! This guide will help you understand and work with the PostgreSQL database, Supabase integration, and PostGIS geospatial features.

## 📚 What You'll Learn

- Setting up Supabase and connecting to your database
- Understanding the database schema and relationships
- Working with environment variables and authentication
- Testing your database connection
- Using the automated setup scripts

## 🚀 Prerequisites

Before starting, make sure you have:
- A Supabase account (free tier available)
- Basic understanding of SQL
- Node.js 18+ installed
- The project dependencies installed (`npm install`)

## 📋 Step 1: Create Your Supabase Project

### 1.1 Sign Up for Supabase
1. Go to [supabase.com](https://supabase.com) and create an account
2. Click "New Project" and create a new project
3. Choose a project name (e.g., "digitalnomadfriendly-dev")
4. Set a strong database password and remember it
5. Choose a region close to your location

### 1.2 Get Your Project Credentials
1. Once your project is created, go to **Settings → API**
2. Copy the following values:
   - **Project URL** (starts with `https://xyz.supabase.co`)
   - **Anon key** (public key for client-side access)
   - **Service role key** (secret key for admin operations)

## 🔧 Step 2: Configure Environment Variables

### 2.1 Set Up Your .env File
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your Supabase credentials:
   ```env
   # Supabase Configuration
   PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   
   # Required: For database setup and admin operations
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   
   # Google Maps API Configuration (optional for now)
   PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

### 2.2 Understanding the Keys
- **PUBLIC_SUPABASE_URL**: Your Supabase project URL
- **PUBLIC_SUPABASE_ANON_KEY**: Public key for client-side operations (safe to expose)
- **SUPABASE_SERVICE_ROLE_KEY**: Admin key for database setup (keep secret!)

## 🗄️ Step 3: Enable PostGIS Extension

PostGIS is required for geospatial features (finding venues by location).

### 3.1 Enable via Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Database → Extensions**
3. Search for "postgis"
4. Click **Enable** next to PostGIS
5. Wait for it to install (may take a few minutes)

### 3.2 Verify PostGIS Installation
You can test PostGIS by running this query in the SQL Editor:
```sql
SELECT PostGIS_Version();
```

## 🚀 Step 4: Run Automated Database Setup

We've created scripts to automate the entire database setup process.

### 4.1 Run the Setup Script
```bash
npm run db:setup
```

This script will:
- ✅ Test your Supabase connection
- ✅ Check PostGIS availability
- ✅ Create all database tables and relationships
- ✅ Set up Row Level Security (RLS) policies
- ✅ Create indexes for performance
- ✅ Add utility functions for geospatial queries
- ✅ Load sample data for testing

### 4.2 Understanding the Output
You should see output like:
```
🚀 Starting database setup...

🔄 Testing Supabase connection...
✅ Supabase connection successful

🔄 Checking PostGIS extension...
✅ PostGIS extension is available

🔄 Creating exec_sql function...
✅ exec_sql function created successfully

🔄 Running database migration...
✅ Running database migration completed automatically

🔄 Loading sample data...
✅ Loading sample data completed automatically

🎉 Database setup completed successfully!
📋 You can now test with: npm run db:test
```

## 🧪 Step 5: Test Your Database

### 5.1 Run Database Tests
```bash
npm run db:test
```

This will run comprehensive tests to verify:
- All tables were created correctly
- PostGIS functions work
- Sample data was loaded
- Geospatial queries return results
- Recommendation algorithms work

### 5.2 Manual Testing via Supabase
You can also test manually in the Supabase Dashboard:

1. Go to **Table Editor** to see your tables
2. Go to **SQL Editor** to run custom queries

Try these test queries:
```sql
-- Check tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Count sample data
SELECT 'users' as table_name, COUNT(*) as records FROM users
UNION ALL
SELECT 'venues', COUNT(*) FROM venues
UNION ALL
SELECT 'reviews', COUNT(*) FROM reviews;

-- Test geospatial query (find venues near San Francisco)
SELECT name, address, 
       ST_Distance(location, ST_MakePoint(-122.4194, 37.7749)::geography) / 1000 as distance_km
FROM venues 
WHERE ST_DWithin(location, ST_MakePoint(-122.4194, 37.7749)::geography, 10000)
ORDER BY distance_km;
```

## 🔍 Step 6: Explore Your Database Schema

### 6.1 Core Tables
Your database now contains these main tables:
- **users**: User profiles and preferences
- **venues**: Cafe/venue information with geospatial data
- **venue_amenities**: Detailed amenity info (WiFi, noise, etc.)
- **reviews**: User reviews and ratings
- **favorites**: User bookmarks
- **venue_visits**: Visit tracking for analytics

### 6.2 Key Features
- **PostGIS Integration**: Location-based queries and distance calculations
- **Row Level Security**: Data protection policies
- **Automatic Aggregation**: Rating calculations via triggers
- **Geospatial Functions**: Find venues within radius, get recommendations

## 🛠️ Available Database Scripts

| Command | Description |
|---------|-------------|
| `npm run db:setup` | Complete database initialization |
| `npm run db:reset` | Reset and reinitialize database |

## 🚨 Troubleshooting

### Connection Issues
- **Error: Invalid API key**: Check your `SUPABASE_SERVICE_ROLE_KEY` in `.env`
- **Error: Project not found**: Verify your `PUBLIC_SUPABASE_URL` is correct
- **Error: PostGIS not found**: Enable PostGIS extension in Supabase Dashboard

### Setup Script Issues
- **Manual fallback**: If automated setup fails, the script will show you SQL to copy/paste
- **Permission errors**: Ensure you're using the service role key (not anon key)

### Testing Issues
- **No sample data**: Re-run `npm run db:setup` to reload sample data
- **Geospatial errors**: Verify PostGIS is enabled and working

## 📚 Next Steps

Now that your database is set up, explore these tutorials:
- [Schema Migration Guide](02-schema-migrations.md) - How to modify your database schema
- [PostGIS and Geospatial Queries](03-postgis-geospatial.md) - Working with location data
- [Supabase Integration](04-supabase-integration.md) - Advanced Supabase features
- [Database Testing](05-testing-debugging.md) - Testing and debugging strategies

## 🎯 Key Takeaways

- Supabase provides a fully managed PostgreSQL database with PostGIS
- Environment variables keep your credentials secure
- Automated scripts handle complex setup tasks
- PostGIS enables powerful location-based features
- Row Level Security protects your data
- The database schema is designed for performance and scalability

Happy coding! 🚀