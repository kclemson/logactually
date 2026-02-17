

# DescriptionCell Component — Updated Plan

## Key Clarification: Editable vs Non-Editable

FoodItemsTable and WeightItemsTable use a full `{editable ? ... : ...}` ternary in the parent. The non-editable branch renders a plain `<span>` with no interactivity. DescriptionCell only gets rendered inside the editable branch for those two callers.

The `readOnly` prop is only needed by CustomLogEntryRow (for demo/read-only accounts). SavedItemRow is always editable.

## Component API (refined)

```text
DescriptionCell
  Props:
  - value: string               -- text to display
  - onSave: (newValue) => void  -- called on commit (blur or Enter)
  - readOnly?: boolean          -- blocks saves, reverts on blur (default: false)
  - onReadOnlyAttempt?: () => void  -- trigger overlay in demo mode
  - className?: string          -- extra classes on the span
  - title?: string              -- tooltip
  - validate?: (newValue) => boolean  -- pre-save check (SavedItemRow uses for duplicates)
  - onValidationFail?: () => void     -- called when validate returns false
  - children?: ReactNode        -- inline decorations AFTER the text (portion badge, * indicator)
```

## Who uses what

| Caller | readOnly | validate | children |
|--------|----------|----------|----------|
| FoodItemsTable (editable branch only) | no | no | portion button, edited indicator |
| WeightItemsTable (editable branch only) | no | no | edited indicator |
| CustomLogEntryRow | yes (from isReadOnly prop) | no | no |
| SavedItemRow | no | yes (duplicate name check) | no |

## File Changes

### 1. New: `src/components/DescriptionCell.tsx` (~60 lines)

A `contentEditable` span with:
- `useRef` to capture original text on focus
- Blur: save if changed and valid; revert if empty or validation fails
- Enter: prevent default, blur (triggers save)
- Escape: revert to original, blur
- Read-only mode: revert on blur, optionally call `onReadOnlyAttempt`
- Ref callback syncs `textContent` with `value` prop when not focused

### 2. Update: `src/components/FoodItemsTable.tsx`

Replace lines 312-339 (the `contentEditable` span + portion button + edited indicator) with DescriptionCell. The wrapping div with `focus-within:ring-2` stays.

Remove `onSaveDescription` from the `useInlineEdit` call. The save callback moves inline:
```text
onSave={(desc) => {
  onUpdateItem?.(index, 'description', desc);
  if (item.portion) onUpdateItem?.(index, 'portion', '');
}}
```

Calorie-to-PCF scaling is NOT affected -- that lives in `onSaveNumeric`, completely separate.

### 3. Update: `src/components/WeightItemsTable.tsx`

Same pattern as FoodItemsTable. Replace lines 320-336 with DescriptionCell. Remove `onSaveDescription` from `useInlineEdit`.

### 4. Update: `src/components/CustomLogEntryRow.tsx`

Replace the `contentEditable` span (lines ~235-251) with DescriptionCell, passing `readOnly={isReadOnly}`. Delete `textOriginalRef`, `handleTextFocus`, `handleTextBlur`, `handleTextKeyDown` (~20 lines removed).

### 5. Update: `src/components/SavedItemRow.tsx`

Replace the name-editing `contentEditable` div (lines ~79-105) with DescriptionCell, using `validate` and `onValidationFail` for duplicate detection. Delete `originalNameRef` and `handleSave`. The `isDuplicateName` helper and `flashError` state remain local.

### 6. Update: `src/hooks/useInlineEdit.ts`

Remove `onSaveDescription`, `descriptionOriginalRef`, and `getDescriptionEditProps`. The hook becomes purely about numeric inline editing (~30 lines removed).

## What stays unchanged

- The `{editable ? ... : ...}` ternary in FoodItemsTable and WeightItemsTable -- the non-editable branch (plain span) is untouched
- The wrapping div with `focus-within:ring-2` stays in each caller
- All numeric editing via `useInlineEdit` is unchanged
- Calorie-to-PCF scaling logic is unchanged
- Chevron/entry-divider rendering stays in the parent
- Mobile vs desktop: no differences needed (contentEditable works identically)

## Rollout order

1. Create `DescriptionCell.tsx`
2. Wire into all four callers simultaneously
3. Clean up `useInlineEdit` (remove description code)

