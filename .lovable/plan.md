
# Three Small Fixes to CreateMedicationDialog

## What's changing

### 1. Extend "How often per day?" from 4 to 6

Change the button array from `[0, 1, 2, 3, 4]` to `[0, 1, 2, 3, 4, 5, 6]`.

Add smart-default placeholder strings for counts 5 and 6:
- 5 → `['6am', '10am', '2pm', '6pm', '10pm']`
- 6 → `['6am', '9am', '12pm', '3pm', '6pm', '9pm']`

(These defaults are only used as placeholder hint text — see below.)

### 2. Smart defaults become placeholder/ghost text, not actual values

Currently `handleDosesPerDayChange` fills `doseTimes` state with the default strings (e.g. `['morning', 'evening']`). These show up as real typed text in the inputs, which is wrong — the user would have to clear them to type their own values.

The fix: when the dose count changes, initialize `doseTimes` as an array of **empty strings** (one per dose). The smart defaults move to the `placeholder` prop of each input, computed from `DOSE_TIME_DEFAULTS[count][i]`.

```tsx
// Before (wrong — fills as real values)
setDoseTimes(DOSE_TIME_DEFAULTS[count] ?? []);

// After (correct — empty values, defaults become placeholders)
setDoseTimes(Array(count).fill(''));
```

Each input then uses:
```tsx
placeholder={DOSE_TIME_DEFAULTS[dosesPerDay]?.[i] ?? 'e.g. morning, 8am'}
```

### 3. Placeholder styling: italic + darker gray

The existing `Input` component renders a standard `<input>` with Tailwind class `placeholder:text-muted-foreground`. We need to override this on the dose time inputs to use a darker, italic placeholder.

Add these classes to the dose time `Input`:
```
placeholder:text-foreground/50 placeholder:italic
```

`text-foreground/50` is notably darker than `text-muted-foreground` (which is typically around 40% opacity), giving the "ghost text" a clearer visual presence. Combined with `italic` it reads unmistakably as hint text, not user input.

Also apply the same style to the Notes textarea placeholder, for consistency across the dialog.

## Files changed

| File | Change |
|---|---|
| `src/components/CreateMedicationDialog.tsx` | Extend count buttons to 6; add defaults for 5 and 6; initialize `doseTimes` as empty strings; move defaults to placeholder prop; add italic+darker placeholder styling to dose time inputs |

No DB changes, no hook changes, no other files touched.

## Before / After

**Before**: selecting "3" fills the three inputs with actual text "8am", "12pm", "4pm" — user must delete to type their own value.

**After**: selecting "3" shows three empty inputs with italic gray ghost text "8am", "12pm", "4pm" as hints — user types freely without clearing anything.
