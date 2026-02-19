
# Two Fixes: Add Doses 5 & 6, Restyle Dialog Typography

## Fix 1: Add doses 5 and 6 to "How often per day?"

The button array `[0, 1, 2, 3, 4]` needs two more entries. We also need defaults for dose times at counts 5 and 6 in `DOSE_TIME_DEFAULTS`.

```ts
// Add to DOSE_TIME_DEFAULTS:
5: ['6am', '10am', '2pm', '6pm', '10pm'],
6: ['6am', '9am', '12pm', '3pm', '6pm', '9pm'],
```

The button row uses `flex-wrap` already so 5 and 6 will wrap cleanly on narrow dialogs.

Change `[0, 1, 2, 3, 4]` to `[0, 1, 2, 3, 4, 5, 6]`.

## Fix 2: Match CalorieBurnDialog's lighter typography style

### What CalorieBurnDialog does

- Section headings: `text-xs font-medium text-muted-foreground uppercase tracking-wider`
- Field labels: `text-xs text-muted-foreground` (plain `<p>` tags, not `<Label>`)
- Sub-notes: `text-[10px] text-muted-foreground/70`
- Input values: standard input component, normal weight text

### What EditLogTypeDialog currently does

- `<Label>` component — bakes in `font-medium` from `labelVariants` CVA — making every label bold
- `<Input>` component — `text-sm` without any weight override, but inherits normal weight from the base (actually this is fine)
- The bold labels + bright white text on dark creates the "overwhelming" feeling

### The fix

Replace `<Label>` elements with plain `<p>` tags styled as `text-xs text-muted-foreground` to match CalorieBurnDialog's pattern. This is what the CalorieBurnDialog uses and what gives the clean, layered visual hierarchy.

Specific changes in `EditLogTypeDialog.tsx`:

1. **All `<Label>` elements** → `<p className="text-xs text-muted-foreground">` (or keep `<label>` HTML semantics with `for` attribute, but drop the Label component's font-medium). Since labels without `htmlFor` don't need the Radix Label component, use plain `<p>` for non-input labels and `<label>` for the ones with `htmlFor`.

2. **Dialog title** stays as-is (it uses `text-title` which is correct).

3. **"Dose 1", "Dose 2" sub-labels** inside the dose times section: switch from `<Label className="text-sm text-muted-foreground ...">` to `<p className="text-xs text-muted-foreground ...">`.

4. **Input components** — the `Input` component already renders normal-weight text; no change needed there. The Textarea also renders normally.

5. **"As needed" / number pill buttons** — currently `font-medium` — soften to `font-normal` for unselected state, keep selected (teal) as-is.

## Files Changed

| File | Change |
|---|---|
| `src/components/EditLogTypeDialog.tsx` | (1) Add 5 & 6 to button array and DOSE_TIME_DEFAULTS; (2) Replace `<Label>` components with plain `<p className="text-xs text-muted-foreground">` throughout; soften unselected pill button font weight |

No other files need changing.
