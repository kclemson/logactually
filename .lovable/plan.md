

## Fix Missing Mobile Insets Across UI Components

### Components Requiring Updates

#### 1. FoodItemsTable.tsx - AlertDialogs (2 instances)
Both "Delete all entries" and "Delete this entry" confirmation dialogs lack mobile inset styling.

**File: `src/components/FoodItemsTable.tsx`**

**Line 259** - Delete All confirmation:
```tsx
// FROM:
<AlertDialogContent>

// TO:
<AlertDialogContent className="left-4 right-4 translate-x-0 w-auto max-w-[calc(100vw-32px)] sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-lg">
```

**Line 489** - Delete Entry confirmation:
```tsx
// FROM:
<AlertDialogContent>

// TO:
<AlertDialogContent className="left-4 right-4 translate-x-0 w-auto max-w-[calc(100vw-32px)] sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-lg">
```

#### 2. Settings.tsx - Delete Meal Popover
The popover uses `side="left"` which causes overflow on mobile. Change to `side="top"` for better mobile behavior.

**File: `src/pages/Settings.tsx`**

**Line 123**:
```tsx
// FROM:
<PopoverContent className="w-64 p-4" side="left" align="center">

// TO:
<PopoverContent className="w-64 p-4" side="top" align="end">
```

Changes:
- `side="top"` - Opens above the trigger instead of to the left (prevents horizontal overflow)
- `align="end"` - Right-aligns with the trash icon for visual balance

---

### Files to Change

| File | Changes |
|------|---------|
| `src/components/FoodItemsTable.tsx` | Add mobile inset classes to both AlertDialogContent instances (lines 259, 489) |
| `src/pages/Settings.tsx` | Change popover positioning from `side="left"` to `side="top"` (line 123) |

---

### Technical Details

The responsive inset pattern works as follows:
- **Mobile (default)**: `left-4 right-4` creates 16px margins, `translate-x-0` removes centering transform, `w-auto` lets content size naturally, `max-w-[calc(100vw-32px)]` ensures it never exceeds viewport minus margins
- **Desktop (sm:)**: Restores standard centered positioning with `left-[50%] translate-x-[-50%]` and `max-w-lg` constraint

