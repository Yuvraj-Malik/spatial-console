# Spatial Console Deployment Guide

This guide prepares Spatial Console for:
- Frontend on Netlify: `https://yuvrajm.dev`
- Backend on Render: `https://spatial-console.yuvrajm.dev`

## 1) Frontend on Netlify

### Netlify build settings
- Build command: `npm run build`
- Publish directory: `dist`
- Node version: `20` (already set in `netlify.toml`)

### Environment variables in Netlify
Set these in Netlify Site settings -> Environment variables:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_APP_URL=https://yuvrajm.dev`
- `VITE_API_BASE_URL=https://spatial-console.yuvrajm.dev`

### Domain setup (Netlify)
Attach custom domain in Netlify:
- Primary: `yuvrajm.dev`
- Optional redirect alias: `www.yuvrajm.dev` -> `yuvrajm.dev`

## 2) Backend on Render

Create your backend service in Render (Web Service), then attach custom domain:
- `spatial-console.yuvrajm.dev`

### Backend CORS requirements
Allow these origins:
- `https://yuvrajm.dev`
- `https://www.yuvrajm.dev`
- `https://<your-netlify-site>.netlify.app` (optional staging)

If you use cookies/session auth:
- `Access-Control-Allow-Credentials: true`
- `SameSite=None; Secure`

## 3) DNS configuration for yuvrajm.dev

Configure DNS at your registrar:

- Apex domain (`yuvrajm.dev`):
  - Use Netlify DNS integration or required Netlify apex records (A/ALIAS) shown in Netlify domain panel.
- `www`:
  - CNAME -> your Netlify subdomain (for example `your-site.netlify.app`)
- `spatial-console`:
  - CNAME -> Render target value shown in Render custom domain screen.

Note: exact target values must be copied from Netlify and Render UI because they are account-specific.

## 4) SPA routing and API proxy

Already configured:
- `public/_redirects` has SPA fallback and `/api/*` proxy to `https://spatial-console.yuvrajm.dev/:splat`
- `netlify.toml` also defines redirects and headers

If both are present, Netlify applies redirect rules. Keeping both makes local artifact and Netlify config explicit.

## 5) Security and caching

Already configured in both `netlify.toml` and `public/_headers`:
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`)
- Aggressive cache for hashed assets under `/assets/*`
- No-cache for `index.html`

## 6) Release checklist

1. Run `npm ci`
2. Run `npm run build`
3. Push to GitHub main branch
4. Verify Netlify deploy succeeds
5. Verify custom domain certificate is active (HTTPS)
6. Test routes:
   - `https://yuvrajm.dev`
   - Any deep route (for SPA fallback)
7. Test API calls through `/api/*`
8. Verify auth/storage behavior with Firebase keys

## 7) Smoke tests after go-live

- Home page loads with no console errors
- Build and walkthrough mode works
- Save/load/share flows work
- Hard refresh on deep route returns app (not 404)
- API calls to backend return expected responses
- HTTPS lock present on both frontend and API subdomain
