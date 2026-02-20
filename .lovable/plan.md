
## Fix: dose count always shows a color when doses have been logged

### Problem

`getDoseCountStyle` in `MedicationEntryInput.tsx` has this condition:

```ts
if (dosesPerDay === 0 || todayEntryCount === 0) return 'text-muted-foreground';
```

The `dosesPerDay === 0` case covers "as needed" medications. Since there's no target dose count, the function bails out early and returns muted grey — even when doses have actually been logged today. The user sees "3 doses logged today" in a flat, unnoticeable color.

### Fix

Split the two conditions. Keep `todayEntryCount === 0` as muted (nothing logged = nothing to highlight). But when doses *have* been logged:

- **`dosesPerDay > 0`** (scheduled): green if at or under target, red if over
- **`dosesPerDay === 0`** (as needed): use amber — always colored when any doses are logged, since there's no target to compare against

```ts
function getDoseCountStyle(todayEntryCount: number, dosesPerDay: number): string {
  if (todayEntryCount === 0) return 'text-muted-foreground';
  if (dosesPerDay === 0) return 'text-amber-500 dark:text-amber-400'; // as-needed: always amber
  if (todayEntryCount <= dosesPerDay) return 'text-green-500 dark:text-green-400';
  return 'text-red-500';
}
```

Amber is a natural fit here — it's attention-grabbing and neutral (not pass/fail), appropriate for "as needed" medications where the count is informational rather than a compliance indicator.

### Only file to change

| File | Change |
|---|---|
| `src/components/MedicationEntryInput.tsx` | Update `getDoseCountStyle` to use amber for as-needed medications with at least one dose logged |
