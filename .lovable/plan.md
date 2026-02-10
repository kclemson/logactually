

## Replace "cardio" Label with Contextual Shorthand

### What Changes

The static "cardio" text spanning the Sets/Reps/Weight columns for cardio exercises will be replaced with a compact, data-driven summary in italicized, muted styling.

### Shorthand Format

| Data Available | Display |
|---|---|
| Distance + Duration | *1.5 mi, 17:33, 5.1 mph* |
| Duration only | *15:30* |
| Distance only | *2.0 mi* |
| Neither | *cardio* |

Speed (mph) is only shown when both distance and duration are available.

### Technical Details

**File: `src/components/WeightItemsTable.tsx`**

In the cardio label rendering section (~lines 491-501), replace the hardcoded `"cardio"` string with a computed label:

```typescript
const parts: string[] = [];
const dist = item.distance_miles ?? 0;
const dur = item.duration_minutes ?? 0;

if (dist > 0) parts.push(`${dist.toFixed(1)} mi`);
if (dur > 0) parts.push(formatDurationMmSs(dur));
if (dist > 0 && dur > 0) {
  const mph = dist / (dur / 60);
  parts.push(`${mph.toFixed(1)} mph`);
}

const label = parts.length > 0 ? parts.join(', ') : 'cardio';
```

The label renders with the existing italic + `text-muted-foreground` styling already applied to the "cardio" text. Will also add `formatDurationMmSs` import from `@/lib/weight-units`. Text size drops to `text-xs` to fit longer labels.

No other files need changes.

