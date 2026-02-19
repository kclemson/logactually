
# Move Dose+Schedule to `meta` — Simpler Layout, No Flex Fighting

## Why this is cleaner

`SavedItemRow` already has a `meta` prop that renders as a `shrink-0` span between the name area and the action icons. This is exactly the layout shown in the reference screenshot (name on the left, dose+schedule in the middle, pencil+trash on the right). Using `meta` for this purpose is semantically correct and eliminates all the flex-shrink complexity we added to `nameAppend`.

Current (complex):
```
[name div (flex-1)] [nameAppend wrapper (shrink, overflow-hidden)] [pencil] [trash]
                          ↳ dose (shrink-0) + freq (shrinks to 0)
```

Target (simple):
```
[name div (natural width)] [meta: dose · freq (shrink-0)] [pencil] [trash]
```

## What changes

### `CustomLogTypeRow.tsx`

Move medication metadata from `nameAppend` to `meta`. The `meta` prop already renders as `shrink-0 text-xs text-muted-foreground` — perfect for dose+schedule. Non-medication types (`(lbs)`, `(mmHg)`) stay as `nameAppend` since they belong right after the name.

```tsx
// For medication: build a meta string instead of nameAppend JSX
const meta = type.value_type === 'medication' ? (() => {
  const dosePart = type.default_dose != null && type.unit
    ? `${type.default_dose} ${type.unit}`
    : type.unit || null;
  const freqPart = type.doses_per_day > 0 ? `${type.doses_per_day}x/day` : 'as needed';
  return dosePart ? `${dosePart} · ${freqPart}` : freqPart;
})() : undefined;

const nameAppend = type.value_type !== 'medication' && type.unit
  ? `(${type.unit})`
  : null;
```

Pass `meta={meta}` and `nameAppend={nameAppend}` to `SavedItemRow`.

### `SavedItemRow.tsx`

Revert the `nameAppend` wrapper back to something simple — since we're no longer passing complex JSX into `nameAppend` for medications, the wrapper doesn't need `min-w-0 overflow-hidden`. Restore it to a neutral `shrink-0` wrapper (or just render inline), and remove the `flex-1` / overflow changes we added to the name div.

The name div goes back to `min-w-0 text-sm cursor-text ...` — no `flex-1`, no `whitespace-nowrap`, no `overflow-hidden`. Natural behavior: name renders at content width and wraps if it truly can't fit, which is fine since `meta` being `shrink-0` means the row gives it space from the right side rather than squeezing from within the name area.

Actually, one consideration: on mobile the `meta` is `shrink-0` so a very long name + a long dose string could push things. But this is the same tradeoff that exists today for non-medication rows with `(lbs)` — it works fine in practice because medication names are short enough. The reference screenshot confirms this is acceptable.

## Files changed

| File | Change |
|---|---|
| `src/components/CustomLogTypeRow.tsx` | For medication: compute a plain string `meta` (dose + freq) instead of JSX `nameAppend`. Pass as `meta=` prop. Keep `nameAppend` only for non-medication unit display. |
| `src/components/SavedItemRow.tsx` | Revert `nameAppend` wrapper to simpler form — remove `min-w-0 overflow-hidden` since it's no longer needed for medication JSX fragments. Revert name div to remove `flex-1`. |

No DB changes. No hook changes. Two small component edits.
