# Vercel Deployment Configuration Guide

## ✅ Configuration Status

### 1. **vercel.json - SPA Routing Fixed**
- ✅ Build command specified: `npm run build`
- ✅ Output directory set to: `dist` (Vite default)
- ✅ `/signin` redirect to `/auth` (added at Vercel level)
- ✅ Catch-all rewrite to `index.html` for SPA routes
- ✅ Excludes static files: `_next`, images, `favicon.ico`, `robots.txt`, `sitemap.xml`
- ✅ Proper cache headers for `index.html` (no-cache) and assets (immutable)

### 2. **React Router Configuration - Verified**
Location: `src/App.tsx`
- ✅ `/signin` route redirects to `/auth` using `<Navigate to="/auth" replace />`
- ✅ `BrowserRouter` properly wraps all routes
- ✅ Protected routes handle authentication correctly
- ✅ Catch-all `/*` route to `NotFound` component

### 3. **Vite Configuration - Confirmed**
Location: `vite.config.ts`
- ✅ Proper alias configuration for `@` imports
- ✅ Build output directory is `dist` (default, works with Vercel)

### 4. **How SPA Routes Are Handled**

**Flow for `/signin` access:**
1. Vercel rewrite rule catches the route
2. Serves `index.html` instead of 404
3. React Router loads in browser
4. `<Navigate to="/auth" replace />` redirects to `/auth` (no server round-trip)

**Flow for other routes (e.g., `/chat`, `/settings`):**
1. Vercel rewrite rule catches the route
2. Serves `index.html`
3. React Router renders the appropriate component

## 📋 Pre-Deployment Checklist

- [ ] Verify environment variables are set in Vercel dashboard:
  - [ ] Supabase URL and key
  - [ ] Any API endpoints
  - [ ] Analytics tokens

- [ ] Ensure DNS records point to Vercel for custom domain `chitchatgen.com`:
  - [ ] Add CNAME record: `www.chitchatgen.com` → `cname.vercel.com`
  - [ ] Add A records for root domain (if needed)

- [ ] Redeploy to Vercel after changes:
  ```bash
  npm run build  # Local test
  npm run preview  # Test production build locally
  git push  # Trigger Vercel rebuild
  ```

## 🔍 Testing Routes

After deployment, test these URLs:

```
✅ https://www.chitchatgen.com/auth         → Auth page loads
✅ https://www.chitchatgen.com/signin       → Redirects to /auth
✅ https://www.chitchatgen.com/             → Home page loads
✅ https://www.chitchatgen.com/settings     → Settings page loads
✅ https://www.chitchatgen.com/image        → Image gen page loads
✅ https://www.chitchatgen.com/unknown      → 404 page loads
```

## 🚀 Deployment Steps

1. **Local build test:**
   ```bash
   npm run build
   npm run preview
   ```
   Visit `http://localhost:4173` and test routes including refresh.

2. **Push to Git:**
   ```bash
   git add .
   git commit -m "fix: improve Vercel routing configuration for SPA"
   git push
   ```
   This automatically triggers Vercel rebuild.

3. **Monitor Vercel deployment:**
   - Check deployment logs in Vercel dashboard
   - Look for build success/failure
   - Verify no 404 errors in deployment logs

4. **Test on production:**
   - Test `/signin` → should redirect to `/auth`
   - Test refresh on any SPA route → should load correctly
   - Test custom domain → should work properly

## 📝 Key Points

- **Vercel redirect vs React Router:** 
  - Vercel `/signin` → `/auth` is permanent (307)
  - React Router also has `/signin` → `/auth` for extra safety
  
- **Cache strategy:**
  - `index.html`: No caching (must-revalidate) to get latest SPA
  - Assets in `/assets/`: Long-term caching with 1-year expiry

- **Custom domain:**
  - Ensure DNS is configured correctly for `chitchatgen.com`
  - Vercel will auto-provision SSL certificate

## ⚠️ Troubleshooting

If you still see 404 errors:

1. **Clear Vercel cache:**
   - Delete `.vercel` folder
   - Go to Vercel dashboard → Settings → Git → Ignore Build Cache

2. **Check deployment logs:**
   - Vercel Dashboard → Deployments → Click latest → Logs tab
   - Look for build errors or routing issues

3. **Verify DNS:**
   ```bash
   nslookup chitchatgen.com
   nslookup www.chitchatgen.com
   ```

4. **Test locally first:**
   ```bash
   npm run build
   npm run preview
   # Test /signin, /auth, refresh routes
   ```

## 📚 References

- [Vercel SPA Routing](https://vercel.com/docs/concepts/projects/overview#spa)
- [React Router](https://reactrouter.com/)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)
