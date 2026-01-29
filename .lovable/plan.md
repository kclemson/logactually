

## Shorten Navigation Labels

### Overview

Update the bottom navigation labels to be more concise so they fit comfortably on one row, especially on narrow mobile screens.

---

### Changes

**File:** `src/components/BottomNav.tsx`

| Current Label | New Label |
|---------------|-----------|
| Log Food | Food |
| Log Weights | Weights |

---

### Code Change

Lines 12-13 in the `navItems` array:

```typescript
// Before
{ to: '/', icon: Utensils, label: 'Log Food' },
...(showWeights ? [{ to: '/weights', icon: Dumbbell, label: 'Log Weights' }] : []),

// After  
{ to: '/', icon: Utensils, label: 'Food' },
...(showWeights ? [{ to: '/weights', icon: Dumbbell, label: 'Weights' }] : []),
```

---

### Summary

- 1 file modified
- 2 strings changed
- No functional changes

