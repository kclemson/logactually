

# Let users dismiss calorie tooltips by tapping anywhere outside

## Problem
On touch devices, calorie target tooltips on the Food Log page and Calendar (History) page cannot be dismissed by tapping outside them. The user must tap the exact trigger element again. This happens because every `TooltipContent` uses `onPointerDownOutside={(e) => e.preventDefault()}`, which actively blocks the browser's default dismiss behavior.

## Why the existing overlay on History only partially works
The History page renders a full-screen dismiss overlay, but only when `activeDayIndex != null`. This means tapping outside a **day cell** tooltip works (the overlay catches it), but the **rollup summary** tooltip at the top has no such coverage. Meanwhile the Food Log page has no overlay at all.

## Solution
Replace `e.preventDefault()` with a handler that closes the tooltip state in each controlled tooltip instance. On desktop (hover), the `open` prop is `undefined` so Radix manages everything automatically and these handlers are harmless.

## Changes

### 1. `src/components/FoodItemsTable.tsx` (~line 241)
Change `onPointerDownOutside`:
```tsx
// Before
onPointerDownOutside={(e) => e.preventDefault()}

// After
onPointerDownOutside={() => setTooltipOpen(false)}
```

### 2. `src/pages/History.tsx` (~line 445, desktop tooltip)
Desktop tooltips are uncontrolled (no `open` prop), so remove the prevention entirely:
```tsx
// Before
onPointerDownOutside={(e) => e.preventDefault()}

// After — just remove the prop entirely (Radix handles dismiss natively)
```

### 3. `src/pages/History.tsx` (~line 459, mobile tooltip)
Close via the existing `activeDayIndex` state:
```tsx
// Before
onPointerDownOutside={(e) => e.preventDefault()}

// After
onPointerDownOutside={() => setActiveDayIndex(null)}
```

### 4. `src/components/CalorieTargetRollup.tsx` (~line 129)
Close via the parent callback:
```tsx
// Before
onPointerDownOutside={(e) => e.preventDefault()}

// After
onPointerDownOutside={() => onTooltipToggle?.()}
```
Need to check: `onTooltipToggle` toggles, but we want to close. Let me verify the prop shape — if it only toggles, we should pass a dedicated `onClose` or just call the toggle since it will flip the open state to false when the tooltip is currently open.

Actually, looking at the History page code, `onTooltipToggle` is `() => setRollupTooltipOpen(o => !o)` — a toggle. Since `onPointerDownOutside` only fires when the tooltip **is** open, toggling will always close it. So using `onTooltipToggle` is correct here.

### 5. `src/components/WeightItemsTable.tsx` (~line 246)
This tooltip appears to be uncontrolled (no `open` state). Simply remove `onPointerDownOutside` to let Radix handle dismiss natively.

### 6. Remove the full-screen dismiss overlay from History.tsx (~lines 325-329)
With `onPointerDownOutside` now properly closing tooltips, the fixed overlay hack is no longer needed. Removing it simplifies the code and eliminates the invisible layer that blocks interaction.

## Commit message
`let users dismiss calorie tooltips by tapping outside on mobile (replace onPointerDownOutside preventDefault with state-close handlers)`

| File | Change |
|------|--------|
| `src/components/FoodItemsTable.tsx` | `onPointerDownOutside` closes tooltip state |
| `src/pages/History.tsx` | Remove preventDefault, close state on outside tap; remove dismiss overlay |
| `src/components/CalorieTargetRollup.tsx` | `onPointerDownOutside` calls toggle to close |
| `src/components/WeightItemsTable.tsx` | Remove `onPointerDownOutside` (uncontrolled tooltip) |
