

# Persist "welcome to demo" dismissal in localStorage

## What changes

In `src/contexts/ReadOnlyContext.tsx`, replace the in-memory `useRef` guard with a `localStorage` check so the welcome overlay only ever shows once per device.

## Technical details

**File: `src/contexts/ReadOnlyContext.tsx`**

- Remove `hasSeenWelcomeRef`
- On mount (when `isReadOnly` is true and not loading), check `localStorage.getItem('demo-welcome-seen')`
- If not set, show the welcome overlay and write `localStorage.setItem('demo-welcome-seen', 'true')` when it appears
- If already set, skip showing the overlay entirely
- The "blocked" overlay (triggered by write attempts) remains unaffected

```ts
// Before (resets every reload):
const hasSeenWelcomeRef = useRef(false);
useEffect(() => {
  if (!isLoading && isReadOnly && !hasSeenWelcomeRef.current) { ... }
}, [isLoading, isReadOnly]);

// After (persists across reloads):
useEffect(() => {
  if (!isLoading && isReadOnly && !localStorage.getItem('demo-welcome-seen')) {
    const timer = setTimeout(() => {
      setOverlayMode('welcome');
      setShowOverlay(true);
      localStorage.setItem('demo-welcome-seen', 'true');
    }, 500);
    return () => clearTimeout(timer);
  }
}, [isLoading, isReadOnly]);
```

No other files need changes.
