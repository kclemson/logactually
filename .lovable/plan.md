
# Fix Medication Schedule Summary and Dose Time Ghost Text

## Three issues, two files

---

### Issue 1: ", ," in the medication logging dialog schedule line

**File:** `src/components/MedicationEntryInput.tsx` — line 94

The schedule summary joins `doseTimes` directly:
```tsx
const times = doseTimes && doseTimes.length > 0 ? ` · ${doseTimes.join(', ')}` : '';
```

When the user saved a medication with doses-per-day set but left all the dose time fields blank, `doseTimes` is stored as `['', '', '']`. The array has length > 0, so it renders as `· , ,`.

**Fix:** Filter out blank entries before joining:
```tsx
const nonEmpty = doseTimes?.filter(t => t.trim()) ?? [];
const times = nonEmpty.length > 0 ? ` · ${nonEmpty.join(', ')}` : '';
```

---

### Issue 2: Dose time inputs using actual defaults as placeholder text instead of ghost text

**File:** `src/components/CreateMedicationDialog.tsx` — lines 183–188

Currently the placeholder is `DOSE_TIME_DEFAULTS[dosesPerDay]?.[i]` which pulls real values like `"morning"`, `"evening"`, `"8am"` etc. These look like actual filled-in values (no italic/muted styling to distinguish them as examples). Per the memory note on form input standards, ghost text should use `placeholder:text-foreground/50 placeholder:italic`.

**Fix:** Replace the variable placeholder with a uniform example string and ensure the ghost text styling is applied:
```tsx
// Before:
placeholder={DOSE_TIME_DEFAULTS[dosesPerDay]?.[i] ?? 'e.g. morning, 8am'}
className="text-sm placeholder:text-foreground/50 placeholder:italic"

// After:
placeholder="e.g. morning, 8am, with dinner, etc"
className="text-sm placeholder:text-foreground/50 placeholder:italic"
```

The `DOSE_TIME_DEFAULTS` constant can be removed from this file entirely since it's no longer used here.

---

### Issue 3: Dose time inputs in EditLogTypeDialog missing ghost text styling

**File:** `src/components/EditLogTypeDialog.tsx` — line 182–187

The `EditLogTypeDialog` already has the correct uniform placeholder text (`"e.g. morning, 8am, with dinner"`) but is missing the `placeholder:text-foreground/50 placeholder:italic` classes, so on dark theme it shows as the default light gray (which can look like real values).

**Fix:** Add `autoComplete="off"` and the ghost text classes:
```tsx
// Before:
className="text-sm"

// After:
className="text-sm placeholder:text-foreground/50 placeholder:italic"
autoComplete="off"
```

Also update the placeholder to match the new uniform wording with `etc` at the end:
```
placeholder="e.g. morning, 8am, with dinner, etc"
```

---

## Summary of changes

| File | Change |
|---|---|
| `src/components/MedicationEntryInput.tsx` | Filter empty strings from `doseTimes` before joining in `scheduleSummary` |
| `src/components/CreateMedicationDialog.tsx` | Replace per-slot `DOSE_TIME_DEFAULTS` placeholder with uniform ghost text; remove unused `DOSE_TIME_DEFAULTS` constant |
| `src/components/EditLogTypeDialog.tsx` | Add `placeholder:text-foreground/50 placeholder:italic` and `autoComplete="off"` to dose time inputs; update placeholder wording to match |

No database changes, no new dependencies.
