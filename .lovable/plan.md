
## Change dose count color: partial → green (same as complete)

### Current logic in `getDoseCountStyle`

```ts
function getDoseCountStyle(todayEntryCount: number, dosesPerDay: number): string {
  if (dosesPerDay === 0 || todayEntryCount === 0) return 'text-muted-foreground';
  if (todayEntryCount < dosesPerDay) return 'text-amber-500';         // ← amber when partial
  if (todayEntryCount === dosesPerDay) return 'text-green-500 dark:text-green-400'; // green when complete
  return 'text-red-500';                                               // red when over
}
```

### Requested change

Both `todayEntryCount < dosesPerDay` (partial) and `todayEntryCount === dosesPerDay` (complete) should return the same green color. Only "over-dosed" stays red, and zero stays muted.

```ts
function getDoseCountStyle(todayEntryCount: number, dosesPerDay: number): string {
  if (dosesPerDay === 0 || todayEntryCount === 0) return 'text-muted-foreground';
  if (todayEntryCount <= dosesPerDay) return 'text-green-500 dark:text-green-400';
  return 'text-red-500';
}
```

### File to change

`src/components/MedicationEntryInput.tsx` — one line change, collapsing the two green/amber branches into a single `<=` condition.
