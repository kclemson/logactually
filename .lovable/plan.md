# Mobile Tap-to-Show Tooltip Pattern — IMPLEMENTED ✅

## Summary

Device-aware chart interaction model implemented:
- **Desktop**: Hover shows tooltip, click navigates directly (unchanged)
- **Mobile**: Tap shows persistent tooltip with "Go to day →" button, tap outside dismisses

## Files Changed

| File | Changes |
|------|---------|
| `src/pages/Trends.tsx` | Updated `CompactTooltip` and `ExerciseChart` with mobile state/handlers |
| `src/components/trends/FoodChart.tsx` | **NEW** - Extracted `FoodChart`, `StackedMacroChart`, `VolumeChart` components with mobile tooltip support |

## Implementation Details

1. **CompactTooltip**: Added `isMobile`, `onGoToDay`, `rawDate` props; renders "Go to day →" button on mobile
2. **ExerciseChart**: Added `activeBarIndex` state, conditional click behavior, click-away overlay, controlled tooltip mode
3. **FoodChart/StackedMacroChart/VolumeChart**: New components encapsulating the same mobile pattern for food and volume charts

## User Experience

```text
Mobile Flow:
1. User taps bar → Tooltip appears with data + "Go to day →" link
2. User can:
   a. Read data and tap elsewhere → tooltip dismisses
   b. Tap "Go to day →" → navigates to the day
   c. Tap different bar → switches tooltip to that bar

Desktop Flow (unchanged):
1. User hovers bar → tooltip shows
2. User clicks bar → navigates immediately
```

