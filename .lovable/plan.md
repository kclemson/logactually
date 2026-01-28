

## Unbold and Shrink Calendar Calorie Count

### Problem
The calorie count in calendar cells uses `text-sm font-medium` (14px, weight 500), causing 4-digit values with "cal" suffix to wrap onto two lines.

### Solution
- Remove `font-medium` to use normal weight (400)
- Change `text-sm` (14px) to `text-xs` (12px)

### Change

**File:** `src/pages/History.tsx` (line 196)

```tsx
// Before
"text-sm font-medium",

// After
"text-xs",
```

### Result
- "1,292 cal" will fit on one line
- Lighter weight reduces visual competition with day numbers
- Still readable at 12px for short numeric text

### Files Summary

| File | Action |
|------|--------|
| `src/pages/History.tsx` | Modify line 196 - change `text-sm font-medium` to `text-xs` |

