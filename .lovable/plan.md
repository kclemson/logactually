
## Fix: Mobile Tooltip Click Not Working

### Root Cause Analysis

The "Go to day →" button is unclickable due to two issues:

1. **Z-index layering problem**: The click-away overlay (`fixed inset-0 z-10`) covers the entire viewport, but the Recharts tooltip is rendered with positioning that doesn't respect the parent's `z-20`. The tooltip ends up BEHIND the overlay.

2. **Recharts tooltip pointer-events**: By default, Recharts tooltip wrappers may have CSS that interferes with pointer events.

### Solution

**1. Increase tooltip z-index using `wrapperStyle`**

Add `wrapperStyle={{ pointerEvents: 'auto', zIndex: 50 }}` to all `<Tooltip>` components. This ensures:
- The tooltip is above the click-away overlay (`z-10`)
- Pointer events are explicitly enabled

**2. Update all chart Tooltip components**

| File | Components | Change |
|------|------------|--------|
| `src/pages/Trends.tsx` | `ExerciseChart` | Add `wrapperStyle` prop to Tooltip |
| `src/components/trends/FoodChart.tsx` | `FoodChart`, `StackedMacroChart`, `VolumeChart` | Add `wrapperStyle` prop to all Tooltips |

### Code Changes

**src/pages/Trends.tsx - ExerciseChart (around line 299)**

```typescript
<Tooltip
  wrapperStyle={{ pointerEvents: 'auto', zIndex: 50 }}
  active={isMobile ? activeBarIndex !== null : undefined}
  // ... rest of props
/>
```

**src/components/trends/FoodChart.tsx - FoodChart (around line 186)**

```typescript
<Tooltip
  wrapperStyle={{ pointerEvents: 'auto', zIndex: 50 }}
  active={isMobile ? activeBarIndex !== null : undefined}
  // ... rest of props
/>
```

**src/components/trends/FoodChart.tsx - StackedMacroChart (around line 319)**

```typescript
<Tooltip
  wrapperStyle={{ pointerEvents: 'auto', zIndex: 50 }}
  active={isMobile ? activeBarIndex !== null : undefined}
  // ... rest of props
/>
```

**src/components/trends/FoodChart.tsx - VolumeChart (around line 446)**

```typescript
<Tooltip
  wrapperStyle={{ pointerEvents: 'auto', zIndex: 50 }}
  active={isMobile ? activeBarIndex !== null : undefined}
  // ... rest of props
/>
```

### Summary of Changes

| File | Lines | Change |
|------|-------|--------|
| `src/pages/Trends.tsx` | ~299 | Add `wrapperStyle={{ pointerEvents: 'auto', zIndex: 50 }}` to Tooltip |
| `src/components/trends/FoodChart.tsx` | ~186, ~319, ~446 | Add same `wrapperStyle` to all 3 Tooltip components |

### Why This Works

- `zIndex: 50` ensures the tooltip renders above the `z-10` click-away overlay
- `pointerEvents: 'auto'` explicitly enables click handling on the tooltip
- The existing `e.stopPropagation()` on the button prevents the click from bubbling to the overlay

### Alternative Considered

We could also move the overlay to a lower z-index or restructure the DOM, but using `wrapperStyle` is the cleanest solution as it's the Recharts-recommended way to style the tooltip container.
