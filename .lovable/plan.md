

## Add Hours Support to Duration Formatting

### Problem

`formatDurationMmSs` outputs `89:14` for a 89-minute walk instead of `1:29:14`. Any activity over 60 minutes looks wrong.

### Solution

Update the single `formatDurationMmSs` function in `src/lib/weight-units.ts` to handle hours. When duration is >= 60 minutes, format as `h:mm:ss`; otherwise keep the current `m:ss` format.

### Updated Function

```typescript
export function formatDurationMmSs(decimalMinutes: number): string {
  const totalSeconds = Math.round(decimalMinutes * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
```

### Output Examples

| Input (min) | Before | After |
|---|---|---|
| 11.5 | 11:30 | 11:30 |
| 89.23 | 89:14 | 1:29:14 |
| 125.0 | 125:00 | 2:05:00 |
| 0.5 | 0:30 | 0:30 |

### Scope

Only one file changes: `src/lib/weight-units.ts`. Since every caller already uses this function, the fix propagates automatically to:
- Weight log cardio shorthand labels
- Trends page tooltips (pace `/mi` and duration)
- Routine naming in save/create dialogs
- Routine naming utility

No caller changes needed.

