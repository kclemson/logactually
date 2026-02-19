
# Show Timestamps of Today's Logged Doses in MedicationEntryInput

## What we're building

Below the "X of Y doses logged today" line, show a small inline list of the actual times each dose was logged — e.g.:

```
2 of 2 doses logged today
  · 8:30 AM  · 1:00 PM
```

This gives the user instant confirmation of when they took each dose without leaving the dialog.

## Data flow change

Currently, `MedicationEntryInput` only receives `todayEntryCount: number`. We need to also pass the actual `logged_time` strings so we can format and display them.

### In `OtherLog.tsx`

The `typeEntries` array (from `useCustomLogEntriesForType`) already contains today's entries including `logged_time`. We filter today's entries to compute `todayEntryCount` — we can also pass those filtered entries directly:

```tsx
const todayEntries = typeEntries.filter(e => e.logged_date === format(new Date(), 'yyyy-MM-dd'));

<MedicationEntryInput
  ...
  todayEntryCount={todayEntries.length}
  todayLoggedTimes={todayEntries
    .map(e => e.logged_time)
    .filter(Boolean) as string[]}
/>
```

### In `MedicationEntryInput.tsx`

Add a new optional prop `todayLoggedTimes?: string[]`.

The `logged_time` column is a Postgres `time` type stored as `"HH:MM:SS"`. We need to parse and format it into `"h:mm a"` (e.g. `"8:30 AM"`).

A small helper:

```ts
function formatLoggedTime(t: string): string {
  // t = "HH:MM:SS" or "HH:MM"
  const [h, m] = t.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return format(d, 'h:mm a');
}
```

Render below the dose count line:

```tsx
{todayLoggedTimes && todayLoggedTimes.length > 0 && (
  <p className="text-xs text-muted-foreground">
    {todayLoggedTimes.map(formatLoggedTime).join('  ·  ')}
  </p>
)}
```

This keeps it visually light — muted gray, same size as the count line — so it reads as supplementary detail rather than a competing element.

## Visual result

```
2 of 2 doses logged today         ← green (completed)
8:30 AM  ·  1:00 PM               ← muted gray, below
```

For 1 of 2 logged:
```
1 of 2 doses logged today         ← amber (partial)
8:30 AM                           ← muted gray
```

For as-needed (no dosesPerDay) with 1 logged:
```
1 dose logged today               ← muted gray
8:30 AM                           ← muted gray
```

## Files changed

| File | Change |
|---|---|
| `src/components/MedicationEntryInput.tsx` | Add `todayLoggedTimes?: string[]` prop; add `formatLoggedTime` helper; render formatted times below the dose count line |
| `src/pages/OtherLog.tsx` | Derive `todayLoggedTimes` from filtered `typeEntries`; pass as prop to `MedicationEntryInput` in the dialog (and in the By Date inline form) |

No DB changes. No new hooks needed — `typeEntries` already carries `logged_time`.
