
## Make Average Stats Boxes Fit in One Row

### Overview
Shrink the average stats boxes (Avg Calories, Protein, Carbs, Fat) so all 4 fit in a single row on mobile, instead of the current 2x2 grid.

---

### Changes

**File: `src/pages/Trends.tsx`**

#### 1. Change grid to always be 4 columns (line 159)

Current:
```tsx
<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
```

New:
```tsx
<div className="grid grid-cols-4 gap-2">
```

#### 2. Reduce padding and font sizes in CardContent (lines 162-168)

Current:
```tsx
<CardContent className="p-4">
  <p className="text-title">
    {averages[key as keyof typeof averages]}
  </p>
  <p className="text-muted-foreground">
    Avg {label.split(' ')[0]}
  </p>
</CardContent>
```

New:
```tsx
<CardContent className="p-2">
  <p className="text-base font-semibold">
    {averages[key as keyof typeof averages]}
  </p>
  <p className="text-[10px] text-muted-foreground">
    Avg {label.split(' ')[0]}
  </p>
</CardContent>
```

---

### Summary of Sizing Changes

| Element | Before | After |
|---------|--------|-------|
| Grid columns | `grid-cols-2 sm:grid-cols-4` | `grid-cols-4` |
| Gap | `gap-3` | `gap-2` |
| Card padding | `p-4` | `p-2` |
| Number font | `text-title` (large) | `text-base font-semibold` |
| Label font | default | `text-[10px]` |

---

### Result
- All 4 average stats boxes fit in one horizontal row on mobile
- Compact appearance that takes up less vertical space
- Consistent with the app's high-density, mobile-first design aesthetic
