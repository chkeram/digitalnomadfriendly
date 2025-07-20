# Troubleshooting FAQ - Common Issues & Solutions

This guide covers the most common problems you might encounter while developing with our Digital Nomad Friendly app, along with step-by-step solutions.

## 🚨 Development Server Issues

### Problem: `npm run dev` Won't Start

**Error message:**
```
Error: Cannot find module 'svelte'
npm ERR! code ELIFECYCLE
```

**Solution:**
```bash
# 1. Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# 2. Clear npm cache
npm cache clean --force

# 3. Reinstall dependencies
npm install

# 4. Try starting again
npm run dev
```

### Problem: Port Already in Use

**Error message:**
```
Error: listen EADDRINUSE: address already in use :::5173
```

**Solutions:**

**Option 1 - Use different port:**
```bash
npm run dev -- --port 3000
```

**Option 2 - Kill process using the port:**
```bash
# Find what's using port 5173
lsof -i :5173

# Kill the process (replace PID with actual number)
kill -9 PID
```

**Option 3 - Restart your computer** (nuclear option but always works!)

### Problem: Hot Reload Stopped Working

**Symptoms:** Changes don't appear in browser automatically

**Solutions:**
```bash
# 1. Save all files and restart dev server
# Press Ctrl+C to stop, then:
npm run dev

# 2. Hard refresh browser
# Mac: Cmd+Shift+R
# Windows: Ctrl+Shift+R

# 3. Clear browser cache
# Open DevTools (F12) → Network tab → Check "Disable cache"
```

## 💻 Browser Issues

### Problem: Page Shows "This Site Can't Be Reached"

**Symptoms:** Browser can't load http://localhost:5173

**Solutions:**
1. **Check dev server is running:**
   ```bash
   # Look for this message in terminal:
   ➜  Local:   http://localhost:5173/
   ```

2. **Try different URL:**
   - `http://127.0.0.1:5173`
   - `http://0.0.0.0:5173`

3. **Check firewall settings:**
   - Mac: System Preferences → Security → Firewall
   - Windows: Windows Defender Firewall

### Problem: Page Loads But Looks Broken

**Symptoms:** No styling, layout is broken

**Common causes & solutions:**

**1. Tailwind CSS not loading:**
```bash
# Check terminal for CSS errors
# Look for PostCSS or Tailwind errors in console

# Restart dev server
npm run dev
```

**2. JavaScript errors:**
```bash
# Open browser DevTools (F12)
# Check Console tab for red error messages
# Fix the JavaScript errors shown
```

**3. Import errors:**
```bash
# Check for TypeScript errors
npm run check

# Fix any import path issues
```

## 🔧 TypeScript Errors

### Problem: "Cannot Find Module" Errors

**Error example:**
```
Cannot find module '$lib/components/Button.svelte'
```

**Solutions:**

**1. Check file path:**
```typescript
// ❌ Wrong
import Button from '$lib/component/Button.svelte';

// ✅ Correct  
import Button from '$lib/components/Button.svelte';
```

**2. Check file exists:**
```bash
# Verify file exists at this path
ls src/lib/components/Button.svelte
```

**3. Restart TypeScript server:**
- VS Code: `Cmd+Shift+P` → "TypeScript: Restart TS Server"

### Problem: Property Doesn't Exist on Type

**Error example:**
```
Property 'name' does not exist on type 'Venue'
```

**Solutions:**

**1. Check type definition:**
```typescript
// In src/lib/types/index.ts
export interface Venue {
  id: string;
  name: string;  // ← Make sure this property exists
  // ...
}
```

**2. Update the interface:**
```typescript
// Add missing property
export interface Venue {
  id: string;
  name: string;
  address: string;  // ← Add this if missing
}
```

**3. Use optional properties if needed:**
```typescript
export interface Venue {
  id: string;
  name: string;
  address?: string;  // ← Optional property
}
```

### Problem: "Any" Type Errors

**Error example:**
```
Parameter 'event' implicitly has an 'any' type
```

**Solution - Add proper types:**
```typescript
// ❌ No type
function handleClick(event) {
  // ...
}

// ✅ With type
function handleClick(event: MouseEvent) {
  // ...
}

// ✅ For custom events
function handleCustomEvent(event: CustomEvent<{venueId: string}>) {
  const venueId = event.detail.venueId;
}
```

## 🎨 Styling Issues

### Problem: Tailwind Classes Not Working

**Symptoms:** Classes like `bg-blue-500` don't apply styles

**Solutions:**

**1. Check class name spelling:**
```html
<!-- ❌ Typo -->
<div class="bg-blu-500">

<!-- ✅ Correct -->
<div class="bg-blue-500">
```

**2. Check Tailwind config:**
```javascript
// tailwind.config.js
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'], // ← Make sure this includes your files
  // ...
}
```

**3. Restart dev server:**
```bash
# Stop server (Ctrl+C) and restart
npm run dev
```

### Problem: Custom CSS Not Working

**Issue:** Styles in `<style>` blocks don't apply

**Solutions:**

**1. Check CSS syntax:**
```svelte
<style>
  /* ❌ Missing semicolon */
  .my-class {
    color: red
  }

  /* ✅ Correct */
  .my-class {
    color: red;
  }
</style>
```

**2. Use :global() for global styles:**
```svelte
<style>
  /* ❌ Only applies to this component */
  .btn {
    background: blue;
  }

  /* ✅ Applies globally */
  :global(.btn) {
    background: blue;
  }
</style>
```

### Problem: Responsive Classes Not Working

**Issue:** `md:text-lg` doesn't work on tablet

**Solutions:**

**1. Understand mobile-first:**
```html
<!-- ❌ Wrong thinking -->
<div class="text-lg md:text-sm">  <!-- Goes from large to small -->

<!-- ✅ Mobile-first -->
<div class="text-sm md:text-lg">  <!-- Goes from small to large -->
```

**2. Test at correct screen sizes:**
- `sm:` = 640px and up
- `md:` = 768px and up  
- `lg:` = 1024px and up

## 🧪 Testing Issues

### Problem: Tests Failing After Changes

**Error example:**
```
Expected: "Save"
Received: "Submit"
```

**Solutions:**

**1. Update test to match new reality:**
```typescript
// ❌ Old test
expect(button).toHaveTextContent('Save');

// ✅ Updated test
expect(button).toHaveTextContent('Submit');
```

**2. Fix the code if test is correct:**
```svelte
<!-- Change button text to match test expectation -->
<button>Save</button>
```

### Problem: "Cannot Find DOM Element" in Tests

**Error example:**
```
Unable to find an element with the text: Submit
```

**Solutions:**

**1. Check element exists:**
```typescript
// ❌ Element might not exist
const button = getByText('Submit');

// ✅ Check if it exists first
const button = screen.queryByText('Submit');
expect(button).toBeInTheDocument();
```

**2. Wait for async elements:**
```typescript
// ❌ Element loads asynchronously
const button = getByText('Submit');

// ✅ Wait for it to appear
const button = await findByText('Submit');
```

## 📦 Build Issues

### Problem: Build Fails with TypeScript Errors

**Error example:**
```
✗ Build failed in 45ms
Type errors found
```

**Solutions:**

**1. Check all TypeScript errors:**
```bash
npm run check
```

**2. Fix errors one by one:**
```bash
# Fix the errors shown in the output
# Then try building again
npm run build
```

**3. Skip type checking (temporary fix):**
```bash
# Only use this to test if build works
npm run build -- --no-typecheck
```

### Problem: Build Success But App Doesn't Work

**Symptoms:** Build completes but deployed app is broken

**Solutions:**

**1. Test production build locally:**
```bash
npm run build
npm run preview
```

**2. Check console for runtime errors:**
- Open browser DevTools (F12)
- Look for red errors in Console tab

**3. Check environment variables:**
```bash
# Make sure .env variables are set in production
echo $PUBLIC_SUPABASE_URL
```

## 🔌 Import/Export Issues

### Problem: Default Import Errors

**Error example:**
```
Module has no default export
```

**Solutions:**

**1. Use named imports:**
```typescript
// ❌ Wrong
import calculateDistance from '$lib/utils';

// ✅ Correct
import { calculateDistance } from '$lib/utils';
```

**2. Check export syntax:**
```typescript
// ❌ No default export
export function calculateDistance() { }

// ✅ With default export
export default function calculateDistance() { }
export function calculateDistance() { }
```

### Problem: Circular Import Dependencies

**Error example:**
```
Warning: Circular dependency detected
```

**Solutions:**

**1. Restructure imports:**
```typescript
// ❌ A imports B, B imports A
// file-a.ts
import { functionB } from './file-b';

// file-b.ts  
import { functionA } from './file-a';

// ✅ Create shared file
// shared.ts
export function sharedFunction() { }

// file-a.ts
import { sharedFunction } from './shared';

// file-b.ts
import { sharedFunction } from './shared';
```

## 🐛 Git Issues

### Problem: Merge Conflicts

**Error example:**
```
<<<<<<< HEAD
const title = "New Title";
=======
const title = "Different Title";
>>>>>>> feature-branch
```

**Solutions:**

**1. Resolve manually in VS Code:**
- Open conflicted file
- Choose which version to keep
- Remove conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
- Save file

**2. Use VS Code merge tool:**
- Click "Accept Current Change" or "Accept Incoming Change"
- Or click "Accept Both Changes" if you want both

**3. Commit the resolution:**
```bash
git add .
git commit -m "resolve merge conflicts"
```

### Problem: Accidentally Committed Wrong Files

**Solutions:**

**1. Remove from last commit:**
```bash
# Remove file from staging and last commit
git reset HEAD~1 filename.txt

# Then commit again without that file
git add .
git commit -m "fixed commit"
```

**2. Undo last commit completely:**
```bash
# Keep changes but undo commit
git reset --soft HEAD~1

# Discard changes and undo commit
git reset --hard HEAD~1
```

## 📱 Mobile/Responsive Issues

### Problem: App Doesn't Look Right on Mobile

**Common issues & solutions:**

**1. Text too small:**
```html
<!-- ❌ Too small on mobile -->
<p class="text-xs">

<!-- ✅ Better mobile size -->
<p class="text-sm md:text-base">
```

**2. Touch targets too small:**
```html
<!-- ❌ Hard to tap -->
<button class="p-1">

<!-- ✅ Easy to tap (44px minimum) -->
<button class="p-3">
```

**3. Horizontal scrolling:**
```html
<!-- ❌ Can cause horizontal scroll -->
<div class="w-96">

<!-- ✅ Responsive width -->
<div class="w-full max-w-md">
```

## 🔍 Debugging Tips

### 1. Use Browser DevTools

**Console tab:**
- See JavaScript errors
- Add `console.log()` statements
- Test JavaScript expressions

**Elements tab:**
- Inspect HTML structure
- Edit CSS in real-time
- See computed styles

**Network tab:**
- Check if API calls are working
- See failed resource loads
- Monitor performance

### 2. Add Debug Information

```svelte
<script>
  let data = [];
  
  // Add debugging
  $: console.log('Data updated:', data);
  
  function handleClick() {
    console.log('Button clicked');
    // Your code here
  }
</script>

<!-- Show debug info in development -->
{#if import.meta.env.DEV}
  <div class="debug">
    <pre>{JSON.stringify(data, null, 2)}</pre>
  </div>
{/if}
```

### 3. Check VS Code Problems Tab

- View → Problems
- Shows TypeScript and ESLint errors
- Double-click to jump to issue

## 🆘 When You're Really Stuck

### 1. Start Fresh
```bash
# Save your changes first!
git add .
git commit -m "save work in progress"

# Then try a clean slate
git checkout main
git pull origin main
npm install
npm run dev
```

### 2. Ask for Help Effectively

**Good help request:**
```
Problem: Can't get venue cards to display
What I tried: 
- Checked API response (working)
- Verified component imports (correct)
- Tested with hardcoded data (works)
Error message: "Cannot read property 'map' of undefined"
Code: [paste relevant code snippet]
```

**Bad help request:**
```
"It's not working help"
```

### 3. Search for Solutions

**Good search terms:**
- "SvelteKit cannot find module error"
- "Tailwind CSS classes not working"
- "TypeScript property does not exist"

**Resources:**
- [SvelteKit docs](https://kit.svelte.dev)
- [Svelte docs](https://svelte.dev)
- [Tailwind docs](https://tailwindcss.com)
- [TypeScript docs](https://typescriptlang.org)
- Stack Overflow
- GitHub issues

## 🎯 Prevention Tips

### 1. Save Often
```bash
# Commit small changes frequently
git add .
git commit -m "add venue card component"
```

### 2. Test as You Go
```bash
# Run checks frequently
npm run check
npm run test
```

### 3. Keep Dependencies Updated
```bash
# Check for updates monthly
npm outdated
npm update
```

### 4. Use TypeScript
- Catches errors before they happen
- Provides better autocomplete
- Makes refactoring safer

## 💡 Remember

- **Errors are learning opportunities** - Every error teaches you something
- **Start simple** - If something complex isn't working, try a simpler version first
- **Read error messages carefully** - They usually tell you exactly what's wrong
- **Don't be afraid to break things** - You can always undo with Git
- **Ask for help** - No one expects you to know everything

## 🚀 Quick Fixes Checklist

When something's not working, try these in order:

1. **Save all files** - Unsaved changes can cause issues
2. **Check terminal for errors** - Look for red error messages
3. **Check browser console** - Open DevTools (F12) and look for errors
4. **Restart dev server** - Stop (Ctrl+C) and start (`npm run dev`)
5. **Hard refresh browser** - Cmd/Ctrl + Shift + R
6. **Check TypeScript** - `npm run check`
7. **Clear and reinstall** - Delete `node_modules`, run `npm install`
8. **Restart VS Code** - Sometimes helps with TypeScript issues
9. **Restart computer** - The ultimate fix for mysterious issues

Remember: **Most problems have simple solutions!** Take a deep breath, read the error message, and work through the checklist systematically.