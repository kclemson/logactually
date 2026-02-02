

## Demo Preview Dialog Fixes

Two issues to address based on user feedback.

---

### Issue 1: Focus Outline on Chevron Button

**Problem**: When the dialog opens, focus lands on the `›` chevron button (the first focusable element), showing a white browser default focus outline.

**Root Cause**: The chevron `<button>` in both `FoodItemsTable` and `WeightItemsTable` lacks `focus:outline-none` or custom focus styling. When the Radix Dialog opens, it auto-focuses the first focusable element.

**Fix**: Add `focus:outline-none focus-visible:outline-none` to the chevron button in both table components. This removes the default focus ring while still allowing keyboard navigation.

**Files**: 
- `src/components/FoodItemsTable.tsx` (lines ~423 and ~478)
- `src/components/WeightItemsTable.tsx` (lines ~345 and ~387)

---

### Issue 2: Show User's Original Input

**Current**: Dialog only shows "Here's what would be logged:" and the table.

**Requested**: Add a section showing what the user entered before showing parsed results.

**Design**:
```text
┌─────────────────────────────────────────────────────┐
│ What you entered:                                   │
│ "2 big macs and large fries"                       │
│                                                     │
│ Here's what would be logged:                        │
│ [table...]                                          │
└─────────────────────────────────────────────────────┘
```

**Implementation**: Add a conditional section in `DemoPreviewDialog` that displays `rawInput` when available (saved meals/routines won't have this).

**File**: `src/components/DemoPreviewDialog.tsx`

---

### Files Changed

| File | Change |
|------|--------|
| `src/components/FoodItemsTable.tsx` | Add `focus:outline-none` to chevron buttons |
| `src/components/WeightItemsTable.tsx` | Add `focus:outline-none` to chevron buttons |
| `src/components/DemoPreviewDialog.tsx` | Add "What you entered" section before title |

---

### Technical Details

**Chevron button fix** (both tables have two instances - editable and read-only branches):

```tsx
// Current
className={cn(
  "absolute inset-0 w-[44px] -left-3 flex items-center justify-center text-muted-foreground/60 hover:text-muted-foreground transition-transform text-xl",
  isCurrentExpanded && "rotate-90"
)}

// Updated
className={cn(
  "absolute inset-0 w-[44px] -left-3 flex items-center justify-center text-muted-foreground/60 hover:text-muted-foreground transition-transform text-xl focus:outline-none focus-visible:outline-none",
  isCurrentExpanded && "rotate-90"
)}
```

**DemoPreviewDialog addition**:

```tsx
<DialogHeader>
  {rawInput && (
    <div className="text-sm mb-2">
      <span className="text-muted-foreground">What you entered:</span>
      <p className="mt-1 italic">"{rawInput}"</p>
    </div>
  )}
  <DialogTitle>Here's what would be logged:</DialogTitle>
</DialogHeader>
```

