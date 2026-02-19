
## Remove DOSE_TIME_DEFAULTS from EditLogTypeDialog — always use empty strings + ghost text

### What's wrong

`EditLogTypeDialog.tsx` has a `DOSE_TIME_DEFAULTS` constant (lines 25–32) that pre-fills dose time inputs with real string values like `'6am'`, `'9am'`, `'12pm'` etc. When the user clicks a frequency button (e.g. 6), `handleDosesPerDayChange` pushes these strings into state — so the inputs render with white text as if the user typed those values, not as placeholder ghost text.

`CreateMedicationDialog.tsx` already does this correctly with `Array(count).fill('')` — no defaults at all.

### Fix

Two changes to `EditLogTypeDialog.tsx`:

**1. Remove `DOSE_TIME_DEFAULTS`** (lines 25–32) — the constant is deleted entirely.

**2. Simplify `handleDosesPerDayChange`** (lines 54–68) to always use empty strings for new slots, preserving existing user-entered values when trimming up/down:

```ts
const handleDosesPerDayChange = (count: number) => {
  setDosesPerDay(count);
  if (count === 0) {
    setDoseTimes([]);
  } else {
    setDoseTimes(prev => {
      const next = prev.slice(0, count);
      while (next.length < count) next.push('');
      return next;
    });
  }
};
```

This means:
- "As needed" → 6: all 6 inputs empty → show ghost placeholder text ✓
- 2 → 6: inputs 1 & 2 keep whatever the user typed, inputs 3–6 are empty ✓  
- 6 → 2: inputs 1 & 2 preserved, rest trimmed ✓

The dose time inputs in the edit dialog already have the correct placeholder text (`"e.g. morning, 8am, with dinner, etc"`) and ghost styling (`placeholder:text-foreground/50 placeholder:italic`) — so once the values are empty strings, the ghost text will display correctly with no further changes needed.

### Only file to change

| File | Change |
|---|---|
| `src/components/EditLogTypeDialog.tsx` | Delete `DOSE_TIME_DEFAULTS` constant; replace `handleDosesPerDayChange` with the simplified version |

No other files need touching — `CreateMedicationDialog.tsx` is already correct.
