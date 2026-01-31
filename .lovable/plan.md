
## What’s happening (root cause)

- The `/~oauth/initiate` endpoint on your custom domain is **actually working** (it redirects to Google correctly). I verified this by fetching `https://logactually.com/~oauth/initiate?...` and receiving Google’s sign-in page response.
- The reason you’re **seeing your app’s 404 page immediately** is that your **PWA Service Worker (from `vite-plugin-pwa`) is intercepting navigations** and serving the app shell (`index.html`).  
  - When the browser navigates to `/~oauth/initiate?...`, the service worker treats it like an SPA navigation and responds with the cached app shell.
  - React Router then sees `/~oauth/initiate` as an unknown route and renders `NotFound`, which looks like “the old custom 404”.

This is why it “returns instantly” and never reaches Google in the browser, even though the endpoint is reachable.

## Goal

Ensure **all `/~oauth/*` requests bypass the PWA navigation fallback**, so the browser actually hits the real `/~oauth/initiate` and `/~oauth/callback` endpoints and completes the OAuth redirect.

## Implementation plan (code changes)

### 1) Update the PWA Workbox navigation fallback settings
**File:** `vite.config.ts`

Add a Workbox config to denylist the OAuth routes from SPA navigation fallback:

- Add:
  - `workbox.navigateFallbackDenylist: [/^\/~oauth\//]`
- Also add (recommended for reliable update behavior):
  - `workbox.clientsClaim: true`
  - `workbox.skipWaiting: true`

Example shape:

```ts
VitePWA({
  registerType: "autoUpdate",
  includeAssets: ["favicon.png"],
  manifest: { ... },
  workbox: {
    navigateFallbackDenylist: [/^\/~oauth\//],
    clientsClaim: true,
    skipWaiting: true,
  },
})
```

Why this works:
- The service worker will **stop serving `index.html`** for `/~oauth/*`.
- Those requests will go to the network and the platform’s OAuth endpoints can redirect to Google as intended.

### 2) (Optional but useful) Add a second denylist entry for future-proofing
If we want to be extra safe, also denylist other reserved backend-ish paths if you ever add them (not required right now). For now, keep it focused on `/~oauth/` only.

## Rollout / “why it still might look stuck” (post-deploy steps)

Even after the fix is published, a previously-installed service worker can keep controlling the page until it updates. `autoUpdate` will help, but for the first verification I recommend:

1. In Chrome DevTools → **Application** → **Service Workers**
   - Click **Unregister**
2. DevTools → **Application** → **Storage**
   - Click **Clear site data**
3. Reload `https://logactually.com/auth?oauth=1` and click “Continue with Google” again.

This should immediately stop the “app 404” behavior.

## Verification checklist

After applying the code change and publishing:

1. On `https://logactually.com/auth?oauth=1`, click **Continue with Google**
   - Expected: you are redirected to `accounts.google.com` (or Google sign-in UI)
   - Not expected: your app’s 404 page
2. Complete the Google sign-in flow
   - Expected: returns to `https://logactually.com/~oauth/callback` briefly, then into the app with an active session
3. Confirm it still works in preview/iframe contexts
   - Expected: popup-based flow continues to function (library uses web_message in iframe)

## Notes on Google “branding not being shown” / Verification Center

That warning is typically about what Google displays on the consent screen and whether your app needs additional verification for certain scopes. It would not cause an immediate in-app 404 at `/~oauth/initiate`. The 404 symptom matches the service worker SPA fallback issue described above, so we should fix that first before chasing Google console warnings.

## Files to change

- `vite.config.ts` (add Workbox navigation denylist for `/~oauth/`)

