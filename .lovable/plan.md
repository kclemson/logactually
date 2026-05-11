## Goal

Let users enter any multiplier (e.g. `0.33`, `0.4`, `1.2`) by tapping the `0.5x` / `1x` label between the − / + buttons. The stepper stays for quick coarse changes; tap-to-type adds precision without new UI affordances.

This applies to all three places the multiplier stepper is rendered in `src/components/FoodItemsTable.tsx`:
- Group portion stepper, two-column variant (~L461–488)
- Group portion stepper, single-column variant (~L639–665)
- Individual-item portion stepper (~L945–965)

No backend or data-model changes — the multiplier flows through `scaleGroupPortion` / `scaleItemByMultiplier` exactly as today; only the input UI changes.

## UX

- Default state: same `0.5x` text label as today.
- Tap/click the label → it becomes a small inline `<input>` (~3rem wide, same tabular-nums sizing) pre-filled with the current value, `inputMode="decimal"`, text-selected on focus.
- Commit on Enter or blur:
  - Parse as float, clamp to `[0.1, 10]`, round to 2 decimals.
  - Empty or unparseable → revert to previous value.
  - Don't snap to the existing `MULTIPLIER_STEPS` sequence — accept any decimal.
- Escape reverts and exits edit mode.
- `−` / `+` buttons keep working: when the current value is off-sequence (e.g. 0.33), they step to the next/previous value in `MULTIPLIER_STEPS` using the existing `stepMultiplier` "snap to nearest" branch (already handles this case).
- Preview line (`(1 portion, 533 cal)`) and Done/Reset behavior unchanged — they already read the multiplier from state.
- Read-only users: tapping the label still allows local edits; the actual persistence is already gated in the Done handler via `triggerOverlay()`.

## Implementation notes

- Add a small local component (or inline state) `MultiplierInput` in `FoodItemsTable.tsx` that swaps between a `<button>` showing `{value}x` and an `<input type="text" inputMode="decimal">` when focused.
- Keep min `0.1`, max `10` as soft clamps; mirrors the existing 0.25–5.0 stepper bounds but allows the user's 0.33 case while preventing absurd values.
- Format display: integer when whole (`1x`), else trim trailing zeros (`0.33x`, `1.5x`, not `0.33000x`).
- Reuse existing styling: `text-sm font-medium tabular-nums`, primary color when ≠ 1.0.
- No changes to `portion-scaling.ts`, `useGroupPortionScale.ts`, `stepMultiplier`, or `MULTIPLIER_STEPS`. `scalePortion` and `scaleItemByMultiplier` already handle arbitrary decimal multipliers.

## Out of scope

- No slider, no preset chips, no changes to the step sequence itself.
- No changes to the saved-meals/routines popovers or any other component.
- No mobile-specific layout changes — the existing row already fits the input width on the 440px viewport.

## Memory updates

Update `mem://features/portion-scaling-system-v3` to note that the multiplier label is tappable for arbitrary decimal entry, while − / + still walk the `MULTIPLIER_STEPS` sequence.
