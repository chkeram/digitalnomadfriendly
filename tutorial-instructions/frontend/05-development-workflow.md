# Development Workflow - Your Daily Development Process

Now that you can make changes, let's learn the complete development workflow. This guide covers everything from starting a new feature to getting it ready for production.

## 🗺 The Big Picture - Development Flow

Here's the typical workflow for adding a new feature or fixing a bug:

```
1. Plan & Research
   ↓
2. Create Feature Branch  
   ↓
3. Make Changes & Test
   ↓
4. Code Quality Checks
   ↓
5. Commit & Push
   ↓
6. Create Pull Request
   ↓
7. Review & Merge
   ↓
8. Deploy to Production
```

Let's walk through each step with practical examples.

## 🎯 Step 1: Plan & Research

Before coding, understand what you're building.

### Example: Adding a "Favorite Cafes" Feature

**Questions to ask:**
- What should this feature do?
- Where does it fit in the UI?
- What data do we need to store?
- How will users interact with it?

**Research checklist:**
- Look at similar features in the codebase
- Check if components already exist
- Understand the data flow
- Plan the user experience

## 🌿 Step 2: Create Feature Branch

Always work on a separate branch for new features.

### Check Current Status
```bash
# See what branch you're on
git status

# See all branches
git branch
```

### Create New Branch
```bash
# Make sure you're on main/develop
git checkout main

# Pull latest changes
git pull origin main

# Create and switch to new branch
git checkout -b feature/favorite-cafes

# Alternative: create branch from GitHub issue
git checkout -b feature/13-favorite-cafes
```

### Branch Naming Conventions
- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `hotfix/description` - Urgent production fixes
- `enhancement/description` - Improvements to existing features

## 💻 Step 3: Make Changes & Test

This is where you do the actual coding work.

### Development Server
Always keep the dev server running:
```bash
npm run dev
```

**💡 Pro tip:** Use a separate terminal tab so you can run other commands.

### Making Changes
1. **Start small** - Make one change at a time
2. **Test frequently** - Check your changes in the browser
3. **Use TypeScript** - Let it help you catch errors
4. **Follow patterns** - Look at existing code for guidance

### Example: Adding Favorite Button to Venue Card

#### Step 1: Update Types
In `src/lib/types/index.ts`:
```typescript
export interface Venue {
  id: string;
  name: string;
  // ... existing properties
  isFavorite?: boolean; // Add this
}
```

#### Step 2: Update Store
In `src/lib/stores/index.ts`:
```typescript
export const favoriteVenues = writable<string[]>([]);

export function toggleFavorite(venueId: string) {
  favoriteVenues.update(favorites => {
    if (favorites.includes(venueId)) {
      return favorites.filter(id => id !== venueId);
    } else {
      return [...favorites, venueId];
    }
  });
}
```

#### Step 3: Create Component
Create `src/lib/components/venue/FavoriteButton.svelte`:
```svelte
<script lang="ts">
  import { favoriteVenues, toggleFavorite } from '$lib/stores';
  
  export let venueId: string;
  
  $: isFavorite = $favoriteVenues.includes(venueId);
  
  function handleClick() {
    toggleFavorite(venueId);
  }
</script>

<button 
  class="favorite-btn {isFavorite ? 'active' : ''}"
  on:click={handleClick}
  aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
>
  {isFavorite ? '❤️' : '🤍'}
</button>

<style>
  .favorite-btn {
    @apply p-2 rounded-full hover:bg-gray-100 transition-colors;
  }
  
  .favorite-btn.active {
    @apply bg-red-50;
  }
</style>
```

### Testing Your Changes

#### Manual Testing
1. **Visual check** - Does it look right?
2. **Functionality check** - Does it work as expected?
3. **Edge cases** - What happens with empty data?
4. **Mobile check** - Resize browser to test mobile view

#### Automated Testing
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test src/lib/stores/index.test.ts
```

#### Add Tests for New Features
Create `src/lib/stores/favorites.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { get } from 'svelte/store';
import { favoriteVenues, toggleFavorite } from './index.js';

describe('Favorites functionality', () => {
  it('should add venue to favorites', () => {
    toggleFavorite('venue-123');
    expect(get(favoriteVenues)).toContain('venue-123');
  });
  
  it('should remove venue from favorites when toggled again', () => {
    toggleFavorite('venue-123'); // Add
    toggleFavorite('venue-123'); // Remove
    expect(get(favoriteVenues)).not.toContain('venue-123');
  });
});
```

## ✅ Step 4: Code Quality Checks

Before committing, make sure your code meets quality standards.

### Run All Quality Checks
```bash
# TypeScript type checking
npm run check

# Code formatting
npm run format

# Linting (code quality)
npm run lint

# Tests
npm run test

# Production build test
npm run build
```

### Fix Common Issues

#### TypeScript Errors
```bash
npm run check
```
**Example error:**
```
Error: Property 'isFavorite' does not exist on type 'Venue'
```
**Fix:** Add the property to your type definition.

#### Formatting Issues
```bash
npm run format
```
This automatically fixes:
- Inconsistent indentation
- Missing semicolons
- Quote style consistency
- Line length issues

#### Linting Errors
```bash
npm run lint
```
**Example error:**
```
'favoriteVenues' is defined but never used
```
**Fix:** Remove unused imports or variables.

#### Test Failures
```bash
npm run test
```
**Example error:**
```
Expected: true
Received: false
```
**Fix:** Update your code or fix the test logic.

## 📝 Step 5: Commit & Push

Time to save your work and share it.

### Check What Changed
```bash
# See all changes
git status

# See specific changes
git diff

# See changes in a specific file
git diff src/lib/stores/index.ts
```

### Stage Your Changes
```bash
# Add all changes
git add .

# Add specific files
git add src/lib/stores/index.ts src/lib/components/venue/FavoriteButton.svelte

# Add and review each change
git add -p
```

### Commit Your Changes
```bash
git commit -m "feat: add favorite cafes functionality

- Add isFavorite property to Venue type
- Create favoriteVenues store with toggle function  
- Implement FavoriteButton component
- Add tests for favorites functionality

Resolves #13"
```

### Good Commit Message Format
```
<type>: <description>

<body>

<footer>
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

### Push to Remote
```bash
# Push new branch to GitHub
git push -u origin feature/favorite-cafes

# Push updates to existing branch
git push
```

## 🔄 Step 6: Create Pull Request

Share your work for review and integration.

### Using GitHub CLI
```bash
# Create PR with title and description
gh pr create --title "Add favorite cafes functionality" --body "
## Summary
Adds the ability for users to favorite cafes and view their favorites list.

## Changes
- New FavoriteButton component
- Favorites store for state management
- Updated Venue type definition
- Added comprehensive tests

## Testing
- [x] Manual testing on desktop and mobile
- [x] All tests passing
- [x] TypeScript checks pass
- [x] Linting clean

## Screenshots
![Favorite button](./screenshot.png)

Resolves #13
"

# Create draft PR (for work in progress)
gh pr create --draft --title "WIP: Add favorite cafes functionality"
```

### Using GitHub Website
1. Go to your repository on GitHub
2. Click "Compare & pull request" button
3. Fill in title and description
4. Request reviewers
5. Link to related issues

### PR Best Practices
- **Clear title** - Summarize the change
- **Detailed description** - Explain what and why
- **Link issues** - Use "Resolves #123" format
- **Add screenshots** - For UI changes
- **Test checklist** - Show what you've tested

## 👀 Step 7: Review & Merge

Code review ensures quality and knowledge sharing.

### Self-Review Checklist
Before requesting review:
- [ ] All tests pass
- [ ] TypeScript checks pass
- [ ] Code is formatted and linted
- [ ] No console.log or debug code left
- [ ] Added tests for new functionality
- [ ] Updated documentation if needed

### Responding to Feedback
```bash
# Make requested changes
# ... edit files ...

# Commit additional changes
git add .
git commit -m "address PR feedback: improve error handling"

# Push updates
git push
```

### Merge Strategies
- **Squash and merge** - Clean history (recommended)
- **Merge commit** - Preserves branch history
- **Rebase and merge** - Linear history

## 🚀 Step 8: Deploy to Production

After merging, your code goes live.

### Automated Deployment
Most projects use CI/CD pipelines:
1. Code merged to main branch
2. Automated tests run
3. Build process creates production files
4. Deployment to staging environment
5. Final tests run
6. Deployment to production

### Manual Deployment
```bash
# Switch to main branch
git checkout main

# Pull latest changes
git pull origin main

# Build for production
npm run build

# Deploy (varies by hosting platform)
npm run deploy
```

## 🔄 Daily Workflow Example

Here's what a typical day looks like:

### Morning Routine
```bash
# Start development server
npm run dev

# Check what you were working on
git status
git log --oneline -5

# Pull latest changes from team
git pull origin main
```

### Working on Features
```bash
# Create feature branch
git checkout -b feature/search-filters

# Make changes, test frequently
# ... coding ...

# Check your work
npm run check
npm run test

# Commit progress
git add .
git commit -m "feat: add search filter dropdown"

# Push to backup your work
git push -u origin feature/search-filters
```

### End of Day
```bash
# Save all work
git add .
git commit -m "wip: search filters UI in progress"
git push

# Create draft PR for team awareness
gh pr create --draft --title "WIP: Search filters feature"
```

## 🛠 VS Code Integration

### Useful Extensions
Install these VS Code extensions:
- **Svelte for VS Code** - Syntax highlighting and IntelliSense
- **Tailwind CSS IntelliSense** - Autocomplete for CSS classes
- **TypeScript Importer** - Auto-import suggestions
- **GitLens** - Enhanced Git integration
- **Error Lens** - Inline error display

### VS Code Git Features
- **Source Control panel** - Stage/commit changes visually
- **Git Graph** - Visualize branch history
- **Diff viewer** - Compare file changes
- **Conflict resolution** - Resolve merge conflicts

### Keyboard Shortcuts
- `Cmd+Shift+P` - Command palette
- `Cmd+P` - Quick file open
- `Cmd+Shift+F` - Search across all files
- `Cmd+D` - Select next occurrence
- `F12` - Go to definition

## 🚨 Troubleshooting Common Issues

### "npm run dev" Won't Start
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for port conflicts
lsof -i :5173
```

### Git Conflicts
```bash
# Pull latest changes
git pull origin main

# If conflicts, resolve in VS Code
# Look for <<<<<<< markers
# Choose which code to keep
# Remove conflict markers

# Commit resolution
git add .
git commit -m "resolve merge conflicts"
```

### Tests Failing After Pull
```bash
# Update dependencies
npm install

# Clear test cache
npm run test -- --clearCache

# Run tests again
npm run test
```

### TypeScript Errors After Merge
```bash
# Restart TypeScript server in VS Code
# Command palette: "TypeScript: Restart TS Server"

# Or restart VS Code completely
```

## 📋 Workflow Checklist

For each feature or bug fix:

### Before Starting
- [ ] Pull latest changes from main
- [ ] Create feature branch
- [ ] Understand requirements

### During Development  
- [ ] Keep dev server running
- [ ] Test changes frequently
- [ ] Write/update tests
- [ ] Follow existing code patterns

### Before Committing
- [ ] Run `npm run check`
- [ ] Run `npm run test`
- [ ] Run `npm run format`
- [ ] Run `npm run lint`
- [ ] Test in browser

### Before PR
- [ ] Self-review all changes
- [ ] Write clear commit messages
- [ ] Push to feature branch
- [ ] Create detailed PR description

### After Merge
- [ ] Switch back to main branch
- [ ] Pull latest changes
- [ ] Delete feature branch locally
- [ ] Verify deployment

## 💡 Pro Tips

1. **Commit often** - Small, focused commits are easier to review
2. **Test early and often** - Catch issues before they compound
3. **Use descriptive names** - For branches, commits, and PRs
4. **Keep PRs small** - Easier to review and less risky to merge
5. **Document as you go** - Update README or add code comments
6. **Learn from reviews** - Code review feedback makes you better
7. **Stay current** - Regularly pull changes from main branch

## 🚀 Next Steps

You now understand the complete development workflow! Next:

1. **Practice the workflow** - Try creating a small feature
2. **Read the next tutorial** - `06-component-architecture.md`
3. **Experiment with Git** - Get comfortable with branching
4. **Learn VS Code shortcuts** - Become more efficient

The workflow becomes second nature with practice. Start with small changes and gradually work on bigger features as you gain confidence!