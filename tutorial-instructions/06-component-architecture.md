# Component Architecture - Building Reusable UI Pieces

Components are the building blocks of modern web applications. This guide will teach you how to think in components and build reusable UI pieces for our Digital Nomad Friendly app.

## 🧩 What Are Components?

Think of components like LEGO blocks:
- **Reusable** - Build once, use everywhere
- **Modular** - Each piece has a specific purpose  
- **Composable** - Combine small pieces to build complex UIs
- **Maintainable** - Change one piece, update everywhere it's used

### Real-World Example
Instead of writing this HTML everywhere you need a button:
```html
<button class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200">
  Submit
</button>
```

You create a Button component and use it like:
```svelte
<Button variant="primary">Submit</Button>
```

## 🏗 Component Hierarchy in Our App

Our components are organized in a hierarchy:

```
App
├── Layout
│   ├── Header
│   │   ├── Logo
│   │   ├── Navigation
│   │   └── UserMenu
│   └── Footer
└── Pages
    ├── Homepage
    │   ├── Hero Section
    │   ├── SearchBar
    │   └── FeatureCards
    └── VenuePage
        ├── VenueHeader
        ├── VenueDetails
        ├── ReviewsList
        │   └── ReviewCard
        └── MapContainer
            └── VenueMarker
```

## 📁 Our Component Organization

Components are organized by purpose and complexity:

```
src/lib/components/
├── ui/                     ← Basic building blocks
│   ├── Button.svelte       ← Reusable buttons
│   ├── Input.svelte        ← Form inputs
│   ├── Card.svelte         ← Content containers
│   ├── Badge.svelte        ← Status indicators
│   └── Modal.svelte        ← Overlay dialogs
├── map/                    ← Map-specific components
│   ├── MapContainer.svelte ← Main map display
│   ├── VenueMarker.svelte  ← Map pins
│   └── SearchBox.svelte    ← Location search
├── venue/                  ← Cafe/venue components
│   ├── VenueCard.svelte    ← Cafe preview cards
│   ├── VenueDetails.svelte ← Full venue info
│   ├── ReviewCard.svelte   ← Individual reviews
│   └── ReviewForm.svelte   ← Submit reviews
└── layout/                 ← Layout components
    ├── Header.svelte       ← Site header
    ├── Navigation.svelte   ← Main menu
    └── Footer.svelte       ← Site footer
```

## 🎯 Component Design Principles

### 1. Single Responsibility
Each component should do one thing well.

**Good:**
```svelte
<!-- VenueCard.svelte - Shows venue preview -->
<div class="card">
  <h3>{venue.name}</h3>
  <p>{venue.address}</p>
  <StarRating rating={venue.rating} />
</div>
```

**Bad:**
```svelte
<!-- MessyComponent.svelte - Does too many things -->
<div>
  <h3>{venue.name}</h3>
  <p>{venue.address}</p>
  <div><!-- Complex map rendering --></div>
  <form><!-- Review submission form --></form>
  <div><!-- User profile section --></div>
</div>
```

### 2. Props for Customization
Use props to make components flexible.

```svelte
<!-- Button.svelte -->
<script lang="ts">
  export let variant: 'primary' | 'secondary' | 'danger' = 'primary';
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let disabled = false;
  export let fullWidth = false;
</script>

<button 
  class="btn btn-{variant} btn-{size} {fullWidth ? 'w-full' : ''}"
  {disabled}
  on:click
>
  <slot />
</button>
```

### 3. Events for Communication
Components communicate through events.

```svelte
<!-- SearchBox.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher<{
    search: { query: string; location: string };
  }>();
  
  let query = '';
  let location = '';
  
  function handleSubmit() {
    dispatch('search', { query, location });
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <input bind:value={query} placeholder="Search cafes..." />
  <input bind:value={location} placeholder="Location..." />
  <button type="submit">Search</button>
</form>
```

**Using the component:**
```svelte
<SearchBox on:search={handleSearch} />

<script>
  function handleSearch(event) {
    const { query, location } = event.detail;
    // Perform search...
  }
</script>
```

## 🎨 Building Your First Component

Let's build a `StarRating` component step by step.

### Step 1: Create the File
Create `src/lib/components/ui/StarRating.svelte`:

```svelte
<script lang="ts">
  export let rating: number;
  export let maxStars = 5;
  export let size: 'sm' | 'md' | 'lg' = 'md';
  export let showNumber = true;
  
  $: stars = Array.from({ length: maxStars }, (_, i) => ({
    filled: i < Math.floor(rating),
    half: i === Math.floor(rating) && rating % 1 >= 0.5,
    empty: i >= Math.ceil(rating)
  }));
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base', 
    lg: 'text-lg'
  };
</script>

<div class="flex items-center gap-1 {sizeClasses[size]}">
  {#each stars as star}
    <span class="text-yellow-400">
      {#if star.filled}
        ★
      {:else if star.half}
        ☆
      {:else}
        ☆
      {/if}
    </span>
  {/each}
  
  {#if showNumber}
    <span class="text-gray-600 ml-1">
      {rating.toFixed(1)}
    </span>
  {/if}
</div>
```

### Step 2: Use the Component
In any other component:

```svelte
<script>
  import StarRating from '$lib/components/ui/StarRating.svelte';
</script>

<StarRating rating={4.5} />
<StarRating rating={3.2} size="lg" />
<StarRating rating={5} showNumber={false} />
```

## 🔄 Component Communication Patterns

### 1. Parent to Child (Props)
```svelte
<!-- Parent.svelte -->
<VenueCard venue={selectedVenue} showDetails={true} />

<!-- VenueCard.svelte -->
<script lang="ts">
  export let venue: Venue;
  export let showDetails = false;
</script>
```

### 2. Child to Parent (Events)
```svelte
<!-- Child.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();
  
  function handleClick() {
    dispatch('venue-selected', venue);
  }
</script>

<button on:click={handleClick}>Select Venue</button>

<!-- Parent.svelte -->
<VenueCard on:venue-selected={handleVenueSelection} />
```

### 3. Global State (Stores)
```svelte
<!-- Any component -->
<script>
  import { selectedVenue } from '$lib/stores';
  
  // Read store value
  $: currentVenue = $selectedVenue;
  
  // Update store value
  function selectVenue(venue) {
    selectedVenue.set(venue);
  }
</script>
```

## 🎭 Advanced Component Patterns

### 1. Slots for Flexible Content
```svelte
<!-- Card.svelte -->
<div class="card">
  <header class="card-header">
    <slot name="header" />
  </header>
  
  <div class="card-body">
    <slot />
  </div>
  
  <footer class="card-footer">
    <slot name="footer" />
  </footer>
</div>

<!-- Using the Card -->
<Card>
  <h2 slot="header">Venue Name</h2>
  
  <p>This is the main content area.</p>
  
  <div slot="footer">
    <Button>Visit</Button>
  </div>
</Card>
```

### 2. Conditional Slots
```svelte
<!-- Modal.svelte -->
<script>
  export let isOpen = false;
</script>

{#if isOpen}
  <div class="modal-backdrop">
    <div class="modal">
      <header class="modal-header">
        <slot name="header" />
        <button on:click={() => isOpen = false}>×</button>
      </header>
      
      <div class="modal-body">
        <slot />
      </div>
      
      {#if $$slots.footer}
        <footer class="modal-footer">
          <slot name="footer" />
        </footer>
      {/if}
    </div>
  </div>
{/if}
```

### 3. Render Props Pattern
```svelte
<!-- DataLoader.svelte -->
<script lang="ts">
  export let loadData: () => Promise<any>;
  
  let data = null;
  let loading = true;
  let error = null;
  
  async function load() {
    try {
      loading = true;
      data = await loadData();
    } catch (e) {
      error = e;
    } finally {
      loading = false;
    }
  }
  
  load();
</script>

<slot {data} {loading} {error} />

<!-- Using DataLoader -->
<DataLoader loadData={fetchVenues} let:data let:loading let:error>
  {#if loading}
    <p>Loading venues...</p>
  {:else if error}
    <p>Error: {error.message}</p>
  {:else}
    {#each data as venue}
      <VenueCard {venue} />
    {/each}
  {/if}
</DataLoader>
```

## 🧪 Testing Components

### Basic Component Test
```typescript
// StarRating.test.ts
import { render } from '@testing-library/svelte';
import StarRating from './StarRating.svelte';

describe('StarRating', () => {
  it('renders correct number of stars', () => {
    const { container } = render(StarRating, { rating: 4.5 });
    
    const filledStars = container.querySelectorAll('.star-filled');
    expect(filledStars).toHaveLength(4);
  });
  
  it('shows rating number when enabled', () => {
    const { getByText } = render(StarRating, { 
      rating: 4.2, 
      showNumber: true 
    });
    
    expect(getByText('4.2')).toBeInTheDocument();
  });
});
```

### Testing Events
```typescript
// SearchBox.test.ts
import { render, fireEvent } from '@testing-library/svelte';
import SearchBox from './SearchBox.svelte';

describe('SearchBox', () => {
  it('dispatches search event on submit', async () => {
    let searchData = null;
    
    const { component, getByRole } = render(SearchBox);
    
    component.$on('search', (event) => {
      searchData = event.detail;
    });
    
    const submitButton = getByRole('button', { name: /search/i });
    await fireEvent.click(submitButton);
    
    expect(searchData).toEqual({
      query: expect.any(String),
      location: expect.any(String)
    });
  });
});
```

## 📝 Component Documentation

Document your components for team use:

```svelte
<!-- 
@component VenueCard

Displays a preview card for a cafe/venue with key information.

@example
```svelte
<VenueCard 
  venue={venue} 
  showDistance={true}
  on:click={handleVenueClick}
  on:favorite={handleFavoriteToggle}
/>
```

@prop {Venue} venue - The venue object to display
@prop {boolean} showDistance - Whether to show distance from user
@prop {boolean} compact - Use compact layout for mobile

@event {CustomEvent<Venue>} click - Fired when card is clicked
@event {CustomEvent<{venueId: string, isFavorite: boolean}>} favorite - Fired when favorite button is clicked
-->

<script lang="ts">
  export let venue: Venue;
  export let showDistance = false;
  export let compact = false;
  
  // Component implementation...
</script>
```

## 🎯 Real-World Component Example

Let's build a complete `VenueCard` component:

```svelte
<!-- VenueCard.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import StarRating from '$lib/components/ui/StarRating.svelte';
  import Badge from '$lib/components/ui/Badge.svelte';
  import type { Venue } from '$lib/types';
  
  export let venue: Venue;
  export let showDistance = false;
  export let compact = false;
  
  const dispatch = createEventDispatcher<{
    click: Venue;
    favorite: { venueId: string; isFavorite: boolean };
  }>();
  
  let isFavorite = false;
  
  function handleCardClick() {
    dispatch('click', venue);
  }
  
  function handleFavoriteClick(event: Event) {
    event.stopPropagation();
    isFavorite = !isFavorite;
    dispatch('favorite', { 
      venueId: venue.id, 
      isFavorite 
    });
  }
  
  $: wifiQuality = venue.amenities.wifi_quality;
  $: noiseLevel = venue.amenities.noise_level;
</script>

<article 
  class="venue-card {compact ? 'compact' : ''}"
  on:click={handleCardClick}
  on:keydown={(e) => e.key === 'Enter' && handleCardClick()}
  role="button"
  tabindex="0"
>
  <!-- Venue Image -->
  {#if venue.photos.length > 0}
    <div class="venue-image">
      <img 
        src={venue.photos[0]} 
        alt={venue.name}
        loading="lazy"
      />
      
      <!-- Favorite Button -->
      <button 
        class="favorite-btn"
        on:click={handleFavoriteClick}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        {isFavorite ? '❤️' : '🤍'}
      </button>
    </div>
  {/if}
  
  <!-- Venue Info -->
  <div class="venue-info">
    <header class="venue-header">
      <h3 class="venue-name">{venue.name}</h3>
      {#if showDistance && venue.distance}
        <span class="distance">{venue.distance}km</span>
      {/if}
    </header>
    
    <p class="venue-address">{venue.address}</p>
    
    <!-- Rating and Amenities -->
    <div class="venue-meta">
      <StarRating rating={venue.rating} size="sm" />
      
      <div class="amenities">
        <Badge 
          text="WiFi {wifiQuality}/5" 
          color={wifiQuality >= 4 ? 'green' : wifiQuality >= 3 ? 'yellow' : 'red'}
        />
        
        <Badge 
          text="Quiet {5 - noiseLevel}/5" 
          color={noiseLevel <= 2 ? 'green' : noiseLevel <= 3 ? 'yellow' : 'red'}
        />
        
        {#if venue.amenities.power_outlets}
          <Badge text="Power" color="blue" />
        {/if}
      </div>
    </div>
  </div>
</article>

<style>
  .venue-card {
    @apply bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md hover:border-gray-300;
  }
  
  .venue-card.compact {
    @apply flex flex-row;
  }
  
  .venue-image {
    @apply relative;
  }
  
  .venue-card:not(.compact) .venue-image {
    @apply h-48 w-full;
  }
  
  .venue-card.compact .venue-image {
    @apply h-24 w-24 flex-shrink-0;
  }
  
  .venue-image img {
    @apply w-full h-full object-cover;
  }
  
  .favorite-btn {
    @apply absolute top-2 right-2 p-1 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all;
  }
  
  .venue-info {
    @apply p-4;
  }
  
  .venue-header {
    @apply flex justify-between items-start mb-2;
  }
  
  .venue-name {
    @apply text-lg font-semibold text-gray-900;
  }
  
  .distance {
    @apply text-sm text-gray-500 flex-shrink-0;
  }
  
  .venue-address {
    @apply text-gray-600 text-sm mb-3;
  }
  
  .venue-meta {
    @apply flex flex-col gap-2;
  }
  
  .amenities {
    @apply flex flex-wrap gap-1;
  }
</style>
```

## 💡 Component Best Practices

### 1. Keep Props Simple
```svelte
<!-- Good: Simple, focused props -->
<Button variant="primary" size="lg" disabled={loading}>
  Submit
</Button>

<!-- Bad: Complex object props -->
<Button config={{variant: 'primary', size: 'lg', state: {disabled: loading, loading: true}}}>
  Submit
</Button>
```

### 2. Use TypeScript
```svelte
<script lang="ts">
  import type { Venue } from '$lib/types';
  
  export let venue: Venue;
  export let compact: boolean = false;
  export let onSelect: (venue: Venue) => void = () => {};
</script>
```

### 3. Handle Edge Cases
```svelte
<script>
  export let venues: Venue[] = [];
  export let loading = false;
  export let error: string | null = null;
</script>

{#if loading}
  <div class="loading">Loading venues...</div>
{:else if error}
  <div class="error">Error: {error}</div>
{:else if venues.length === 0}
  <div class="empty">No venues found</div>
{:else}
  {#each venues as venue}
    <VenueCard {venue} />
  {/each}
{/if}
```

### 4. Accessibility First
```svelte
<button 
  class="favorite-btn"
  on:click={handleFavoriteClick}
  aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
  aria-pressed={isFavorite}
>
  {isFavorite ? '❤️' : '🤍'}
</button>
```

### 5. Performance Considerations
```svelte
<!-- Use key for efficient list updates -->
{#each venues as venue (venue.id)}
  <VenueCard {venue} />
{/each}

<!-- Lazy load images -->
<img 
  src={venue.image} 
  alt={venue.name}
  loading="lazy"
/>

<!-- Avoid expensive computations in templates -->
<script>
  $: expensiveValue = expensiveComputation(data);
</script>
<p>{expensiveValue}</p>
```

## 🚀 Next Steps

You now understand component architecture! Continue learning:

1. **Practice building components** - Start with simple ones
2. **Study existing components** - See how they're structured
3. **Read the next tutorial** - `07-styling-with-tailwind.md`
4. **Experiment with slots** - Build flexible, reusable components

Remember: **Good components are reusable, testable, and focused on a single responsibility.**