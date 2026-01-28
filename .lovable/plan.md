

## Enable Weight Tracking for Admin Accounts

Allow admin users to access the weight tracking feature in production, without requiring dev mode.

---

### Overview

| File | Action | Purpose |
|------|--------|---------|
| `src/components/BottomNav.tsx` | **Modify** | Show "Log Weights" nav item for admins OR dev mode |
| `src/App.tsx` | **Modify** | Always register `/weights` route (access controlled at page level) |
| `src/pages/WeightLog.tsx` | **Modify** | Add access check - redirect non-admins when feature flag is off |

---

### Approach

Follow the same pattern as the Admin page:
- Route is always registered in App.tsx
- Page component handles access control (redirect if not authorized)
- Navigation shows/hides based on access rights

---

### Technical Details

**1. BottomNav.tsx**

Change `showWeights` to include admin check:

```tsx
const showWeights = FEATURES.WEIGHT_TRACKING || isAdmin;
```

This shows the nav item if:
- Feature flag is enabled (dev mode), OR
- User is an admin

**2. App.tsx**

Remove the conditional wrapper around the weights route:

```tsx
// Before
{FEATURES.WEIGHT_TRACKING && (
  <Route path="/weights" element={<WeightLog />} />
)}

// After
<Route path="/weights" element={<WeightLog />} />
```

This ensures the route exists for admins even when the feature flag is off.

**3. WeightLog.tsx**

Add access control at the top of the component (similar to Admin.tsx pattern):

```tsx
import { Navigate } from "react-router-dom";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { FEATURES } from "@/lib/feature-flags";

export default function WeightLog() {
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  
  // ... existing hooks ...

  // Access check: allow if feature flag is on OR user is admin
  if (!FEATURES.WEIGHT_TRACKING && !isAdminLoading && !isAdmin) {
    return <Navigate to="/" replace />;
  }
  
  // Show nothing while checking admin status (prevents flash)
  if (!FEATURES.WEIGHT_TRACKING && isAdminLoading) {
    return null;
  }

  // ... rest of component ...
}
```

---

### Files Summary

| File | Changes |
|------|---------|
| `src/components/BottomNav.tsx` | Update `showWeights` to `FEATURES.WEIGHT_TRACKING \|\| isAdmin` |
| `src/App.tsx` | Remove conditional wrapper from `/weights` route |
| `src/pages/WeightLog.tsx` | Add `useIsAdmin` check, redirect non-admins when flag is off |

