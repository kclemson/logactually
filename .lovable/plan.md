

## Other Log Page UX Improvements

Four changes to make the entry flow more intuitive and visually polished.

### 1. Dropdown shows "Log Weight", "Log Mood", etc.

Change the Select dropdown items and the trigger display to prefix each type name with "Log". The placeholder becomes "Log..." and each item reads "Log Weight", "Log Mood", etc. This makes the selected action immediately visible without opening the dropdown.

### 2. Remove the standalone + submit button from LogEntryInput

The `+` (Plus) icon button currently acts as the submit button, which is confusing. Replace it with a text "Save" button so the purpose is clear. The form also submits on Enter, so the button is secondary but should still be understandable.

### 3. Visually distinguish the bottom control row

- Wrap the "+ Add Tracking Type" button in a matching bordered style (same `border border-input rounded-md` as the Select trigger) so both controls look like peers.
- Center the row horizontally with `justify-center`.

### 4. After creating a new tracking type, pre-select it in the dropdown

In the `handleCreateType` callback, use the `onSuccess` result to set `selectedTypeId` to the newly created type's ID, so the user immediately sees "Log [NewType]" selected and can start logging.

---

### Technical details

**File: `src/pages/OtherLog.tsx`**

- Dropdown items: change `{lt.name}` to `Log {lt.name}` in SelectItem children.
- Placeholder: change `"Add entry..."` to `"Log..."`.
- Bottom row styling: add `justify-center` to the flex container. Wrap the "Add Tracking Type" button in a bordered container matching SelectTrigger styling (`h-8 px-3 rounded-md border border-input text-sm`).
- `handleCreateType` onSuccess: after closing dialog, call `setSelectedTypeId(data.id)` using the returned type from the mutation. Update the callback to receive the mutation result.

**File: `src/components/LogEntryInput.tsx`**

- Replace the Plus icon submit button with a text "Save" button (`<Button type="submit" variant="ghost" size="sm">Save</Button>`).

**Files changed: 2**

| File | Change |
|------|--------|
| `src/pages/OtherLog.tsx` | Dropdown labels to "Log X", center bottom row, style Add Tracking Type button, pre-select new type after creation |
| `src/components/LogEntryInput.tsx` | Replace + icon with "Save" text button |
