

# Simplify Backward Compatibility: Change Default Instead of Migration

## Problem

The previously proposed migration in `useUserSettings.ts` added a fire-and-forget database write to backfill `calorieTargetEnabled: true` for existing users. This is fragile and unnecessary since the deficit feature hasn't shipped yet.

## Solution

Change `calorieTargetEnabled` default from `false` to `true` in `DEFAULT_SETTINGS`. This single-line change makes the system backward-compatible without any migration logic.

## Why It Works

| Scenario | Stored settings | Default fills in | `getEffectiveDailyTarget()` returns |
|---|---|---|---|
| Existing user, target = 2000 | `{ dailyCalorieTarget: 2000 }` | `calorieTargetEnabled: true` | `2000` (correct) |
| New user, no target set | `{}` | `calorieTargetEnabled: true, dailyCalorieTarget: null` | `null` (correct) |
| User explicitly disables | `{ calorieTargetEnabled: false }` | n/a (stored value wins) | `null` (correct) |

## Technical Details

### File: `src/hooks/useUserSettings.ts`

Change one line in `DEFAULT_SETTINGS`:

```
calorieTargetEnabled: false
```
to:
```
calorieTargetEnabled: true
```

One file, one line.

