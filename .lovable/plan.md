

## Hide DevToolsPanel with `hideAdmin=true` URL Parameter

Apply the same hiding logic used in BottomNav to the DevToolsPanel in Layout.

---

### Current Behavior

- `BottomNav.tsx` checks for `hideAdmin=true` and hides the Admin tab
- `Layout.tsx` renders `DevToolsPanel` based only on `isAdmin` - ignoring the URL parameter

---

### Fix

Update `Layout.tsx` to:
1. Import `useSearchParams` from react-router-dom
2. Check for `hideAdmin=true` parameter
3. Only render `DevToolsPanel` when admin AND not hidden

---

### Code Changes

**`src/components/Layout.tsx`**

```tsx
// Add to imports
import { Outlet, useSearchParams } from 'react-router-dom';

// Inside Layout component, add:
const [searchParams] = useSearchParams();
const hideAdmin = searchParams.get('hideAdmin') === 'true';

// Update render condition (line 61)
{isAdmin && !hideAdmin && <DevToolsPanel />}
```

---

### Files Changed

| File | Change |
|------|--------|
| `src/components/Layout.tsx` | Add `hideAdmin` URL parameter check for DevToolsPanel |

