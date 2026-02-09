

## Calorie Target with Tiered Indicator Dot

### Overview

Add a "Daily Calorie Target" setting with a helper description, and use a forgiving threshold system on the History calendar where being slightly over (up to 2.5%) still counts as green.

### Updated Thresholds

| Condition | Dot Color | Example (1,500 target) |
|-----------|-----------|----------------------|
| No target set | No dot | -- |
| Within 2.5% over (or under) | Green | up to 1,537 cal |
| Over 2.5% to 10% over | Amber | 1,538 - 1,650 cal |
| More than 10% over | Rose | 1,651+ cal |

### Settings Description

Below the "Daily Calorie Target" label, the helper text reads:

```
Daily Calorie Target
Show color indicators on calendar view         [ Not set ]
```

### Files to Change

| File | Change |
|------|--------|
| `src/hooks/useUserSettings.ts` | Add `dailyCalorieTarget: number \| null` to interface and defaults |
| `src/pages/Settings.tsx` | Add input with two-line label (title + helper text) in Preferences section |
| `src/pages/History.tsx` | Add colored dot with updated threshold logic |

### Technical Details

**1. UserSettings** (`src/hooks/useUserSettings.ts`)

```typescript
interface UserSettings {
  // ...existing
  dailyCalorieTarget: number | null;
}

const DEFAULT_SETTINGS = {
  // ...existing
  dailyCalorieTarget: null,
};
```

**2. Settings UI** (`src/pages/Settings.tsx`)

New row in Preferences section:

```typescript
<div className="flex items-center justify-between">
  <div>
    <p className="text-xs text-muted-foreground">Daily Calorie Target</p>
    <p className="text-[10px] text-muted-foreground/70">Show color indicators on calendar view</p>
  </div>
  <Input
    type="number"
    placeholder="Not set"
    value={settings.dailyCalorieTarget ?? ''}
    onChange={(e) => {
      const val = e.target.value === '' ? null : parseInt(e.target.value, 10);
      updateSettings({ dailyCalorieTarget: val });
    }}
    className="w-24 h-8 text-right text-sm"
    min={0}
    max={99999}
  />
</div>
```

**3. Calendar dot logic** (`src/pages/History.tsx`)

```typescript
function getTargetDotColor(calories: number, target: number): string {
  const overPercent = ((calories - target) / target) * 100;
  if (overPercent <= 2.5) return "text-green-500 dark:text-green-400";
  if (overPercent <= 10) return "text-amber-500 dark:text-amber-400";
  return "text-rose-500 dark:text-rose-400";
}
```

The dot (`●`) appears after the calorie text at `text-[8px]` size, only when a target is set and the day has entries. Calorie text stays blue.

### Edge Cases

- **Target of 0 or null**: no dot, calendar unchanged
- **Exactly at target**: green (0% over)
- **2.5% over** (e.g. 1,537 on 1,500): green -- still on-target
- **3% over** (e.g. 1,545 on 1,500): amber -- minor overage
- **Under target**: always green (negative percentage)

