

## Remove Theme Sync useEffect

The `useEffect` on lines 57-62 in `Settings.tsx` is unnecessary and causes the flicker. It should be removed entirely.

---

### Why It Exists (And Shouldn't)

It was likely added to sync the database theme preference to `next-themes`, but:
- `next-themes` already persists to localStorage automatically
- `handleThemeChange` already saves to BOTH localStorage (via `setTheme`) AND database (via `updateSettings`)
- This useEffect creates a race condition: localStorage applies instantly, then DB overwrites it

---

### Changes

**1. Settings.tsx - Delete the problematic useEffect**

Remove lines 57-62:
```tsx
// Sync theme from database on load  ← DELETE THIS BLOCK
useEffect(() => {
  if (!isLoading && settings.theme && mounted) {
    setTheme(settings.theme);
  }
}, [isLoading, settings.theme, setTheme, mounted]);
```

**2. Layout.tsx - Add one-time sync for new devices**

This handles the case where a user logs in on a new device (empty localStorage):

```tsx
import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useUserSettings } from '@/hooks/useUserSettings';

export function Layout() {
  const { data: isAdmin } = useIsAdmin();
  const { settings, isLoading } = useUserSettings();
  const { setTheme } = useTheme();
  const hasSyncedRef = useRef(false);

  // One-time sync: only if localStorage is empty
  useEffect(() => {
    if (hasSyncedRef.current || isLoading) return;
    
    const storedTheme = localStorage.getItem('theme');
    if (!storedTheme && settings.theme) {
      setTheme(settings.theme);
    }
    hasSyncedRef.current = true;
  }, [isLoading, settings.theme, setTheme]);

  return (
    // ... rest unchanged
  );
}
```

---

### Result

| Scenario | Before | After |
|----------|--------|-------|
| Navigate to Settings | Flickers as DB overwrites localStorage | No flicker |
| Change theme | Works (saves to both) | Works (unchanged) |
| New device login | Theme from DB applied | Theme from DB applied (once) |

