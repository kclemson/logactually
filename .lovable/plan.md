

## Enable Weight Tracking UI for Admins Across All Pages

The previous change only enabled the WeightLog page and nav item for admins. Several other pages still check `FEATURES.WEIGHT_TRACKING` directly without considering admin status.

---

### Problem

Three additional locations still gate weight-related UI behind only the feature flag:

| Location | Issue |
|----------|-------|
| `History.tsx` | Weight query disabled; dumbbell icon hidden |
| `Trends.tsx` | Weight Trends section not rendered |
| `Settings.tsx` | Saved Routines section not rendered |

---

### Solution

Add `useIsAdmin` hook to each page and update conditionals to: `FEATURES.WEIGHT_TRACKING || isAdmin`

---

### Changes

**1. History.tsx**

Add admin check for the weight entries query and dumbbell display:

```tsx
import { useIsAdmin } from '@/hooks/useIsAdmin';

const History = () => {
  const { data: isAdmin } = useIsAdmin();
  const showWeights = FEATURES.WEIGHT_TRACKING || isAdmin;
  
  // ...
  
  // Line 95: Update query enabled condition
  const { data: weightSummaries = [] } = useQuery({
    // ...
    enabled: showWeights,  // Was: FEATURES.WEIGHT_TRACKING
  });
  
  // Line 176: Update hasWeights check
  const hasWeights = showWeights && !!weightByDate.get(dateStr);  // Was: FEATURES.WEIGHT_TRACKING && ...
```

**2. Trends.tsx**

Add admin check for the Weight Trends section:

```tsx
import { useIsAdmin } from '@/hooks/useIsAdmin';

const Trends = () => {
  const { data: isAdmin } = useIsAdmin();
  const showWeights = FEATURES.WEIGHT_TRACKING || isAdmin;
  
  // ...
  
  // Line 332: Update conditional render
  {showWeights && (  // Was: FEATURES.WEIGHT_TRACKING &&
    <CollapsibleSection title="Weight Trends" ...>
```

**3. Settings.tsx**

Add admin check for the Saved Routines section:

```tsx
import { useIsAdmin } from '@/hooks/useIsAdmin';

export default function Settings() {
  const { data: isAdmin } = useIsAdmin();
  const showWeights = FEATURES.WEIGHT_TRACKING || isAdmin;
  
  // ...
  
  // Line 197: Update conditional render
  {showWeights && (  // Was: FEATURES.WEIGHT_TRACKING &&
    <CollapsibleSection title="Saved Routines" ...>
```

---

### Pattern

All files follow the same pattern:
1. Import `useIsAdmin` hook
2. Create `showWeights` variable: `FEATURES.WEIGHT_TRACKING || isAdmin`
3. Replace direct `FEATURES.WEIGHT_TRACKING` checks with `showWeights`

---

### Files Summary

| File | Changes |
|------|---------|
| `src/pages/History.tsx` | Add hook, update query `enabled` and `hasWeights` check |
| `src/pages/Trends.tsx` | Add hook, update Weight Trends section conditional |
| `src/pages/Settings.tsx` | Add hook, update Saved Routines section conditional |

