

## Remove Totals Row from Save Suggestion Dialog

### Problem
The save suggestion prompt shows a confusing totals row where "Reps" displays `24` (sets × reps) while the individual row shows `8` (reps per set). This is misleading when users are previewing items to save as a routine.

### Solution
Add `showTotals={false}` to the `WeightItemsTable` component in the save suggestion prompt.

### File Change

**`src/pages/WeightLog.tsx`** (line ~452-453)

Change from:
```typescript
showHeader={false}
totalsPosition="bottom"
```

To:
```typescript
showHeader={false}
showTotals={false}
```

The `totalsPosition` prop becomes irrelevant when `showTotals={false}`, so it can be removed.

