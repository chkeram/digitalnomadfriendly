# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Digital Nomad Friendly is a SvelteKit web application that helps digital nomads, remote workers, and location-independent professionals discover work-friendly cafes and co-working spaces through crowdsourced reviews and ratings.

## Development Commands

### Core Commands
- `npm run dev` - Start development server (http://localhost:5173)
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Run TypeScript type checking
- `npm run check:watch` - Run type checking in watch mode

### Code Quality
- `npm run lint` - Run ESLint and Prettier checks
- `npm run format` - Format code with Prettier

### Testing
- `npm run test` - Run unit tests with Vitest
- `npm run test:ui` - Run tests with Vitest UI

## Architecture Overview

### Tech Stack
- **Frontend**: SvelteKit 2.x with TypeScript
- **Styling**: Tailwind CSS with custom components
- **State Management**: Svelte stores for global state
- **Database**: PostgreSQL with PostGIS (via Supabase)
- **Authentication**: Supabase Auth with Google OAuth
- **Maps**: Google Maps JavaScript API with cost optimization
- **Testing**: Vitest + Testing Library
- **Code Quality**: ESLint + Prettier

### Project Structure
```
src/
├── lib/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Basic UI components (buttons, cards, etc.)
│   │   ├── map/            # Map-related components (MapContainer, markers)
│   │   └── venue/          # Venue-specific components (VenueCard, reviews)
│   ├── stores/             # Svelte stores for global state management
│   ├── services/           # API services and external integrations
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions and helpers
├── routes/                 # SvelteKit file-based routing
├── test/                   # Test setup and utilities
├── app.html               # HTML template
├── app.css               # Global styles with Tailwind
└── app.d.ts              # Global type definitions
```

### Key Patterns

#### Component Organization
- **UI Components**: Reusable, generic components in `src/lib/components/ui/`
- **Feature Components**: Domain-specific components grouped by feature
- **Page Components**: Route-specific components in `src/routes/`

#### State Management
- Global state managed through Svelte stores in `src/lib/stores/`
- User authentication state, location data, and venue information
- Reactive updates across components using store subscriptions

#### Type Safety
- Comprehensive TypeScript types in `src/lib/types/`
- Strict type checking enabled
- Environment variables typed in `src/app.d.ts`

#### API Integration Strategy
- **Supabase**: Backend-as-a-Service for database and authentication
- **Google Maps API**: Cost-optimized usage with caching strategies
- **Service Layer**: API abstractions in `src/lib/services/`

## Development Workflow

### Environment Setup
1. Copy `.env.example` to `.env` and configure:
   - `PUBLIC_SUPABASE_URL` - Supabase project URL
   - `PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
   - `PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key

2. Install dependencies: `npm install`
3. Start development server: `npm run dev`

### Code Style Guidelines
- Use TypeScript strict mode
- Follow Prettier formatting rules
- ESLint configuration enforces best practices
- Component names use PascalCase
- Utility functions use camelCase
- File names use kebab-case

### Testing Strategy
- Unit tests for utility functions and core logic
- Component testing with Testing Library
- Mock external APIs (Google Maps, Supabase) in tests
- Test files co-located with source files using `.test.ts` suffix

### Git Workflow
- Feature branches: `feature/{issue-number}-{description}`
- Main branch for production-ready code
- All commits should pass linting and tests

## Phase 1 Implementation Status

### Completed ✅
- [x] SvelteKit project setup with TypeScript
- [x] Tailwind CSS integration with custom theme
- [x] ESLint and Prettier configuration
- [x] Project structure and folder organization
- [x] TypeScript type definitions for core entities
- [x] Svelte stores for state management
- [x] Utility functions for calculations
- [x] Testing framework setup with Vitest
- [x] Environment variable configuration

### Next Steps 🚀
1. **Database Schema** (Issue #2): Design and implement PostgreSQL schema
2. **Supabase Integration** (Issue #3): Set up authentication and database connection
3. **Google Maps Integration** (Issue #4): Implement map components with cost optimization
4. **UI Components** (Issue #5): Build venue cards, search interface, and map components
5. **Core Features** (Issue #6): Venue discovery and basic review system

## Important Notes

### Google Maps API Cost Optimization
- Implement field masking for API requests
- Use intelligent caching (24h for venue details, 1h for search results)
- Implement session tokens for autocomplete
- Set up quota monitoring and alerts
- Use static map thumbnails where appropriate

### Database Considerations
- PostGIS extension for efficient geospatial queries
- Proper indexing on location columns for performance
- Row Level Security (RLS) policies for data protection
- Optimize queries to minimize database load

### Performance Requirements
- Page load times < 2 seconds on 3G
- Map rendering < 1 second for venue markers
- Mobile-first responsive design
- Progressive Web App (PWA) capabilities

### Security Best Practices
- Never commit API keys or secrets
- Use environment variables for configuration
- Implement proper CORS policies
- Validate all user inputs
- Use RLS for database access control