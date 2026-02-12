

## Change Subtitle Separator from Dot to Comma

Replace the middle-dot (`·`) separator in chart subtitles with a comma for cleaner readability.

### Changes

**File: `src/pages/Trends.tsx`**

Two locations where the subtitle template string uses `·`:

1. **Line 725** (Calories chart subtitle):
```
- subtitle={`avg: ${averages.calories} · today: ${todayValues.calories}`}
+ subtitle={`avg: ${averages.calories}, today: ${todayValues.calories}`}
```

2. **Line 773** (PCF chart subtitles):
```
- subtitle={`avg: ${averages[key as keyof typeof averages]} · today: ${todayValues[key as keyof typeof todayValues]}`}
+ subtitle={`avg: ${averages[key as keyof typeof averages]}, today: ${todayValues[key as keyof typeof todayValues]}`}
```

