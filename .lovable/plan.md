

## Add Pull-to-Refresh for PWA

### Overview

Add a pull-to-refresh gesture that triggers a page data refresh, providing a native-like experience when using the app as an installed PWA on iPhone.

---

### How It Works

When you're at the top of the page and drag down, a refresh indicator appears. Releasing triggers a data refetch for the current page.

```text
     ↓ Pull down
┌─────────────────────┐
│    ↻ Refreshing...  │  ← Indicator appears
├─────────────────────┤
│                     │
│   [Page content]    │
│                     │
└─────────────────────┘
```

---

### Implementation

**1. Create a reusable PullToRefresh component**

A wrapper component that:
- Listens for touch events (touchstart, touchmove, touchend)
- Only activates when page is scrolled to top (window.scrollY === 0)
- Shows a visual indicator during pull (spinner icon with progress)
- Calls the provided `onRefresh` callback when released past threshold
- Works only on mobile/touch devices (no effect on desktop)

**2. Integrate into Layout**

Wrap the main content area with the PullToRefresh component, connected to React Query's global invalidation:

```typescript
// In Layout.tsx
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

const handleRefresh = async () => {
  await queryClient.invalidateQueries();
};

return (
  <PullToRefresh onRefresh={handleRefresh}>
    <main>...</main>
  </PullToRefresh>
);
```

**3. Visual feedback**

- Show a rotating refresh icon (Lucide's `RefreshCw`)
- Subtle animation as user pulls down
- "Refreshing..." state while data loads

---

### Technical Details

**Touch gesture logic:**
- Track `touchstart` Y position
- On `touchmove`, calculate delta and show indicator proportionally
- Only activate when `window.scrollY === 0` (at page top)
- Release threshold: ~60px pull distance
- Prevent default scroll bounce on iOS during pull

**Mobile-only:**
- Use `useIsMobile()` hook to enable only on touch devices
- Desktop users unaffected (no visual changes)

**Query invalidation:**
- `queryClient.invalidateQueries()` refetches all active queries
- This refreshes food entries, weight entries, saved meals, etc.

---

### Files to Create/Modify

| File | Change |
|------|--------|
| `src/components/PullToRefresh.tsx` | New component handling touch gestures and refresh indicator |
| `src/components/Layout.tsx` | Wrap main content with PullToRefresh, wire up queryClient |

---

### Edge Cases Handled

1. **Scroll position**: Only triggers when at the very top of the page
2. **Nested scrolling**: Won't interfere with scrollable components within the page
3. **Rapid pulls**: Debounced to prevent multiple simultaneous refreshes
4. **iOS bounce**: Prevents the native iOS overscroll bounce during pull gesture

