

# Fix: Replace `line-clamp-1` with `truncate` on Group Name Headers

## Problem
`line-clamp-1` on the group name `DescriptionCell` causes two bugs:
- It sets `display: -webkit-box`, which breaks `contentEditable` (clicks select text instead of placing cursor)
- It prevents the span from shrinking as a flex child, so on mobile the `(1 portion)` button gets clipped off-screen

## Fix
Replace `line-clamp-1` with `truncate` in both group header locations. `truncate` uses `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` which:
- Is compatible with `contentEditable` (inline editing works)
- Participates in flex layout properly (name truncates, portion button stays visible)

## Technical Details

### `src/components/FoodItemsTable.tsx`

Two identical one-word changes:

1. **Collapsed header** (line 370): `line-clamp-1` becomes `truncate`
2. **Expanded header** (line 537): `line-clamp-1` becomes `truncate`

No other files affected.

