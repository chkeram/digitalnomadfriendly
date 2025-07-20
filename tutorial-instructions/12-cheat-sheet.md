# Quick Reference Cheat Sheet

A handy reference for common commands, patterns, and code snippets while developing our Digital Nomad Friendly app.

## 🚀 Essential Commands

### Development Commands
```bash
# Start development server
npm run dev

# Stop development server
Ctrl + C

# Type checking
npm run check

# Run tests
npm run test

# Code formatting
npm run format

# Linting
npm run lint

# Production build
npm run build

# Preview production build
npm run preview
```

### Git Commands
```bash
# Check status
git status

# Create and switch to new branch
git checkout -b feature/branch-name

# Stage all changes
git add .

# Commit changes
git commit -m "feat: add new feature"

# Push to remote
git push origin branch-name

# Switch branches
git checkout main

# Pull latest changes
git pull origin main

# See recent commits
git log --oneline -10
```

## 📁 File Structure Quick Reference

```
src/
├── lib/
│   ├── components/
│   │   ├── ui/           ← Basic components (Button, Card, etc.)
│   │   ├── map/          ← Map components
│   │   └── venue/        ← Venue-specific components
│   ├── stores/           ← Global state (user, venues, etc.)
│   ├── services/         ← API calls (supabase, google maps)
│   ├── types/            ← TypeScript definitions
│   └── utils/            ← Helper functions
├── routes/               ← Pages (file-based routing)
├── test/                 ← Test utilities
├── app.css              ← Global styles
├── app.d.ts             ← Global types
└── app.html             ← HTML template
```

## 🧩 Common Component Patterns

### Basic Component Structure
```svelte
<script lang="ts">
  import type { ComponentType } from '$lib/types';
  
  export let prop: string;
  export let optional: boolean = false;
  
  let internalState = '';
  
  function handleClick() {
    // Handle events
  }
  
  // Reactive statements
  $: computed = prop.toUpperCase();
</script>

<div class="component-class">
  <h2>{computed}</h2>
  <button on:click={handleClick}>
    <slot />
  </button>
</div>

<style>
  .component-class {
    /* Component-scoped styles */
  }
</style>
```

### Component with Events
```svelte
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher<{
    save: { id: string; data: any };
    cancel: void;
  }>();
  
  function handleSave() {
    dispatch('save', { id: '123', data: {} });
  }
</script>

<button on:click={handleSave}>Save</button>
```

### Using Stores
```svelte
<script lang="ts">
  import { writable } from 'svelte/store';
  import { user, venues } from '$lib/stores';
  
  // Read store value
  $: currentUser = $user;
  
  // Update store
  function updateUser() {
    user.set({ id: '123', name: 'John' });
  }
  
  // Subscribe to store changes
  user.subscribe(value => {
    console.log('User changed:', value);
  });
</script>
```

## 🎨 Tailwind CSS Quick Reference

### Layout Classes
```html
<!-- Flexbox -->
<div class="flex items-center justify-center">
<div class="flex flex-col gap-4">
<div class="flex justify-between items-center">

<!-- Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
<div class="grid grid-cols-12 gap-4">

<!-- Positioning -->
<div class="relative">
<div class="absolute top-4 right-4">
<div class="sticky top-0">
```

### Spacing Classes
```html
<!-- Padding -->
<div class="p-4">        <!-- All sides -->
<div class="px-4 py-2">  <!-- Horizontal/Vertical -->
<div class="pt-4">       <!-- Top only -->

<!-- Margin -->
<div class="m-4">        <!-- All sides -->
<div class="mx-auto">    <!-- Center horizontally -->
<div class="mb-6">       <!-- Bottom only -->

<!-- Gap (for flex/grid children) -->
<div class="gap-4">      <!-- All gaps -->
<div class="gap-x-4">    <!-- Horizontal gap -->
```

### Color Classes
```html
<!-- Backgrounds -->
<div class="bg-white">
<div class="bg-gray-50">
<div class="bg-blue-600">
<div class="bg-primary-600">

<!-- Text -->
<p class="text-gray-900">
<p class="text-blue-600">
<p class="text-primary-700">

<!-- Borders -->
<div class="border border-gray-300">
<div class="border-2 border-blue-500">
```

### Typography Classes
```html
<!-- Sizes -->
<h1 class="text-4xl">     <!-- 36px -->
<h2 class="text-2xl">     <!-- 24px -->
<p class="text-base">     <!-- 16px -->
<small class="text-sm">   <!-- 14px -->

<!-- Weights -->
<p class="font-normal">   <!-- 400 -->
<p class="font-medium">   <!-- 500 -->
<p class="font-semibold"> <!-- 600 -->
<p class="font-bold">     <!-- 700 -->
```

### Responsive Classes
```html
<!-- Mobile first approach -->
<div class="text-sm md:text-base lg:text-lg">
<div class="flex-col md:flex-row">
<div class="p-4 md:p-8 lg:p-12">

<!-- Show/hide on different screens -->
<div class="block md:hidden">      <!-- Mobile only -->
<div class="hidden md:block">      <!-- Tablet+ only -->
```

## 🔧 TypeScript Quick Reference

### Basic Types
```typescript
// Primitives
let name: string = 'John';
let age: number = 30;
let isActive: boolean = true;

// Arrays
let numbers: number[] = [1, 2, 3];
let venues: Venue[] = [];

// Objects
let user: { name: string; age: number } = {
  name: 'John',
  age: 30
};

// Optional properties
let config: { api?: string; timeout?: number } = {};

// Union types
let status: 'loading' | 'success' | 'error' = 'loading';
```

### Interfaces
```typescript
interface User {
  id: string;
  name: string;
  email: string;
  preferences?: UserPreferences;
}

interface Venue {
  id: string;
  name: string;
  lat: number;
  lng: number;
  rating: number;
}

// Extending interfaces
interface ExtendedVenue extends Venue {
  distance?: number;
  isFavorite?: boolean;
}
```

### Function Types
```typescript
// Function parameters and return types
function calculateDistance(lat1: number, lng1: number): number {
  // Implementation
  return 0;
}

// Arrow functions
const formatDistance = (km: number): string => {
  return `${km}km`;
};

// Function as parameter
function processVenues(venues: Venue[], filter: (venue: Venue) => boolean): Venue[] {
  return venues.filter(filter);
}

// Event handlers
function handleClick(event: MouseEvent): void {
  // Handle click
}

function handleCustomEvent(event: CustomEvent<{venueId: string}>): void {
  console.log(event.detail.venueId);
}
```

## 📊 Store Patterns

### Basic Store
```typescript
import { writable } from 'svelte/store';

export const count = writable(0);
export const user = writable<User | null>(null);
export const venues = writable<Venue[]>([]);
```

### Derived Store
```typescript
import { derived } from 'svelte/store';

export const isLoggedIn = derived(user, $user => $user !== null);
export const venueCount = derived(venues, $venues => $venues.length);
```

### Custom Store
```typescript
function createCounter() {
  const { subscribe, set, update } = writable(0);

  return {
    subscribe,
    increment: () => update(n => n + 1),
    decrement: () => update(n => n - 1),
    reset: () => set(0)
  };
}

export const counter = createCounter();
```

## 🔄 Common Reactive Patterns

### Reactive Statements
```svelte
<script>
  let firstName = '';
  let lastName = '';
  
  // Reactive computation
  $: fullName = `${firstName} ${lastName}`;
  
  // Reactive statement
  $: if (fullName.length > 10) {
    console.log('Long name!');
  }
  
  // Reactive block
  $: {
    console.log('Name changed:', fullName);
    document.title = fullName;
  }
</script>
```

### Store Subscriptions
```svelte
<script>
  import { user, venues } from '$lib/stores';
  
  // Auto-subscribe (reactive)
  $: currentUser = $user;
  $: venueList = $venues;
  
  // Manual subscription
  let unsubscribe = user.subscribe(value => {
    console.log('User changed:', value);
  });
  
  // Cleanup on destroy
  import { onDestroy } from 'svelte';
  onDestroy(unsubscribe);
</script>
```

## 🎭 Template Syntax

### Conditionals
```svelte
<!-- If statement -->
{#if user}
  <p>Welcome, {user.name}!</p>
{:else}
  <p>Please log in</p>
{/if}

<!-- Multiple conditions -->
{#if loading}
  <p>Loading...</p>
{:else if error}
  <p>Error: {error}</p>
{:else if venues.length === 0}
  <p>No venues found</p>
{:else}
  <!-- Show venues -->
{/if}
```

### Loops
```svelte
<!-- Basic loop -->
{#each venues as venue}
  <VenueCard {venue} />
{/each}

<!-- Loop with index -->
{#each venues as venue, index}
  <div>{index + 1}. {venue.name}</div>
{/each}

<!-- Loop with key (for performance) -->
{#each venues as venue (venue.id)}
  <VenueCard {venue} />
{/each}

<!-- Empty state -->
{#each venues as venue}
  <VenueCard {venue} />
{:else}
  <p>No venues found</p>
{/each}
```

### Event Handling
```svelte
<!-- Basic event -->
<button on:click={handleClick}>Click me</button>

<!-- Event with parameter -->
<button on:click={() => handleClick(venue.id)}>Select</button>

<!-- Event modifiers -->
<form on:submit|preventDefault={handleSubmit}>
<input on:keydown|enter={handleEnter}>
<div on:click|stopPropagation={handleClick}>

<!-- Custom events -->
<VenueCard on:select={handleVenueSelect} />
```

### Binding
```svelte
<!-- Input binding -->
<input bind:value={name} />
<textarea bind:value={description}></textarea>
<input type="checkbox" bind:checked={isActive} />

<!-- Select binding -->
<select bind:value={selected}>
  <option value="a">A</option>
  <option value="b">B</option>
</select>

<!-- Component binding -->
<VenueCard bind:isSelected />
```

## 📝 Testing Patterns

### Component Testing
```typescript
import { render, fireEvent } from '@testing-library/svelte';
import Button from './Button.svelte';

test('renders button with text', () => {
  const { getByText } = render(Button, { 
    props: { variant: 'primary' }
  });
  
  expect(getByText('Click me')).toBeInTheDocument();
});

test('calls click handler', async () => {
  const mockClick = vi.fn();
  const { component } = render(Button);
  
  component.$on('click', mockClick);
  
  await fireEvent.click(getByRole('button'));
  expect(mockClick).toHaveBeenCalled();
});
```

### Store Testing
```typescript
import { get } from 'svelte/store';
import { user } from '$lib/stores';

test('user store updates correctly', () => {
  const testUser = { id: '1', name: 'John' };
  
  user.set(testUser);
  expect(get(user)).toEqual(testUser);
});
```

## 🔍 Debugging Snippets

### Console Logging
```svelte
<script>
  let data = {};
  
  // Debug reactive statements
  $: console.log('Data changed:', data);
  
  // Debug function calls
  function handleClick() {
    console.log('Button clicked');
    console.log('Current data:', data);
  }
</script>

<!-- Debug in template -->
{#if import.meta.env.DEV}
  <pre>{JSON.stringify(data, null, 2)}</pre>
{/if}
```

### Error Boundaries
```svelte
<!-- ErrorBoundary.svelte -->
<script>
  export let error = null;
</script>

{#if error}
  <div class="error-boundary">
    <h2>Something went wrong</h2>
    <p>{error.message}</p>
  </div>
{:else}
  <slot />
{/if}
```

## 🌐 Environment Variables

### Accessing Environment Variables
```typescript
// In any .ts or .svelte file
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const mapsApiKey = import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY;

// Check if in development
const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;
```

### Environment File (.env)
```bash
# Public variables (accessible in browser)
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-key

# Private variables (server-side only)
SECRET_SUPABASE_SERVICE_KEY=your-service-key

# Development mode
NODE_ENV=development
```

## 📚 VS Code Shortcuts

### Essential Shortcuts
```
Cmd/Ctrl + P         - Quick file open
Cmd/Ctrl + Shift + P - Command palette
Cmd/Ctrl + D         - Select next occurrence
Cmd/Ctrl + Shift + F - Search across files
Cmd/Ctrl + /         - Toggle comment
Cmd/Ctrl + Shift + L - Select all occurrences
F12                  - Go to definition
Shift + F12          - Find all references
Cmd/Ctrl + .         - Quick fix
```

### Multi-cursor Editing
```
Alt + Click          - Add cursor at click position
Cmd/Ctrl + Alt + ↓   - Add cursor below
Cmd/Ctrl + Alt + ↑   - Add cursor above
Cmd/Ctrl + Shift + L - Add cursor to all selections
```

## 📋 Common File Templates

### Component Template
```svelte
<!-- ComponentName.svelte -->
<script lang="ts">
  export let prop: string;
  export let optional: boolean = false;
  
  // Component logic here
</script>

<div class="component-wrapper">
  <slot />
</div>

<style>
  .component-wrapper {
    /* Component styles */
  }
</style>
```

### Store Template
```typescript
// storeName.ts
import { writable } from 'svelte/store';
import type { StoreType } from '$lib/types';

export const storeName = writable<StoreType[]>([]);

export function addItem(item: StoreType) {
  storeName.update(items => [...items, item]);
}

export function removeItem(id: string) {
  storeName.update(items => items.filter(item => item.id !== id));
}
```

### Service Template
```typescript
// serviceName.ts
import type { DataType } from '$lib/types';

export async function fetchData(): Promise<DataType[]> {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw error;
  }
}

export async function saveData(data: DataType): Promise<void> {
  // Implementation
}
```

## 🎯 Quick Fixes

### Common Error Fixes
```typescript
// Fix: Cannot find module
// Check import path and file existence

// Fix: Property does not exist
// Add property to type definition or make it optional

// Fix: Argument of type X is not assignable to type Y
// Check types match or add type assertion

// Fix: Object is possibly null
// Add null check or use optional chaining
venue?.name || 'Unknown'
```

### Performance Optimizations
```svelte
<!-- Use key in loops for better performance -->
{#each items as item (item.id)}

<!-- Lazy load images -->
<img loading="lazy" src={item.image} alt={item.name} />

<!-- Avoid expensive computations in templates -->
<script>
  $: expensiveResult = expensiveFunction(data);
</script>
<p>{expensiveResult}</p>
```

---

This cheat sheet covers the most common patterns and commands you'll use while developing. Keep it handy for quick reference!