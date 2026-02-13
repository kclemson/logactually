

## Dropdown + Inline Input Redesign

### Layout (top to bottom)

```text
[date picker]
[logged entries list]
[inline input form -- only visible after selecting a type from the dropdown]
[  Add [dropdown v]    + Add Tracking Type  ]   <-- single row at bottom
```

### Changes

**File: `src/pages/OtherLog.tsx`**

1. **State**: Add `selectedTypeId: string | null` (default null). When the user picks a type from the dropdown, set it. When they submit or cancel, clear it.

2. **Bottom row**: Replace the vertical list of per-type `LogEntryInput` buttons with a single horizontal row containing:
   - A Radix `Select` dropdown (labeled "Add [type v]") listing all log types, sorted by most recent usage. The dropdown defaults to no selection (placeholder "Select type...").
   - A "+ Add Tracking Type" text button beside it on the same row.
   - Use `flex items-center gap-2` to keep them on one line.

3. **Inline input placement**: When `selectedTypeId` is set, render the `LogEntryInput` form *between* the entries list and the bottom row (i.e., in the middle zone, right below the logged items). This keeps the input fields contextually near the entries. Include an X/cancel button to dismiss.

4. **On submit**: Clear inputs but keep `selectedTypeId` set so the user can quickly add another of the same type. Provide cancel (X) to fully dismiss.

5. **Recency sorting**: Derive sort order from the existing `entries` data across all dates. We need a lightweight query for this -- add it to `useCustomLogTypes` (see below).

**File: `src/components/LogEntryInput.tsx`**

- Remove the `isAdding` toggle entirely -- the component always renders as a form (parent controls visibility).
- Add `onCancel?: () => void` prop. Render a small X button that calls it.
- On submit, clear fields but do NOT hide (parent decides visibility).

**File: `src/hooks/useCustomLogTypes.ts`**

- Add a second query fetching most-recent `created_at` per `log_type_id` from `custom_log_entries` (using RPC or a simple select + client-side grouping).
- Return `recentUsage: Record<string, string>` so the page can sort the dropdown.

### Technical details

**Files changed: 3**

| File | Change |
|------|--------|
| `src/pages/OtherLog.tsx` | Replace per-type button list with single-row: Select dropdown + "Add Tracking Type" link. Add `selectedTypeId` state. Render `LogEntryInput` inline between entries and bottom row when a type is selected. |
| `src/components/LogEntryInput.tsx` | Remove `isAdding` toggle. Always show form. Add `onCancel` prop with X button. Keep form visible after submit. |
| `src/hooks/useCustomLogTypes.ts` | Add query for most-recent entry per type. Return `recentUsage` map for dropdown sorting. |

