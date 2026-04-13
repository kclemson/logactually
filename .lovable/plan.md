

## Move "Reset to default" to right-aligned below dropdowns

### Change

In `PreferencesSection.tsx`, move the "Reset to default" button from the left-side label area into the right-side dropdown column, positioned below the 3 selects and right-aligned.

### Layout (before → after)

```text
BEFORE:
Display macros              [Protein] [Carbs] [Fiber]
Customize the 3 values...
Reset to default

AFTER:
Display macros              [Protein] [Carbs] [Fiber]
Customize the 3 values...              Reset to default
```

### Implementation

**One file: `src/components/settings/PreferencesSection.tsx`**

- Remove the `{!isStandardMacros(...) && <button>}` block from the left `<div>` (lines 216-223)
- Wrap the right-side dropdowns `<div>` in a flex-col container
- Add the "Reset to default" button below the dropdowns row, with `text-right` alignment
- Keep the same styling (`text-[10px] text-primary hover:underline`)

~5 lines moved, no new logic.

