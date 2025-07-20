# Project Structure Explained - Understanding Our Codebase

Now let's take a detailed tour of our Digital Nomad Friendly project structure. This guide will help you understand what each file and folder does, so you know where to make changes and add new features.

## 🗂 The Big Picture - Root Level Files

When you open the project in VS Code, here's what you see at the top level:

```
digitalnomadfriendly/
├── 📁 src/                     ← Main application code
├── 📁 static/                  ← Images, icons, etc.
├── 📁 tutorial-instructions/   ← These helpful guides!
├── 📄 package.json            ← Project dependencies & scripts
├── 📄 README.md               ← Project overview
├── 📄 CLAUDE.md               ← Developer documentation
├── 📄 .env.example            ← Environment variables template
├── 📄 tailwind.config.js      ← Styling configuration
├── 📄 tsconfig.json           ← TypeScript configuration
└── ... (more config files)
```

### 🔍 Root Files Explained:

**`package.json`** - The project's "recipe book"
- Lists all dependencies (ingredients) our project needs
- Defines scripts we can run (`npm run dev`, etc.)
- Contains project metadata

**`README.md`** - Project overview and setup instructions
- First thing people see on GitHub
- Contains installation and usage instructions

**`CLAUDE.md`** - Developer documentation
- Detailed technical information for development
- Architecture decisions and patterns we follow

**`.env.example`** - Template for environment variables
- Shows what secrets/keys the project needs
- You copy this to `.env` and fill in real values

## 📁 The `src/` Folder - Where the Magic Happens

This is where all our application code lives:

```
src/
├── 📁 lib/                    ← Reusable code
│   ├── 📁 components/         ← UI building blocks
│   ├── 📁 stores/             ← App-wide data
│   ├── 📁 services/           ← API calls & external services
│   ├── 📁 types/              ← TypeScript definitions
│   └── 📁 utils/              ← Helper functions
├── 📁 routes/                 ← Pages users can visit
├── 📁 test/                   ← Testing utilities
├── 📄 app.html                ← HTML template
├── 📄 app.css                 ← Global styles
└── 📄 app.d.ts                ← Global TypeScript types
```

Let's explore each section in detail:

## 🧩 `src/lib/` - The Toolbox

Think of `lib` as your toolbox - all the reusable parts of your application.

### 📁 `lib/components/` - UI Building Blocks

Components are like LEGO blocks for your website:

```
lib/components/
├── 📁 ui/                    ← Basic building blocks
│   ├── Button.svelte         ← Reusable buttons
│   ├── Card.svelte           ← Content containers
│   └── Input.svelte          ← Form inputs
├── 📁 map/                   ← Map-related components
│   ├── MapContainer.svelte   ← Main map display
│   ├── VenueMarker.svelte    ← Pins on the map
│   └── SearchBox.svelte      ← Location search
└── 📁 venue/                 ← Cafe/venue components
    ├── VenueCard.svelte      ← Cafe preview cards
    ├── VenueDetails.svelte   ← Full cafe information
    └── ReviewForm.svelte     ← Submit reviews
```

**Example - Button Component:**
```svelte
<!-- lib/components/ui/Button.svelte -->
<script lang="ts">
  export let variant: 'primary' | 'secondary' = 'primary';
  export let disabled = false;
</script>

<button 
  class="btn-{variant}" 
  {disabled} 
  on:click
>
  <slot />
</button>
```

**How you'd use it:**
```svelte
<Button variant="primary" on:click={handleClick}>
  Find Cafes Near Me
</Button>
```

### 📁 `lib/stores/` - App-Wide Data

Stores hold data that multiple parts of your app need:

```typescript
// lib/stores/index.ts
export const user = writable<User | null>(null);          // Current logged-in user
export const userLocation = writable<LocationCoords>();    // User's GPS location
export const venues = writable<Venue[]>([]);              // List of cafes
export const selectedVenue = writable<Venue | null>();    // Currently viewed cafe
export const searchFilters = writable<SearchFilters>();   // Search preferences
```

**Real example:**
```typescript
// When user logs in
user.set({ 
  id: "123", 
  name: "John Doe", 
  email: "john@example.com" 
});

// When GPS finds location
userLocation.set({ 
  lat: 37.7749, 
  lng: -122.4194 
});
```

### 📁 `lib/services/` - External Connections

Services handle talking to outside systems:

```
lib/services/
├── supabase.ts              ← Database operations
├── googleMaps.ts            ← Google Maps API
├── auth.ts                  ← User authentication
└── venues.ts                ← Cafe data operations
```

**Example service:**
```typescript
// lib/services/venues.ts
export async function getNearbyVenues(lat: number, lng: number) {
  // Talk to database to get cafes near this location
  const response = await supabase
    .from('venues')
    .select('*')
    .near('location', lat, lng);
  
  return response.data;
}
```

### 📁 `lib/types/` - TypeScript Definitions

Types define the "shape" of our data:

```typescript
// lib/types/index.ts
export interface Venue {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  wifi_quality: number;
  noise_level: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  preferences?: UserPreferences;
}
```

**Why this matters:**
- TypeScript checks that you use data correctly
- VS Code gives you autocomplete and error checking
- Prevents bugs like typos in property names

### 📁 `lib/utils/` - Helper Functions

Utility functions do common tasks:

```typescript
// lib/utils/index.ts
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  // Math to find distance between two GPS points
}

export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)}m`;
  return `${distanceKm.toFixed(1)}km`;
}

export function getStarRating(rating: number): string {
  return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
}
```

## 🛣 `src/routes/` - The Pages

Routes define what users see when they visit different URLs:

```
routes/
├── +page.svelte             ← Homepage (digitalnomadfriendly.com/)
├── +layout.svelte           ← Common layout (header, footer)
├── about/
│   └── +page.svelte         ← About page (/about)
├── cafes/
│   ├── +page.svelte         ← Cafe listing (/cafes)
│   └── [id]/
│       └── +page.svelte     ← Individual cafe (/cafes/123)
└── search/
    └── +page.svelte         ← Search results (/search)
```

### Special Files in Routes:

**`+page.svelte`** - A page users can visit
```svelte
<!-- routes/+page.svelte = Homepage -->
<h1>Welcome to Digital Nomad Friendly</h1>
<p>Find the perfect workspace...</p>
```

**`+layout.svelte`** - Wraps around all pages
```svelte
<!-- routes/+layout.svelte -->
<header>
  <nav><!-- Navigation menu --></nav>
</header>

<main>
  <slot /> <!-- This is where the page content goes -->
</main>

<footer>
  <!-- Footer content -->
</footer>
```

**`+page.ts`** - Loads data before page shows
```typescript
// routes/cafes/+page.ts
export async function load() {
  const venues = await getNearbyVenues();
  return {
    venues
  };
}
```

## 🧪 `src/test/` - Testing Setup

```
test/
├── setup.ts                 ← Test configuration
└── (test files alongside code)
```

Tests ensure our code works correctly:
```typescript
// lib/utils/index.test.ts
import { calculateDistance } from './index.js';

test('calculates distance correctly', () => {
  const distance = calculateDistance(0, 0, 1, 1);
  expect(distance).toBeCloseTo(157, 0); // About 157km
});
```

## 📄 Key Root Files

### `src/app.html` - The HTML Shell
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <link rel="icon" href="%sveltekit.assets%/favicon.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  %sveltekit.head%
</head>
<body data-sveltekit-preload-data="hover">
  <div style="display: contents">%sveltekit.body%</div>
</body>
</html>
```

### `src/app.css` - Global Styles
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Global styles for digital nomad cafe finder */
@layer base {
  html {
    font-family: 'Inter', system-ui, sans-serif;
  }
}
```

### `src/app.d.ts` - Global TypeScript Types
```typescript
declare global {
  namespace App {
    interface Locals {
      user?: User;
    }
  }
}
```

## 🎯 How Everything Connects

### A User Journey Through Our Code:

1. **User visits homepage** (`routes/+page.svelte`)
2. **Layout loads** (`routes/+layout.svelte`) with navigation
3. **Global styles apply** (`app.css` with Tailwind)
4. **User clicks "Find Cafes"**
5. **JavaScript gets location** (using `lib/utils/getCurrentLocation`)
6. **API call made** (using `lib/services/venues.ts`)
7. **Data stored** (in `lib/stores/venues`)
8. **Map component shows cafes** (`lib/components/map/MapContainer.svelte`)
9. **Venue cards display** (`lib/components/venue/VenueCard.svelte`)

### Data Flow Example:

```
User clicks "Search" 
→ Component calls service function
→ Service talks to database
→ Data comes back to component
→ Component updates store
→ Other components react to store change
→ UI updates automatically
```

## 🛠 Configuration Files Explained

### `package.json` - Project Dependencies
```json
{
  "scripts": {
    "dev": "vite dev",           // Start development server
    "build": "vite build",       // Build for production
    "test": "vitest"             // Run tests
  },
  "devDependencies": {
    "svelte": "^5.0.0",          // The Svelte framework
    "tailwindcss": "^3.4.0",     // CSS framework
    "typescript": "^5.0.0"       // Type checking
  }
}
```

### `tailwind.config.js` - Styling Setup
```javascript
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],  // Where to look for classes
  theme: {
    extend: {
      colors: {
        primary: { ... },     // Our custom colors
      }
    }
  }
}
```

### `tsconfig.json` - TypeScript Settings
```json
{
  "compilerOptions": {
    "strict": true,           // Strict type checking
    "moduleResolution": "bundler"
  }
}
```

## 📝 File Naming Conventions

### SvelteKit Special Files:
- `+page.svelte` = Pages users can visit
- `+layout.svelte` = Layout that wraps pages
- `+page.ts` = Load data for a page
- `+error.svelte` = Error page

### Our Project Conventions:
- **PascalCase** for components: `VenueCard.svelte`
- **camelCase** for functions: `calculateDistance()`
- **kebab-case** for files: `venue-card.test.ts`
- **UPPERCASE** for constants: `API_BASE_URL`

## 🎯 Where to Make Changes

### To change the homepage:
→ `src/routes/+page.svelte`

### To add a new page:
→ Create `src/routes/newpage/+page.svelte`

### To create a reusable component:
→ Add to `src/lib/components/ui/`

### To add app-wide data:
→ Add to `src/lib/stores/`

### To add a utility function:
→ Add to `src/lib/utils/`

### To define new data types:
→ Add to `src/lib/types/`

### To change global styles:
→ Edit `src/app.css`

## 💡 Key Takeaways

1. **`src/lib/`** = Reusable code (components, stores, utils)
2. **`src/routes/`** = Pages users can visit
3. **File names matter** = SvelteKit uses conventions
4. **Everything is organized** = Similar things go together
5. **TypeScript helps** = Types prevent bugs
6. **Components are modular** = Build once, use everywhere

## 🚀 Next Steps

Now that you understand the structure:

1. **Explore the files** - Open them in VS Code and look around
2. **Read the next tutorial** - `04-making-your-first-changes.md`
3. **Try finding things** - Can you locate the homepage? The button styles?
4. **Make mental notes** - Remember where different types of code live

Remember: **It's normal to feel overwhelmed at first!** Focus on one section at a time, and the patterns will become familiar as you work with the code.

Ready to start making changes? Continue to the next tutorial!