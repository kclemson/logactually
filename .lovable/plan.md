

## Change Calorie Chart Color to Brighter Blue (Hex)

### Summary

Update the calorie chart color from dark blue to the brighter Tailwind blue-600 equivalent, using hex notation for easier hand-editing.

### Color Change

| Before | After |
|--------|-------|
| `#0033CC` | `#2563EB` (Tailwind blue-600) |

### Changes to `src/pages/Trends.tsx`

**1. Update CHART_COLORS.calories constant (line 24)**

```tsx
calories: "#2563EB",  // Was: "#0033CC"
```

**2. Update tooltip fallback color (line 76)**

```tsx
style={{ color: totalColor || '#2563EB' }}
```

This matches the default Tailwind `blue-600` which is close to what's used in the date navigation (`text-blue-600 dark:text-blue-400`).

