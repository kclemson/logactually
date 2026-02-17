

# Calorie Target Tooltips: Rollup Row + Calendar Day Cells

## Overview

Two tooltip additions to the Calendar page, plus blue color consistency on the rollup numbers.

## Change 1: Blue calorie numbers in rollup

The rollup row's numeric values use `text-blue-500 dark:text-blue-400` to match the per-day cell numbers. The "7 days:" and "avg" labels stay muted.

## Change 2: Rollup row tooltip

A tooltip on the rollup summary row showing:
- The user's current target config line
- The threshold legend using actual colored dots (not color words)

```text
Target: 1,800 cal/day + exercise
  ● at or under target
  ● up to 5% over
  ● more than 5% over
```

Each dot is rendered with its actual color class (green/amber/rose). No color words.

Interaction:
- Desktop: hover tooltip
- Mobile: tap toggles tooltip open/closed (existing pattern from exercise log tooltips)

## Change 3: Calendar day cell tooltips

Follow the exact Trends chart pattern:
- **Desktop**: hover shows tooltip with day's intake vs target breakdown; click navigates to that day (unchanged)
- **Mobile**: tap shows tooltip with the same breakdown plus a "Go to day" link; tapping the link navigates

Tooltip content for a day with a calorie dot:
```text
Mon, Feb 16
1,842 / 1,800 cal target
```

For exercise-adjusted days:
```text
Mon, Feb 16
1,842 / 2,050 cal target (incl. 250 burn)
```

Days without calorie data or without a target enabled show no tooltip.

### Mobile tap-to-show pattern (mirroring Trends)

The Trends charts use `activeBarIndex` state: tap toggles the tooltip, a fixed inset-0 overlay dismisses it, and "Go to day" navigates. The calendar will use the same pattern with `activeDayIndex`:
- Tap a day cell: sets `activeDayIndex`, shows tooltip
- Tap again or tap outside: clears it
- Tap "Go to day": navigates to that day

On desktop, `activeDayIndex` is not used; click directly navigates as before.

## Technical Details

### File: `src/lib/calorie-target.ts`

Add one new pure function:

```typescript
export function describeCalorieTarget(settings: UserSettings): string | null
```

Returns a one-liner based on mode:
- Static: "Target: 2,000 cal/day"
- Exercise adjusted: "Target: 1,800 cal/day + exercise"
- Body stats (fixed activity): "Target: 1,650 cal/day (from TDEE)"
- Body stats (logged exercise): "Target: 1,650 cal/day + exercise (from TDEE)"

Returns null if target not enabled or base target can't be resolved.

### File: `src/lib/calorie-target.test.ts`

Add tests for `describeCalorieTarget` covering all four mode/sub-mode combos plus null cases.

### File: `src/components/CalorieTargetRollup.tsx`

- Import Tooltip components, `useHasHover`, `describeCalorieTarget`
- Add `tooltipOpen` state for mobile tap-to-toggle
- Make avg numbers blue (`text-blue-500 dark:text-blue-400`), labels stay muted
- Wrap content in Tooltip:
  - Desktop: standard hover
  - Mobile: `open`/`onOpenChange` controlled by `tooltipOpen` state, `onClick` toggles
- Tooltip content: target description line, then three lines each with a colored dot span and its meaning

### File: `src/pages/History.tsx`

- Import `useHasHover`, Tooltip components, `format` (for day label)
- Add `activeDayIndex` state (number | null) for mobile tooltip
- Add `TooltipProvider` wrapping the calendar grid
- On desktop (`hasHover`): dismiss overlay not needed
  - Each day cell with a calorie dot gets a Radix Tooltip (hover-only) showing intake vs target
  - Click behavior unchanged (navigates)
- On mobile (`!hasHover`):
  - Day cell tap sets `activeDayIndex` instead of navigating
  - A fixed inset-0 overlay clears `activeDayIndex` on tap (same as Trends)
  - The tooltip appears anchored to the tapped cell, showing intake vs target + "Go to day" link
  - "Go to day" clears `activeDayIndex` and navigates
- Tooltip content built inline: `"{intake} / {target} cal target"` with optional `"(incl. {burn} burn)"` suffix for exercise-adjusted days
- Days without entries or without a target: no tooltip, click/tap navigates directly

### Files not changed
- `CompactChartTooltip.tsx` (Trends-specific, not reused -- calendar tooltip is simpler)
- `calorie-target.ts` rollup/dot functions (unchanged)
- `useDailyFoodTotals`, `useDailyCalorieBurn`, `useUserSettings` (unchanged)
- Tooltip UI component (used as-is)

