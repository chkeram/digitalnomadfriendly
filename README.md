# Digital Nomad Friendly

A modern, minimal web application that helps digital nomads, remote workers, and location-independent professionals discover work-friendly cafes and co-working spaces through crowdsourced reviews and ratings.

## ✨ Features

- 📍 **Location-Based Discovery**: Find work-friendly venues within minutes using GPS or search
- ⭐ **Community Reviews**: Detailed reviews covering WiFi quality, noise levels, and work environment
- 🚀 **Minimal & Fast**: Clean interface designed for efficiency with maximum 3-click navigation
- 📱 **Mobile-First**: Responsive design optimized for mobile devices
- 🔐 **Google OAuth**: Secure authentication with Google accounts
- 💾 **Offline Support**: PWA capabilities with offline venue caching

## 🛠 Tech Stack

- **Frontend**: SvelteKit 2.x with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Database**: PostgreSQL with PostGIS (via Supabase)
- **Authentication**: Supabase Auth with Google OAuth
- **Maps**: Google Maps JavaScript API
- **Testing**: Vitest + Testing Library
- **Deployment**: Vercel (planned)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Google Maps API key
- Supabase project (for database and auth)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/chkeram/digitalnomadfriendly.git
   cd digitalnomadfriendly
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables:
   ```env
   # Supabase Configuration
   PUBLIC_SUPABASE_URL=your_supabase_project_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Google Maps API
   PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   
   # Optional: For development and testing
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   DATABASE_URL=your_database_connection_string
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## 🗄️ Database Setup

### Prerequisites
- Supabase project (free tier available)
- PostgreSQL with PostGIS extension (provided by Supabase)

### Setting up Supabase

1. **Create a Supabase project**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Note your project URL and anon key

2. **Run the database migration**
   - In your Supabase dashboard, go to SQL Editor
   - Copy and paste the contents of `database/migrations/001_initial_schema.sql`
   - Run the migration to create all tables, indexes, and functions

3. **Load sample data (optional)**
   - Copy and paste the contents of `database/seed/sample_data.sql`
   - Run to populate tables with sample venues and reviews

4. **Test the schema (optional)**
   - Copy and paste the contents of `database/test_schema.sql`
   - Run to verify everything is working correctly

### Database Features

- **🌍 Geospatial Support**: PostGIS extension for location-based queries
- **🔒 Row Level Security**: Comprehensive security policies for data protection
- **⚡ Performance Optimized**: Strategic indexes for fast queries
- **🔗 Relational Integrity**: Foreign keys and constraints for data consistency
- **📊 Automatic Aggregation**: Triggers for real-time rating calculations
- **🗃️ Soft Deletes**: Data retention with `deleted_at` timestamps

### Key Database Tables

| Table | Description |
|-------|-------------|
| `users` | User profiles and preferences |
| `venues` | Cafe/venue information with geospatial data |
| `venue_amenities` | Detailed amenity information (WiFi, noise, etc.) |
| `reviews` | User reviews with multiple rating categories |
| `venue_photos` | Photos and images for venues |
| `favorites` | User bookmarks and venue lists |
| `venue_visits` | Visit tracking for analytics |

### Custom Database Functions

```sql
-- Find venues within radius
SELECT * FROM find_venues_within_radius(37.7749, -122.4194, 5.0);

-- Get personalized recommendations
SELECT * FROM get_venue_recommendations('user-uuid', 37.7749, -122.4194, 10.0);
```

For complete database documentation, see [`database/README.md`](database/README.md).

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run unit tests |
| `npm run test:ui` | Run tests with UI |
| `npm run lint` | Run ESLint and Prettier checks |
| `npm run format` | Format code with Prettier |
| `npm run check` | TypeScript type checking |

## 🏗 Project Structure

```
digitalnomadfriendly/
├── database/               # Database schema and related files
│   ├── migrations/        # SQL migration files
│   │   └── 001_initial_schema.sql
│   ├── functions/         # Custom database functions (future)
│   ├── seed/             # Sample data for development
│   │   └── sample_data.sql
│   ├── test_schema.sql   # Database testing script
│   └── README.md         # Database documentation
├── src/
│   ├── lib/
│   │   ├── components/   # Reusable UI components
│   │   │   ├── ui/      # Basic UI components
│   │   │   ├── map/     # Map-related components  
│   │   │   └── venue/   # Venue-specific components
│   │   ├── stores/      # Svelte stores for state
│   │   ├── services/    # API services
│   │   ├── types/       # TypeScript definitions
│   │   │   ├── index.ts        # General types
│   │   │   └── database.ts     # Database schema types
│   │   └── utils/       # Utility functions
│   ├── routes/          # SvelteKit routes
│   ├── test/            # Test utilities
│   └── app.css         # Global styles
├── tutorial-instructions/ # Frontend learning resources
├── .env.example          # Environment variables template
├── CLAUDE.md            # AI assistant instructions
└── PRD.md              # Product requirements document
```

## 🎯 Development Phases

### Phase 1: MVP (Current)
- [x] Project setup with SvelteKit + TypeScript
- [x] Tailwind CSS integration
- [x] Project structure and tooling
- [x] Database schema and Supabase integration
- [ ] Google Maps integration with cost optimization
- [ ] Basic venue discovery and reviews
- [ ] User authentication

### Phase 2: Enhancement
- [ ] Advanced filtering and search
- [ ] Detailed review system with photos
- [ ] Favorites and user profiles
- [ ] Real-time occupancy tracking

### Phase 3: Community
- [ ] Social features and user following
- [ ] Venue submission and moderation
- [ ] Local events and meetups
- [ ] Analytics dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Use Prettier for code formatting
- Write tests for new functionality
- Follow the existing component structure
- Use semantic commit messages

### Database Development Workflow

1. **Schema Changes**: Update `database/migrations/001_initial_schema.sql`
2. **Type Updates**: Sync TypeScript types in `src/lib/types/database.ts`
3. **Sample Data**: Add test data to `database/seed/sample_data.sql`
4. **Testing**: Run `database/test_schema.sql` to verify changes
5. **Documentation**: Update `database/README.md` with new features

### Useful Database Commands

```sql
-- Test venue search
SELECT * FROM find_venues_within_radius(37.7749, -122.4194, 5.0);

-- Check user recommendations
SELECT * FROM get_venue_recommendations('user-uuid', 37.7749, -122.4194);

-- Verify data integrity
SELECT table_name, column_name FROM information_schema.columns 
WHERE table_schema = 'public' ORDER BY table_name;
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [SvelteKit](https://kit.svelte.dev/) for the amazing framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Google Maps](https://developers.google.com/maps) for mapping services

---

Built with ❤️ for the digital nomad community
