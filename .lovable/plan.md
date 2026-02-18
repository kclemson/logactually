

# DetailDialog UX Polish -- 8 Refinements

All changes target `src/components/DetailDialog.tsx` plus a small update to `src/pages/WeightLog.tsx`.

## 1. Increase column gap

Change `gap-x-3` to `gap-x-6` in both `FieldViewGrid` (line 95) and `FieldEditGrid` (line 129). More breathing room between the two columns.

## 2. Spell out "Saturated Fat"

In `buildFoodDetailFields` (line 417), change the label from `'Sat Fat'` to `'Saturated Fat'`.

## 3. Auto-collapse other items when entering edit mode

In `enterItemEdit` (line 266), set `expandedIndices` to `new Set([idx])` so only the item being edited stays open. This avoids the awkward Cancel/Save in the middle with more Edit buttons below.

## 4. Hide portion when null/blank in read-only view

Add `'portion'` to `FOOD_HIDE_WHEN_ZERO` (line 401). The existing filter logic already handles null/empty/zero, so this is a one-word addition.

## 5. Remove the X close button

Add `[&>button:last-child]:hidden` to the `DialogContent` className (line 304) to hide the built-in Radix close button. Users close via overlay tap; in edit mode via Cancel/Save.

## 6. Remove border-t from footer entirely

Remove `border-t` from the `DialogFooter` className (line 379) in all modes -- no separator above Edit, Cancel, or Save buttons.

## 7. Deduplicate Name field in group mode + indent expanded content

Two sub-changes:
- In multi-item expanded view mode, filter out the `description` field from the field list so it isn't shown twice (the collapsible header already displays the name). In edit mode, keep it so the user can rename.
- Add `pl-4` left padding to the expanded content div (line 338) to visually indent it under the header, creating a clear parent-child relationship.

## 8. (Covered above -- screenshots confirmed current state)

---

## Technical details

### `FieldViewGrid` (line 95)
- `gap-x-3` becomes `gap-x-6`

### `FieldEditGrid` (line 129)
- `gap-x-3` becomes `gap-x-6`

### `enterItemEdit` (lines 266-269)
Add: `setExpandedIndices(new Set([idx]));`

### Multi-item expanded content (line 338)
- Add `pl-4` to the `<div className="pb-2">` wrapper
- In read-only branch (line 349): filter `description` out of `itemSections` before passing to `FieldViewGrid`

Implementation: compute a filtered sections list:
```typescript
const viewSections = itemSections.map(([name, fields]) => [
  name,
  fields.filter(f => f.key !== 'description'),
] as [string, FieldConfig[]]).filter(([, fields]) => fields.length > 0);
```

### DialogContent (line 304)
Add `[&>button:last-child]:hidden` to className

### DialogFooter (line 379)
Change `"px-4 py-3 border-t flex-shrink-0"` to `"px-4 py-3 flex-shrink-0"`

### buildFoodDetailFields (line 417)
Change `'Sat Fat'` to `'Saturated Fat'`

### FOOD_HIDE_WHEN_ZERO (line 401)
Add `'portion'` to the set

## Files changed

| File | Change |
|------|--------|
| `src/components/DetailDialog.tsx` | All 7 functional changes: column gap, saturated fat label, auto-collapse on edit, hide portion when empty, hide X button, remove border-t, deduplicate name + indent |

