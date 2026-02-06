# Deployment Guide

This guide provides step-by-step instructions for deploying the Budget Tracker application to various hosting platforms.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Building for Production](#building-for-production)
- [Deployment Platforms](#deployment-platforms)
  - [Vercel (Recommended)](#vercel-recommended)
  - [Netlify](#netlify)
  - [GitHub Pages](#github-pages)
  - [Other Static Hosts](#other-static-hosts)
- [Environment Configuration](#environment-configuration)
- [Post-Deployment Checklist](#post-deployment-checklist)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- ✅ Node.js 18.0 or higher installed
- ✅ npm 9.0 or higher installed
- ✅ All dependencies installed (`npm install`)
- ✅ All tests passing (`npm run test`)
- ✅ Code linted and formatted (`npm run lint && npm run format:check`)
- ✅ Production build tested locally (`npm run build && npm run preview`)

## Building for Production

### 1. Create Production Build

```bash
npm run build
```

This command:
- Compiles TypeScript with strict type checking (`tsc -b`)
- Bundles the application using Vite
- Optimizes assets (minification, tree-shaking, code splitting)
- Outputs to the `dist/` directory

### 2. Verify Build Output

Check that the `dist/` directory contains:
- `index.html` - Main HTML file
- `assets/` - Bundled CSS and JavaScript files
- `vite.svg` - Favicon

### 3. Test Production Build Locally

```bash
npm run preview
```

Open `http://localhost:4173` in your browser and verify:
- ✅ Application loads without errors
- ✅ All features work correctly
- ✅ Theme switching persists
- ✅ Transactions can be added/deleted
- ✅ Filters and sorting work
- ✅ Charts display correctly
- ✅ Responsive design works on mobile/tablet/desktop
- ✅ localStorage persistence works

## Deployment Platforms

### Vercel (Recommended)

Vercel provides the best developer experience with automatic deployments, preview URLs, and excellent performance.

#### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   cd budget-tracker
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy: `Y`
   - Which scope: Select your account
   - Link to existing project: `N`
   - Project name: `budget-tracker` (or your preferred name)
   - Directory: `./` (current directory)
   - Override settings: `N`

5. **Deploy to production:**
   ```bash
   vercel --prod
   ```

#### Option 2: Deploy via Vercel Dashboard

1. **Push code to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Import project on Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite settings

3. **Configure project (auto-detected):**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Deploy:**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app will be live at `https://your-project.vercel.app`

#### Vercel Configuration

The included `vercel.json` file provides:
- ✅ Client-side routing support (SPA rewrites)
- ✅ Optimized caching for static assets
- ✅ Automatic framework detection

### Netlify

Netlify is another excellent option with similar features to Vercel.

#### Option 1: Deploy via Netlify CLI

1. **Install Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify:**
   ```bash
   netlify login
   ```

3. **Initialize and deploy:**
   ```bash
   cd budget-tracker
   netlify init
   ```

4. **Follow the prompts:**
   - Create & configure a new site
   - Team: Select your team
   - Site name: `budget-tracker` (or your preferred name)
   - Build command: `npm run build`
   - Directory to deploy: `dist`

5. **Deploy to production:**
   ```bash
   netlify deploy --prod
   ```

#### Option 2: Deploy via Netlify Dashboard

1. **Push code to GitHub** (same as Vercel)

2. **Import project on Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select your repository

3. **Configure build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18`

4. **Deploy:**
   - Click "Deploy site"
   - Your app will be live at `https://your-site.netlify.app`

#### Netlify Configuration

The included `netlify.toml` file provides:
- ✅ Client-side routing support
- ✅ Optimized caching for static assets
- ✅ Security headers
- ✅ Asset optimization (CSS/JS minification, image compression)

### GitHub Pages

GitHub Pages is a free option for hosting static sites directly from your repository.

#### Setup Instructions

1. **Install gh-pages package:**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Update package.json:**
   
   Add the following to your `package.json`:
   ```json
   {
     "homepage": "https://<username>.github.io/<repository-name>",
     "scripts": {
       "predeploy": "npm run build",
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. **Update vite.config.ts:**
   
   Add base path configuration:
   ```typescript
   export default defineConfig({
     base: '/<repository-name>/',
     // ... rest of config
   })
   ```

4. **Deploy:**
   ```bash
   npm run deploy
   ```

5. **Enable GitHub Pages:**
   - Go to your repository settings
   - Navigate to "Pages"
   - Source: Deploy from a branch
   - Branch: `gh-pages` / `root`
   - Save

Your app will be live at `https://<username>.github.io/<repository-name>`

**Note:** GitHub Pages requires the `base` path configuration in Vite, which may affect local development. Consider using environment variables to conditionally set the base path.

### Other Static Hosts

The Budget Tracker can be deployed to any static hosting service that supports single-page applications:

#### Cloudflare Pages

1. Connect your GitHub repository
2. Build command: `npm run build`
3. Build output directory: `dist`
4. Add redirect rule for SPA: `/* /index.html 200`

#### Firebase Hosting

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Initialize: `firebase init hosting`
3. Public directory: `dist`
4. Configure as single-page app: `Yes`
5. Deploy: `firebase deploy`

#### AWS S3 + CloudFront

1. Build the application: `npm run build`
2. Upload `dist/` contents to S3 bucket
3. Enable static website hosting
4. Configure CloudFront distribution
5. Set up error page redirect to `index.html` for SPA routing

#### Render

1. Connect your GitHub repository
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add rewrite rule: `/* /index.html 200`

## Environment Configuration

### Base URL Configuration

If deploying to a subdirectory (e.g., GitHub Pages), update `vite.config.ts`:

```typescript
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/your-subdirectory/' : '/',
  // ... rest of config
})
```

### Build Optimization

The default Vite configuration is already optimized for production:

- ✅ Code minification
- ✅ Tree shaking
- ✅ Code splitting
- ✅ Asset optimization
- ✅ Source maps (for debugging)

To further optimize, you can:

1. **Analyze bundle size:**
   ```bash
   npm run build -- --mode analyze
   ```

2. **Disable source maps** (reduces bundle size):
   ```typescript
   // vite.config.ts
   export default defineConfig({
     build: {
       sourcemap: false
     }
   })
   ```

3. **Adjust chunk size warnings:**
   ```typescript
   // vite.config.ts
   export default defineConfig({
     build: {
       chunkSizeWarningLimit: 1000
     }
   })
   ```

## Post-Deployment Checklist

After deploying, verify the following:

### Functionality
- [ ] Application loads without errors
- [ ] All pages are accessible (Dashboard, Transactions, Budget Goals, Settings)
- [ ] Navigation works correctly
- [ ] Theme toggle works and persists
- [ ] Transactions can be added successfully
- [ ] Transactions can be deleted with confirmation
- [ ] Filters work correctly (type, category, date range)
- [ ] Sorting works correctly (date, amount, asc/desc)
- [ ] Charts display correctly
- [ ] Budget goals can be set and display progress
- [ ] Clear all data works with confirmation
- [ ] localStorage persistence works across page reloads

### Performance
- [ ] Initial page load is fast (< 3 seconds)
- [ ] No console errors or warnings
- [ ] Assets are cached properly
- [ ] Images and icons load correctly

### Responsive Design
- [ ] Mobile view (320px - 767px) works correctly
- [ ] Tablet view (768px - 1023px) works correctly
- [ ] Desktop view (1024px+) works correctly
- [ ] Touch interactions work on mobile devices
- [ ] Hamburger menu works on mobile

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] Color contrast is sufficient
- [ ] ARIA labels are present
- [ ] Focus indicators are visible

### SEO & Meta Tags
- [ ] Page title is set correctly
- [ ] Meta description is present
- [ ] Favicon displays correctly
- [ ] Open Graph tags (optional)

## Troubleshooting

### Issue: Blank page after deployment

**Cause:** Incorrect base path or routing configuration

**Solution:**
1. Check browser console for errors
2. Verify `base` path in `vite.config.ts` matches deployment URL
3. Ensure SPA redirect rules are configured on hosting platform
4. Check that `dist/index.html` exists and is accessible

### Issue: 404 errors on page refresh

**Cause:** Server not configured for SPA routing

**Solution:**
- **Vercel:** Ensure `vercel.json` has rewrite rules (already included)
- **Netlify:** Ensure `netlify.toml` has redirect rules (already included)
- **GitHub Pages:** Configure as single-page app during setup
- **Other hosts:** Add redirect rule: `/* /index.html 200`

### Issue: Assets not loading (404 errors)

**Cause:** Incorrect asset paths

**Solution:**
1. Check `base` path in `vite.config.ts`
2. Verify assets are in `dist/assets/` directory
3. Check browser network tab for failed requests
4. Ensure asset paths are relative, not absolute

### Issue: localStorage not working

**Cause:** Browser privacy settings or third-party cookies blocked

**Solution:**
1. This is expected behavior in some browsers with strict privacy settings
2. Inform users to enable localStorage/cookies for your domain
3. Consider adding a fallback message for users with localStorage disabled

### Issue: Build fails with TypeScript errors

**Cause:** Type errors in code

**Solution:**
1. Run `npm run lint` locally to identify errors
2. Fix all TypeScript errors before deploying
3. Ensure all dependencies are installed
4. Check that TypeScript version matches project requirements

### Issue: Large bundle size

**Cause:** Unnecessary dependencies or large assets

**Solution:**
1. Analyze bundle: `npm run build -- --mode analyze`
2. Remove unused dependencies
3. Use dynamic imports for large components
4. Optimize images and assets
5. Consider code splitting

### Issue: Slow initial load

**Cause:** Large bundle or unoptimized assets

**Solution:**
1. Enable asset compression on hosting platform
2. Use CDN for static assets
3. Implement lazy loading for routes
4. Optimize images (use WebP format)
5. Enable HTTP/2 on hosting platform

## Additional Resources

### Documentation
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)

### Performance Tools
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Performance auditing
- [WebPageTest](https://www.webpagetest.org/) - Performance testing
- [Bundle Analyzer](https://www.npmjs.com/package/rollup-plugin-visualizer) - Bundle size analysis

### Monitoring
- [Vercel Analytics](https://vercel.com/analytics) - Real user monitoring
- [Google Analytics](https://analytics.google.com/) - User analytics
- [Sentry](https://sentry.io/) - Error tracking

## Support

For issues or questions:
1. Check the [Troubleshooting](#troubleshooting) section
2. Review the [README.md](./README.md) for general usage
3. Check the spec files in `.kiro/specs/budget-tracker/`

---

**Happy Deploying! 🚀**
