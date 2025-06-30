# GitHub Pages Deployment Guide for Vite React Apps

This guide explains how to properly set up and deploy a Vite React application to GitHub Pages, covering both simple single-page applications and applications with client-side routing.

## Table of Contents
1. [Project Setup](#project-setup)
2. [GitHub Pages Configuration](#github-pages-configuration)
3. [GitHub Actions Workflow](#github-actions-workflow)
4. [Routing Options](#routing-options)
5. [Troubleshooting](#troubleshooting)

## Project Setup

### 1. Initialize Your Vite React Project

```bash
# Create new Vite React project
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install

# Or with Bun
bun create vite my-app --template react-ts
cd my-app
bun install
```

### 2. Configure Vite for GitHub Pages

Update your `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  // IMPORTANT: Set base path for GitHub Pages
  // Replace 'your-repo-name' with your actual repository name
  base: process.env.NODE_ENV === 'production' ? '/your-repo-name/' : '/',

  server: {
    host: "::",
    port: 8080,
  },

  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
```

### 3. Update Package.json Scripts

Ensure your `package.json` has the correct build script:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

## GitHub Pages Configuration

### 1. Repository Settings

1. Go to your GitHub repository
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions**
4. This allows custom workflows to deploy to Pages

### 2. Enable GitHub Pages

Make sure GitHub Pages is enabled for your repository and set to deploy from GitHub Actions.

## GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
# Build and Deploy Vite React App to GitHub Pages
name: Deploy Vite App to Pages

on:
  # Runs on pushes targeting the default branch
  push:
    branches: ["main"]

  # Allows you to run this workflow manually from the Actions tab
  workflow_dispatch:

# Sets permissions of the GITHUB_TOKEN to allow deployment to GitHub Pages
permissions:
  contents: read
  pages: write
  id-token: write

# Allow only one concurrent deployment, skipping runs queued between the run in-progress and latest queued.
# However, do NOT cancel in-progress runs as we want to allow these production deployments to complete.
concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  # Build job
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      # Choose your package manager (npm, yarn, pnpm, or bun)
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      # Alternative: Setup Bun (if using Bun)
      # - name: Setup Bun
      #   uses: oven-sh/setup-bun@v1
      #   with:
      #     bun-version: latest

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Install dependencies
        run: npm ci
        # Or: run: bun install

      - name: Build
        run: npm run build
        # Or: run: bun run build
        env:
          NODE_ENV: production

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  # Deployment job
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

## Routing Options

### ⭐ Recommended: Simple Single-Page Application (No Routing)

**This is the recommended approach for GitHub Pages deployment.** Based on real-world experience, removing routing entirely is often the most reliable solution for GitHub Pages deployment. Many routing configurations that work locally can fail in production on GitHub Pages.

If your app doesn't need multiple routes, keep it simple and avoid routing complications:

**App.tsx:**
```typescript
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Index from "./pages/Index";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Index />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
```

### 🔧 How to Remove Existing Routing (Recommended Fix)

If you have an existing project with React Router that's not working on GitHub Pages, here's how to remove it:

#### Step 1: Remove React Router Dependency
```bash
npm uninstall react-router-dom
# Or: bun remove react-router-dom
```

#### Step 2: Simplify App.tsx
Remove all routing imports and components:

```typescript
// Before (with routing)
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

// After (no routing)
import Index from "./pages/Index";
```

Update your App component to render only the main page:

```typescript
// Before
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

// After
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Index />
    </TooltipProvider>
  </QueryClientProvider>
);
```

#### Step 3: Clean Up Files
- Remove any 404.html file from the public directory
- Remove routing-related scripts from index.html
- Delete unused page components (About, NotFound, etc.)
- Remove any Link components and replace with regular buttons or sections

#### Step 4: Consolidate Content
Move content from multiple pages into your main Index component, using:
- Conditional rendering based on state
- Tabs or accordion components
- Modal dialogs
- Scrollable sections

### ⚠️ Advanced: React Router with GitHub Pages Support (Not Recommended)

**Warning: This approach is complex and often problematic.** Only use this if you absolutely need client-side routing and cannot redesign your app as a single page. The simple no-routing approach above is strongly recommended instead.

If you must use client-side routing, you'll need to handle GitHub Pages' static file serving with additional configuration:

#### Step 1: Install React Router
```bash
npm install react-router-dom
# Or: bun add react-router-dom
```

#### Step 2: Create 404.html for GitHub Pages
Create `public/404.html`:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Your App Name</title>
    <script type="text/javascript">
      // Single Page Apps for GitHub Pages
      // MIT License
      // https://github.com/rafgraph/spa-github-pages

      // If you're creating a Project Pages site and NOT using a custom domain,
      // then set pathSegmentsToKeep to 1 (enterprise users may need to set it to > 1).
      // This way the code will only replace the route part and not the real directory.
      var pathSegmentsToKeep = 1;

      var l = window.location;
      l.replace(
        l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
        l.pathname.split('/').slice(0, 1 + pathSegmentsToKeep).join('/') + '/?/' +
        l.pathname.slice(1).split('/').slice(pathSegmentsToKeep).join('/').replace(/&/g, '~and~') +
        (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
        l.hash
      );
    </script>
  </head>
  <body>
  </body>
</html>
```

#### Step 3: Add URL Restoration Script to index.html
Add this script to your `index.html` before the main script tag:

```html
<!-- Start Single Page Apps for GitHub Pages -->
<script type="text/javascript">
  // Single Page Apps for GitHub Pages
  // MIT License
  // https://github.com/rafgraph/spa-github-pages
  (function(l) {
    if (l.search[1] === '/' ) {
      var decoded = l.search.slice(1).split('&').map(function(s) { 
        return s.replace(/~and~/g, '&')
      }).join('?');
      window.history.replaceState(null, null,
          l.pathname.slice(0, -1) + decoded + l.hash
      );
    }
  }(window.location))
</script>
<!-- End Single Page Apps for GitHub Pages -->
```

#### Step 4: Configure React Router
**App.tsx with routing:**
```typescript
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
```

## Troubleshooting

### Common Issues and Solutions

#### 1. 404 Error on GitHub Pages
**Problem:** Your app shows a GitHub 404 page instead of your application.

**Primary Solution (Recommended):**
- **Remove routing entirely** - This is the most reliable fix. Follow the "How to Remove Existing Routing" section above.

**Alternative Solutions (if you must keep routing):**
- Ensure the `base` path in `vite.config.ts` matches your repository name
- For routing apps, make sure you have the 404.html file and URL restoration script
- Check that GitHub Pages is enabled and set to deploy from GitHub Actions

#### 2. Assets Not Loading
**Problem:** CSS, JS, or image files return 404 errors.

**Solution:** 
- Verify the `base` configuration in `vite.config.ts`
- Make sure the base path includes the repository name: `/your-repo-name/`

#### 3. Routing Not Working
**Problem:** Direct navigation to routes (e.g., `/about`) shows 404.

**Primary Solution (Recommended):**
- **Remove routing entirely** - This eliminates the problem completely. Follow the "How to Remove Existing Routing" section above.

**Alternative Solutions (complex and often problematic):**
- Implement the 404.html redirect solution (Advanced option above)
- Consider using HashRouter instead of BrowserRouter for simpler setup
- Note: These routing solutions often fail in production even when they work locally

#### 4. Build Fails in GitHub Actions
**Problem:** The build step fails in the workflow.

**Solutions:**
- Check that all dependencies are properly listed in `package.json`
- Ensure the build command is correct (`npm run build` or `bun run build`)
- Verify Node.js version compatibility

#### 5. Permissions Error
**Problem:** GitHub Actions can't deploy to Pages.

**Solution:**
- Ensure the workflow has the correct permissions (see workflow example above)
- Check that GitHub Pages is configured to deploy from GitHub Actions

### Testing Your Setup

1. **Local Testing:**
   ```bash
   npm run build
   npm run preview
   # Or with Bun:
   bun run build
   bun run preview
   ```

2. **Production Testing:**
   - Push your changes to the main branch
   - Check the Actions tab for workflow status
   - Visit `https://yourusername.github.io/your-repo-name/`

## Quick Checklist

Before deploying, ensure:

- [ ] `vite.config.ts` has correct `base` path
- [ ] GitHub Pages is enabled and set to GitHub Actions
- [ ] Workflow file is in `.github/workflows/deploy.yml`
- [ ] Repository name matches the base path
- [ ] All dependencies are in `package.json`
- [ ] Build command works locally
- [ ] **Recommended:** No routing used (single-page application)
- [ ] If you chose the complex routing option: 404.html and URL restoration script are in place

## Example Repository Structure

**Recommended Structure (No Routing):**
```
your-repo/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── public/
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── components/
│   ├── pages/
│   │   └── Index.tsx (main page)
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── vite.config.ts
└── README.md
```

**Complex Structure (Only if using routing):**
```
your-repo/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── public/
│   ├── favicon.ico
│   └── 404.html (required for routing)
├── src/
│   ├── components/
│   ├── pages/
│   │   ├── Index.tsx
│   │   ├── About.tsx
│   │   └── NotFound.tsx
│   ├── App.tsx
│   └── main.tsx
├── index.html (with routing scripts)
├── package.json
├── vite.config.ts
└── README.md
```

This guide should help you successfully deploy any Vite React application to GitHub Pages!
