
## Add Inline Editing to Custom Log Entries

### What changes

Currently, custom log entries are read-only text. After this change, you can tap on any value (text or numeric) to edit it inline -- just like food calories or exercise sets/reps/weight.

### Behavior

**Numeric fields** (for `numeric` and `text_numeric` types):
- Tap to focus -- the field gets a ring highlight
- Delete all content -- the field stays empty (no coercion to 0)
- Press Enter or blur (tap away) -- saves the new value if it's valid and changed; reverts to original if empty
- Press Escape -- reverts without saving

**Text fields** (for `text` and `text_numeric` types):
- Tap to focus with a `contentEditable` span (same pattern as food/exercise descriptions)
- Press Enter or blur -- saves if changed and non-empty; reverts if empty
- Press Escape -- reverts
- No asterisk indicator on text fields (as requested)

**Read-only mode**: All edits blocked; tapping reverts immediately.

### Technical detail

**1. Add `updateEntry` mutation to `src/hooks/useCustomLogEntries.ts`**

Add a new mutation that calls `supabase.from('custom_log_entries').update(...)`:
- Accepts `{ id, numeric_value?, text_value? }`
- Invalidates the `custom-log-entries` query on success

**2. Rewrite `src/components/CustomLogEntryRow.tsx` with inline editing**

Add local editing state following the same `editingCell` pattern from `FoodItemsTable`/`WeightItemsTable`:

- For the **numeric value**: render an `<Input type="number">` with `onFocus` (captures original value), `onChange` (allows empty string), `onKeyDown` (Enter saves, Escape reverts), `onBlur` (saves if valid and changed, reverts if empty). Same ring styling as food/exercise inputs.

- For the **text value**: render a `contentEditable` span with `onFocus` (captures original), `onKeyDown` (Enter/Escape), `onBlur` (save or revert). Same pattern as description editing in food/exercise tables.

- No `*` asterisk indicator on text fields.

- The row layout stays as a flex row: `typeName` on the left, editable value(s) + unit label + delete button on the right.

**3. Pass `onUpdate` callback from `src/pages/OtherLog.tsx`**

Wire the new `updateEntry` mutation through to `CustomLogEntryRow` as an `onUpdate` prop, called with `{ id, numeric_value?, text_value? }`.
