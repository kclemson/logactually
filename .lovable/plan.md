

## Hide Admin Nav via URL Parameter

### Goal
Add a simple URL parameter (`?hideAdmin=true`) that hides the Admin button in the bottom nav for screenshot purposes.

### Implementation

**File: `src/components/BottomNav.tsx`**

Add one line to read the URL param, and update the `showAdmin` logic:

```tsx
import { NavLink, useSearchParams } from 'react-router-dom';
// ... existing imports

export function BottomNav() {
  const { data: isAdmin } = useIsAdmin();
  const [searchParams] = useSearchParams();
  
  const hideAdmin = searchParams.get('hideAdmin') === 'true';
  const showAdmin = isAdmin && !hideAdmin;
  // ... rest unchanged
}
```

### Usage
- Normal view: `/trends` → Admin button visible (if admin)
- Screenshot mode: `/trends?hideAdmin=true` → Admin button hidden

### That's it
- 2 lines of code change
- No state, no effects, no complexity
- Flickering is fine per your note

