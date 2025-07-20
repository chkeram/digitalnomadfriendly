# Styling with Tailwind CSS - Making It Look Good

Tailwind CSS is our styling framework that lets you build beautiful designs without writing custom CSS. This guide will teach you how to style components and create great-looking UIs using Tailwind's utility classes.

## 🎨 What is Tailwind CSS?

Think of Tailwind like having a massive toolbox of pre-made design pieces:

### Traditional CSS Approach:
```css
/* You write custom CSS */
.my-button {
  background-color: #3b82f6;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 500;
}
```

### Tailwind Approach:
```html
<!-- You use pre-built utility classes -->
<button class="bg-blue-500 text-white px-4 py-2 rounded-md font-medium">
  Click me
</button>
```

### Why Tailwind is Great:
- **Faster development** - No need to write custom CSS
- **Consistent design** - All spacing, colors follow a system
- **Responsive by default** - Built-in mobile-first approach
- **No CSS conflicts** - Each class does one specific thing
- **Smaller bundles** - Only includes classes you actually use

## 🎯 Core Concepts

### 1. Utility-First Philosophy
Each class does one specific thing:

```html
<!-- Instead of one complex class -->
<div class="card">

<!-- Use multiple simple classes -->
<div class="bg-white rounded-lg shadow-md p-6 border border-gray-200">
```

### 2. Mobile-First Responsive Design
Start with mobile, then add larger screen styles:

```html
<!-- Mobile first: small text, stack vertically -->
<!-- md: (tablet) larger text, side by side -->
<!-- lg: (desktop) even larger text -->
<div class="text-sm md:text-base lg:text-lg flex-col md:flex-row">
```

### 3. Design System Built-In
Consistent spacing, colors, and typography:

```html
<!-- Spacing follows 4px scale: 1=4px, 2=8px, 4=16px, etc. -->
<div class="p-4 m-2 gap-6">

<!-- Colors have consistent shades: 50 (lightest) to 950 (darkest) -->
<div class="bg-blue-50 text-blue-900 border-blue-200">
```

## 📏 Understanding the Spacing System

Tailwind uses a consistent spacing scale:

| Class | Size | Pixels |
|-------|------|--------|
| `1` | 0.25rem | 4px |
| `2` | 0.5rem | 8px |
| `3` | 0.75rem | 12px |
| `4` | 1rem | 16px |
| `6` | 1.5rem | 24px |
| `8` | 2rem | 32px |
| `12` | 3rem | 48px |
| `16` | 4rem | 64px |

### Spacing Classes:
- **Margin**: `m-4` (all sides), `mx-4` (horizontal), `my-4` (vertical), `mt-4` (top)
- **Padding**: `p-4` (all sides), `px-4` (horizontal), `py-4` (vertical), `pt-4` (top)
- **Gap**: `gap-4` (for flexbox/grid children)
- **Space**: `space-x-4` (horizontal space between children)

## 🌈 Color System

Our project has custom colors defined in `tailwind.config.js`:

### Built-in Colors:
```html
<!-- Gray scale -->
<div class="bg-gray-50 text-gray-900">Light background, dark text</div>
<div class="bg-gray-800 text-gray-100">Dark background, light text</div>

<!-- Semantic colors -->
<div class="bg-red-500 text-white">Error state</div>
<div class="bg-green-500 text-white">Success state</div>
<div class="bg-yellow-500 text-black">Warning state</div>
<div class="bg-blue-500 text-white">Info state</div>
```

### Our Custom Colors:
```html
<!-- Primary blue (our brand color) -->
<div class="bg-primary-600 text-white">Brand button</div>
<div class="bg-primary-50 text-primary-900">Light brand background</div>

<!-- Secondary gray -->
<div class="bg-secondary-500 text-white">Secondary button</div>
```

### Color Intensity Scale:
- `50` - Very light (backgrounds)
- `100-200` - Light (subtle backgrounds)
- `300-400` - Medium light (borders)
- `500-600` - Medium (buttons, accents)
- `700-800` - Dark (text, dark buttons)
- `900-950` - Very dark (headings)

## 📝 Typography

### Text Sizes:
```html
<h1 class="text-4xl">Main heading</h1>        <!-- 36px -->
<h2 class="text-2xl">Section heading</h2>     <!-- 24px -->
<h3 class="text-xl">Subsection</h3>           <!-- 20px -->
<p class="text-base">Body text</p>            <!-- 16px -->
<small class="text-sm">Small text</small>     <!-- 14px -->
<span class="text-xs">Tiny text</span>        <!-- 12px -->
```

### Font Weights:
```html
<p class="font-thin">Thin text (100)</p>
<p class="font-light">Light text (300)</p>
<p class="font-normal">Normal text (400)</p>
<p class="font-medium">Medium text (500)</p>
<p class="font-semibold">Semibold text (600)</p>
<p class="font-bold">Bold text (700)</p>
```

### Text Colors:
```html
<p class="text-gray-900">Dark text (primary)</p>
<p class="text-gray-600">Medium text (secondary)</p>
<p class="text-gray-400">Light text (tertiary)</p>
<p class="text-blue-600">Brand colored text</p>
```

## 📦 Layout & Positioning

### Flexbox (Most Common):
```html
<!-- Center content -->
<div class="flex items-center justify-center">
  <p>Centered content</p>
</div>

<!-- Space between items -->
<div class="flex justify-between items-center">
  <h1>Title</h1>
  <button>Action</button>
</div>

<!-- Vertical stack with gaps -->
<div class="flex flex-col gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- Responsive direction -->
<div class="flex flex-col md:flex-row gap-4">
  <!-- Stacks on mobile, side-by-side on tablet+ -->
</div>
```

### Grid Layout:
```html
<!-- Auto-fit grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div>Card 1</div>
  <div>Card 2</div>
  <div>Card 3</div>
</div>

<!-- Fixed columns -->
<div class="grid grid-cols-12 gap-4">
  <div class="col-span-8">Main content</div>
  <div class="col-span-4">Sidebar</div>
</div>
```

### Positioning:
```html
<!-- Relative positioning -->
<div class="relative">
  <img src="image.jpg" alt="Background" />
  
  <!-- Absolute positioned overlay -->
  <div class="absolute top-4 right-4 bg-white p-2 rounded">
    Badge
  </div>
</div>

<!-- Sticky header -->
<header class="sticky top-0 bg-white shadow-md">
  Navigation
</header>
```

## 🎨 Visual Effects

### Shadows:
```html
<div class="shadow-sm">Subtle shadow</div>
<div class="shadow-md">Medium shadow</div>
<div class="shadow-lg">Large shadow</div>
<div class="shadow-xl">Extra large shadow</div>
```

### Borders:
```html
<div class="border border-gray-300">Default border</div>
<div class="border-2 border-blue-500">Thick blue border</div>
<div class="border-t border-gray-200">Top border only</div>
<div class="rounded-lg border">Rounded with border</div>
```

### Border Radius:
```html
<div class="rounded">Small radius (4px)</div>
<div class="rounded-md">Medium radius (6px)</div>
<div class="rounded-lg">Large radius (8px)</div>
<div class="rounded-xl">Extra large (12px)</div>
<div class="rounded-full">Circular</div>
```

## 📱 Responsive Design

Tailwind is mobile-first, meaning you start with mobile styles and add larger screen styles:

### Breakpoints:
- `sm:` - 640px and up (large mobile)
- `md:` - 768px and up (tablet)
- `lg:` - 1024px and up (desktop)
- `xl:` - 1280px and up (large desktop)

### Responsive Examples:
```html
<!-- Text size: small on mobile, larger on desktop -->
<h1 class="text-2xl md:text-4xl lg:text-6xl">
  Responsive Heading
</h1>

<!-- Layout: stack on mobile, side-by-side on tablet -->
<div class="flex flex-col md:flex-row gap-4">
  <div class="md:w-1/2">Content 1</div>
  <div class="md:w-1/2">Content 2</div>
</div>

<!-- Padding: less on mobile, more on desktop -->
<div class="p-4 md:p-8 lg:p-12">
  Content with responsive padding
</div>

<!-- Hide/show elements based on screen size -->
<div class="block md:hidden">Only visible on mobile</div>
<div class="hidden md:block">Only visible on tablet+</div>
```

## 🎯 Common UI Patterns

### 1. Card Component:
```html
<div class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
  <img src="image.jpg" alt="Card image" class="w-full h-48 object-cover" />
  
  <div class="p-6">
    <h3 class="text-xl font-semibold text-gray-900 mb-2">Card Title</h3>
    <p class="text-gray-600 mb-4">Card description text goes here.</p>
    
    <div class="flex justify-between items-center">
      <span class="text-sm text-gray-500">Metadata</span>
      <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
        Action
      </button>
    </div>
  </div>
</div>
```

### 2. Button Styles:
```html
<!-- Primary button -->
<button class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200">
  Primary Action
</button>

<!-- Secondary button -->
<button class="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-300 transition-colors duration-200">
  Secondary Action
</button>

<!-- Danger button -->
<button class="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200">
  Delete
</button>
```

### 3. Form Elements:
```html
<!-- Input field -->
<div class="mb-4">
  <label class="block text-sm font-medium text-gray-700 mb-2">
    Email Address
  </label>
  <input 
    type="email" 
    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    placeholder="Enter your email"
  />
</div>

<!-- Select dropdown -->
<select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
  <option>Choose an option</option>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</select>
```

### 4. Navigation Menu:
```html
<nav class="bg-white shadow-sm border-b border-gray-200">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center h-16">
      <!-- Logo -->
      <div class="flex items-center">
        <img src="logo.svg" alt="Logo" class="h-8 w-auto" />
        <span class="ml-2 text-xl font-semibold text-gray-900">Brand</span>
      </div>
      
      <!-- Navigation Links -->
      <div class="hidden md:flex space-x-8">
        <a href="/" class="text-gray-700 hover:text-blue-600 transition-colors">Home</a>
        <a href="/cafes" class="text-gray-700 hover:text-blue-600 transition-colors">Cafes</a>
        <a href="/about" class="text-gray-700 hover:text-blue-600 transition-colors">About</a>
      </div>
      
      <!-- Mobile menu button -->
      <button class="md:hidden p-2 rounded-md hover:bg-gray-100">
        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </div>
  </div>
</nav>
```

## 🎨 Our Custom Design System

In our `src/app.css`, we've defined custom component classes:

### Custom Button Classes:
```css
@layer components {
  .btn-primary {
    @apply bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200;
  }
  
  .btn-secondary {
    @apply bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-300 transition-colors duration-200;
  }
  
  .card {
    @apply bg-white rounded-lg shadow-sm border border-gray-200 p-4;
  }
}
```

### Using Custom Classes:
```html
<!-- Use our predefined button styles -->
<button class="btn-primary">Save Changes</button>
<button class="btn-secondary">Cancel</button>

<!-- Use our card style -->
<div class="card">
  <h3>Card Title</h3>
  <p>Card content goes here.</p>
</div>
```

## ⚡ Performance & Best Practices

### 1. Use Consistent Spacing:
```html
<!-- Good: Consistent spacing scale -->
<div class="p-4 m-2 gap-6">

<!-- Avoid: Random spacing values -->
<div class="p-[13px] m-[7px]">
```

### 2. Leverage Design Tokens:
```html
<!-- Good: Use semantic color names -->
<div class="bg-gray-50 text-gray-900">

<!-- Avoid: Hard to maintain -->
<div class="bg-[#f9fafb] text-[#111827]">
```

### 3. Mobile-First Approach:
```html
<!-- Good: Start with mobile, enhance for larger screens -->
<div class="text-sm md:text-base lg:text-lg">

<!-- Avoid: Desktop-first thinking -->
<div class="text-lg md:text-sm">
```

### 4. Combine Related Classes:
```html
<!-- Good: Logical grouping -->
<div class="
  bg-white rounded-lg shadow-md 
  p-6 m-4 
  flex items-center justify-between
">

<!-- Avoid: Random order -->
<div class="p-6 bg-white flex m-4 shadow-md items-center rounded-lg justify-between">
```

## 🎯 Practical Exercises

### Exercise 1: Style a Venue Card
Create a venue card using only Tailwind classes:

```html
<div class="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden max-w-sm">
  <!-- Image -->
  <img src="cafe.jpg" alt="Cozy Cafe" class="w-full h-48 object-cover" />
  
  <!-- Content -->
  <div class="p-4">
    <div class="flex justify-between items-start mb-2">
      <h3 class="text-lg font-semibold text-gray-900">Cozy Cafe</h3>
      <span class="text-sm text-gray-500">0.3km</span>
    </div>
    
    <p class="text-gray-600 text-sm mb-3">123 Main Street, Downtown</p>
    
    <!-- Rating and badges -->
    <div class="flex items-center gap-2 mb-3">
      <div class="flex text-yellow-400">
        ★★★★☆
      </div>
      <span class="text-sm text-gray-600">4.2</span>
    </div>
    
    <!-- Amenities -->
    <div class="flex flex-wrap gap-1">
      <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">WiFi 5/5</span>
      <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Quiet</span>
      <span class="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Power</span>
    </div>
  </div>
</div>
```

### Exercise 2: Create a Search Bar
```html
<div class="bg-white rounded-lg shadow-sm border border-gray-300 p-4">
  <div class="flex flex-col md:flex-row gap-4">
    <!-- Location input -->
    <div class="flex-1">
      <label class="block text-sm font-medium text-gray-700 mb-1">Location</label>
      <input 
        type="text" 
        placeholder="Enter city or address"
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
    
    <!-- Search input -->
    <div class="flex-1">
      <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
      <input 
        type="text" 
        placeholder="Cafe name, amenities..."
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
    
    <!-- Search button -->
    <div class="flex items-end">
      <button class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors duration-200">
        Search
      </button>
    </div>
  </div>
</div>
```

## 🔧 VS Code Tips for Tailwind

### Extensions:
1. **Tailwind CSS IntelliSense** - Autocomplete and hover info
2. **Headwind** - Automatically sorts Tailwind classes

### Settings:
Add to VS Code settings.json:
```json
{
  "tailwindCSS.includeLanguages": {
    "svelte": "html"
  },
  "editor.quickSuggestions": {
    "strings": true
  }
}
```

## 🎨 Dark Mode (Future Enhancement)

Tailwind includes dark mode support:

```html
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
  Content that adapts to dark mode
</div>

<button class="bg-blue-600 dark:bg-blue-500 text-white">
  Button that works in both modes
</button>
```

## 💡 Key Takeaways

1. **Utility-first** - Each class does one specific thing
2. **Mobile-first** - Start with mobile, enhance for larger screens
3. **Consistent spacing** - Use the built-in spacing scale
4. **Design tokens** - Stick to the predefined colors and sizes
5. **Responsive design** - Use breakpoint prefixes for different screen sizes
6. **Performance** - Only used classes are included in final bundle

## 🚀 Next Steps

Now you understand Tailwind CSS! Continue learning:

1. **Practice with exercises** - Build the examples above
2. **Explore the docs** - [tailwindcss.com](https://tailwindcss.com)
3. **Read the next tutorial** - `08-typescript-guide.md`
4. **Experiment with designs** - Try different color combinations and layouts

## 📚 Quick Reference

### Common Patterns:
```html
<!-- Flex center -->
<div class="flex items-center justify-center">

<!-- Full width button -->
<button class="w-full py-3 px-4 bg-blue-600 text-white rounded-lg">

<!-- Responsive grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

<!-- Card with hover effect -->
<div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6">

<!-- Input with focus state -->
<input class="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
```

Remember: **Start simple, then add complexity!** Tailwind makes it easy to build beautiful, responsive designs quickly.