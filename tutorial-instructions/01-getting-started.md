# Getting Started - Running Your First Frontend Project

Welcome! This guide will walk you through setting up and running the Digital Nomad Friendly project step by step. Don't worry if you're new to frontend development - we'll explain everything along the way.

## 📋 Prerequisites Check

Before we start, let's make sure you have everything you need installed on your computer.

### 1. Check if Node.js is Installed

Open your terminal (on Mac: press `Cmd + Space`, type "Terminal", press Enter) and run:

```bash
node --version
```

**What should happen:**
- You should see something like `v18.17.0` or `v20.x.x`
- If you see "command not found", you need to install Node.js

**If you need to install Node.js:**
1. Go to [nodejs.org](https://nodejs.org)
2. Download the "LTS" version (recommended for most users)
3. Run the installer and follow the prompts
4. Restart your terminal and try the command again

### 2. Check if npm is Available

```bash
npm --version
```

**What should happen:**
- You should see a version number like `9.6.7`
- npm comes with Node.js, so if Node.js is installed, this should work

### 3. Install a Code Editor (Recommended)

If you don't have one already, install **Visual Studio Code**:
1. Go to [code.visualstudio.com](https://code.visualstudio.com)
2. Download and install it
3. We'll set up helpful extensions later

## 🚀 Setting Up the Project

### Step 1: Navigate to Your Project

Open terminal and go to your project folder:

```bash
cd /Users/chariskeramidas/Desktop/projects/digitalnomadfriendly
```

**💡 Tip:** You can also drag the folder from Finder into Terminal to get the path automatically.

### Step 2: Install Project Dependencies

This downloads all the tools and libraries our project needs:

```bash
npm install
```

**What's happening:**
- npm reads the `package.json` file to see what we need
- It downloads everything into a `node_modules` folder
- This might take 1-2 minutes the first time

**If you see errors:**
- Try deleting `package-lock.json` and `node_modules` folder, then run `npm install` again
- Make sure you're in the right directory

### Step 3: Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

**What this does:**
- Creates a `.env` file based on our template
- This file stores settings like API keys (don't worry, we'll set these up later)

## 🏃‍♂️ Running the Project

### Start the Development Server

```bash
npm run dev
```

**What should happen:**
```
> digitalnomadfriendly@0.0.1 dev
> vite dev

  VITE v7.0.5  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### View Your Application

1. Open your web browser
2. Go to: `http://localhost:5173`
3. You should see the Digital Nomad Friendly homepage!

**🎉 Success!** If you see a page with:
- "Digital Nomad Friendly" as the title
- Three feature cards below
- Clean, modern styling

You're successfully running a SvelteKit application!

## 🛠 Useful Commands to Know

Here are the main commands you'll use:

### Development Commands

```bash
# Start the development server (use this most often)
npm run dev

# Stop the server (press Ctrl+C in terminal)
Ctrl + C

# Check if your code has any TypeScript errors
npm run check

# Run tests to make sure everything works
npm run test

# Format your code to look nice
npm run format

# Check code quality
npm run lint
```

### Build Commands

```bash
# Build the project for production (creates optimized files)
npm run build

# Preview the production build
npm run preview
```

## 🔍 Understanding What You're Looking At

When you visit `http://localhost:5173`, you're seeing:

1. **A SvelteKit Application**: A modern web framework that makes the site fast and interactive
2. **Tailwind CSS Styling**: Pre-built design classes that make everything look good
3. **TypeScript**: Adds type safety to catch errors early
4. **Hot Reload**: When you change code, the page updates automatically!

## ✏️ Making Your First Change

Let's make a small change to see how development works:

### Step 1: Open the Project in VS Code

```bash
code .
```

This opens the entire project in Visual Studio Code.

### Step 2: Find the Homepage File

1. In VS Code, look at the file explorer on the left
2. Navigate to: `src` → `routes` → `+page.svelte`
3. Click to open it

### Step 3: Make a Simple Change

Find this line (around line 4):
```html
<h1 class="text-4xl font-bold text-gray-900 mb-4">
  Digital Nomad Friendly
</h1>
```

Change it to:
```html
<h1 class="text-4xl font-bold text-gray-900 mb-4">
  My Awesome Cafe Finder
</h1>
```

### Step 4: Save and See the Change

1. Save the file (`Cmd+S` on Mac, `Ctrl+S` on Windows)
2. Look at your browser - the title should change automatically!
3. No need to refresh the page - this is "hot reload" in action

**🎉 Congratulations!** You just made your first frontend change!

## 🚨 Troubleshooting Common Issues

### "npm: command not found"
- Node.js isn't installed properly
- Try installing Node.js again from [nodejs.org](https://nodejs.org)
- Restart your terminal

### "Port 5173 is already in use"
- Another development server is running
- Stop it with `Ctrl+C` in any terminal running `npm run dev`
- Or use a different port: `npm run dev -- --port 3000`

### "Cannot find module" errors
- Dependencies aren't installed properly
- Run `npm install` again
- Delete `node_modules` folder and `package-lock.json`, then `npm install`

### Browser shows "This site can't be reached"
- Make sure the development server is running (`npm run dev`)
- Check the exact URL: `http://localhost:5173`
- Try `http://127.0.0.1:5173` instead

### Page looks broken or unstyled
- Tailwind CSS might not be loading
- Check terminal for any error messages
- Try stopping (`Ctrl+C`) and restarting (`npm run dev`)

## 📚 What's Next?

Now that you have the project running:

1. **Read the next tutorial**: `02-understanding-sveltekit.md` to learn how SvelteKit works
2. **Explore the code**: Look around the project files to get familiar
3. **Make more changes**: Try changing colors, text, or layout
4. **Don't be afraid to break things**: You can always restore with git!

## 🆘 Getting Help

If you get stuck:

1. **Check the terminal**: Error messages often tell you what's wrong
2. **Look at the troubleshooting section above**
3. **Read the next tutorials**: They explain more about how everything works
4. **Ask for help**: Describe what you tried and what error you're seeing

## 💡 Key Takeaways

- `npm run dev` starts your development server
- Changes save automatically and update in the browser
- The main page code is in `src/routes/+page.svelte`
- Terminal messages help you understand what's happening
- It's normal to encounter errors when learning - they're learning opportunities!

**Ready for the next step?** Continue with `02-understanding-sveltekit.md` to learn how this all works under the hood!