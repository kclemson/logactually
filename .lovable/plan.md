

## Show custom log inputs in demo mode with disabled Save button

Simpler approach than a preview dialog: show the full input experience (including trend chart) but disable the submit button.

### Changes

**`src/pages/OtherLog.tsx`** — 3 edits:

1. **Remove `!isReadOnly` guard** from the input controls section (the "has log types" branch with view-mode select + Log New dropdown) so it renders in demo mode. Keep the onboarding template section hidden in read-only.

2. **Remove `!isReadOnly` guard** from the entry dialog (`{dialogType && !isReadOnly && ...}`) so it opens in demo mode.

3. **Pass `isReadOnly` to `LogEntryInput` and `MedicationEntryInput`** as a `disabled` prop. Both components already have an `isLoading` prop that disables the Save button — reuse that pattern: pass `disabled={isReadOnly}` and gray out the Save button when true.

**`src/components/LogEntryInput.tsx`** — 2 edits:

1. Accept optional `disabled?: boolean` prop.
2. Add `disabled={disabled}` to the Save button (alongside existing `isLoading` check). Style: `opacity-50 cursor-not-allowed` when disabled.

**`src/components/MedicationEntryInput.tsx`** — 2 edits:

1. Accept optional `disabled?: boolean` prop.
2. Add `disabled={disabled}` to the Save button, same pattern.

### What stays hidden in read-only
- Onboarding section (template buttons) — demo already has types
- Edit dialog — editing existing entries is a write op
- Create type / medication dialogs

