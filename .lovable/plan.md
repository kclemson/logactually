
## Show dose amount and schedule in the medication entry dialog for all medications, including "as needed"

### What's happening

In `MedicationEntryInput.tsx`, the `scheduleSummary` variable is built like this:

```ts
const scheduleSummary = dosesPerDay === 0
  ? null   // ← "as needed" meds return null → nothing rendered
  : (() => {
      const freq = `${dosesPerDay}x/day`;
      ...
    })();
```

So for "as needed" medications, the schedule line is suppressed entirely. The user wants it to always show — with dose amount and frequency — matching the same style already visible in the list view (`· 200 mg · as needed`).

### Fix

Replace the `scheduleSummary` logic to handle both cases:

- **Scheduled** (`dosesPerDay > 0`): `"2x/day · morning, evening"` (same as today)
- **As needed** (`dosesPerDay === 0`): `"as needed"`, or `"200 mg · as needed"` if a default dose + unit exist

```ts
const scheduleSummary = (() => {
  const dosePart = defaultDose != null && unit
    ? `${defaultDose} ${unit}`
    : unit || null;

  if (dosesPerDay === 0) {
    // as-needed: show dose if available, always show "as needed"
    return dosePart ? `${dosePart} · as needed` : 'as needed';
  }

  // scheduled: freq + optional named times
  const freq = `${dosesPerDay}x/day`;
  const nonEmpty = doseTimes?.filter(t => t.trim()) ?? [];
  const times = nonEmpty.length > 0 ? ` · ${nonEmpty.join(', ')}` : '';
  return `${freq}${times}`;
})();
```

Then remove the conditional `{scheduleSummary && ...}` guard (or keep it — since `scheduleSummary` now always returns a string, the guard becomes irrelevant but harmless).

### Result

| Medication type | Schedule line shown |
|---|---|
| As needed, no dose | `as needed` |
| As needed, 200 mg | `200 mg · as needed` |
| 2x/day, named times | `2x/day · morning, evening` |
| 2x/day, no times | `2x/day` |

### Only file to change

| File | Change |
|---|---|
| `src/components/MedicationEntryInput.tsx` | Replace `scheduleSummary` logic to always produce a string, including "as needed" case with optional dose prefix |
