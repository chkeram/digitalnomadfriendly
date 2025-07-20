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
   PUBLIC_SUPABASE_URL=your_supabase_project_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

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
src/
├── lib/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Basic UI components
│   │   ├── map/            # Map-related components  
│   │   └── venue/          # Venue-specific components
│   ├── stores/             # Svelte stores for state
│   ├── services/           # API services
│   ├── types/              # TypeScript definitions
│   └── utils/              # Utility functions
├── routes/                 # SvelteKit routes
├── test/                   # Test utilities
└── app.css                # Global styles
```

## 🎯 Development Phases

### Phase 1: MVP (Current)
- [x] Project setup with SvelteKit + TypeScript
- [x] Tailwind CSS integration
- [x] Project structure and tooling
- [ ] Database schema and Supabase integration
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

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [SvelteKit](https://kit.svelte.dev/) for the amazing framework
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Google Maps](https://developers.google.com/maps) for mapping services

---

Built with ❤️ for the digital nomad community
