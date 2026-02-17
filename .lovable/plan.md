

# Add multi-item mode to DetailDialog + styling fixes

## What changes

### 1. DetailDialog gains a multi-item list/drill-down mode

Currently `DetailDialog` accepts a single `values` object. For grouped food entries, clicking "Details" only shows the first item -- confusing when the group has multiple items.

The fix: add optional `items` and `onSaveItem` props alongside the existing single-item props. When `items` is provided with more than one entry, the dialog initially renders a **summary list** showing each item's name, portion, and calories. Tapping an item drills into the existing single-item detail/edit view for that specific item. A back arrow in the header returns to the list.

Internal state: `selectedIndex: number | null` -- `null` means "show list", a number means "show single item at that index".

### 2. Soften the bold value styling

Remove `font-medium` from the read-only value spans (line 190) so values render at normal weight. The right-alignment and foreground color already differentiate them from labels.

### 3. Hide zero-value secondary nutrition fields in view mode

Fields like fiber, sugar, saturated fat, sodium, cholesterol are often 0. In view mode, filter them out when their value is 0/null/undefined. Edit mode still shows all fields so users can set values.

---

## Technical details

### File: `src/components/DetailDialog.tsx`

**Props change:**

```typescript
export interface DetailDialogProps {
  // ... existing props unchanged
  
  // NEW: multi-item mode (optional)
  items?: Record<string, any>[];
  onSaveItem?: (itemIndex: number, updates: Record<string, any>) => void;
  buildFields?: (item: Record<string, any>) => FieldConfig[];
  /** Fields to hide in view mode when value is 0/null */
  hideWhenZero?: Set<string>;
}
```

When `items` is provided with length > 1, the dialog uses multi-item mode. When length === 1 or `items` is not provided, it behaves exactly as today (single-item mode using `values`/`fields`/`onSave`).

**New internal state:**

```typescript
const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
```

Reset to `null` when dialog closes (alongside existing `editing`/`draft` resets).

**List view rendering** (when `selectedIndex === null` and multi-item mode):

- Title shows the group name (passed via existing `title` prop)
- Body renders a compact list of items, each as a tappable row showing:
  - Description (left)
  - Calories (right)
  - A subtle chevron or tap affordance
- Tapping a row sets `selectedIndex` to that item's index
- Footer: no Edit button (editing happens at item level)

**Drill-down view** (when `selectedIndex !== null`):

- Header shows a back button (ChevronLeft) + item name
- Body/footer render exactly as current single-item view
- `values` becomes `items[selectedIndex]`, `fields` becomes `buildFields(items[selectedIndex])`
- On save, calls `onSaveItem(selectedIndex, updates)` instead of `onSave(updates)`
- After save, returns to list view (`setSelectedIndex(null)`)

**Styling fix** (line 190):

```tsx
// Before:
<span className="text-sm font-medium text-right">

// After:
<span className="text-sm text-right">
```

**Zero-value hiding** in the view-mode loop:

```tsx
const FOOD_HIDE_WHEN_ZERO = new Set(['fiber', 'sugar', 'saturated_fat', 'sodium', 'cholesterol']);

// In view-mode section rendering, filter:
{sectionFields
  .filter(field => {
    if (!hideWhenZero?.has(field.key)) return true;
    const val = values[field.key];
    return val !== 0 && val !== null && val !== undefined;
  })
  .map(field => (...))}
```

### File: `src/components/FoodItemsTable.tsx`

**Change `onShowDetails` call** (around line 1003-1008):

Instead of passing `firstIdx`, pass the boundary's start and end indices so the parent can extract all items:

```typescript
onShowDetails={onShowDetails && currentEntryId
  ? () => {
      const boundary = entryBoundaries?.find(b => b.entryId === currentEntryId);
      onShowDetails(currentEntryId!, boundary?.startIndex ?? index, boundary?.endIndex);
    }
  : undefined}
```

Update `onShowDetails` prop type to include optional `endIndex`:

```typescript
onShowDetails?: (entryId: string, startIndex: number, endIndex?: number) => void;
```

### File: `src/pages/FoodLog.tsx`

**Update `handleShowDetails`** to detect multi-item vs single-item:

```typescript
const [detailDialogItem, setDetailDialogItem] = useState<
  | { mode: 'single'; index: number; entryId: string }
  | { mode: 'group'; startIndex: number; endIndex: number; entryId: string }
  | null
>(null);

const handleShowDetails = useCallback((entryId: string, startIndex: number, endIndex?: number) => {
  if (endIndex !== undefined && endIndex > startIndex) {
    setDetailDialogItem({ mode: 'group', startIndex, endIndex, entryId });
  } else {
    setDetailDialogItem({ mode: 'single', index: startIndex, entryId });
  }
}, []);
```

**Update DetailDialog rendering** (around line 840):

- Single mode: same as today
- Group mode: pass `items` array (slice of `displayItems`), `buildFields={buildFoodDetailFields}`, `onSaveItem` callback, and `hideWhenZero={FOOD_HIDE_WHEN_ZERO}`

### File: `src/pages/WeightLog.tsx`

No changes needed -- exercise entries already pass single items. The multi-item mode is opt-in via the `items` prop.

