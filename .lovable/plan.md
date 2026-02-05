

## Plan: Reduce Dialog-Specific Padding (Step 1b)

### Padding Sources Identified (Dialog-Only)

Looking at the current SaveMealDialog structure:

| Line | Element | Current | Issue |
|------|---------|---------|-------|
| 100 | DialogContent | `p-6` (24px) inherited | Large outer padding |
| 107 | Main content wrapper | `py-4` (16px) | Extra vertical gap |
| 108 | Name input section | `space-y-2` | Fine |
| 135 | "Add more" section | `space-y-3 pt-2` | Extra top padding |

### Proposed Changes

#### SaveMealDialog.tsx

1. **Reduce DialogContent padding on mobile** (line 100):
   ```tsx
   // Add: p-4 sm:p-6
   className="... p-4 sm:p-6 ..."
   ```

2. **Reduce main content vertical padding** (line 107):
   ```tsx
   // Before
   <div className="space-y-4 py-4">
   
   // After - reduce py-4 to py-2
   <div className="space-y-3 py-2">
   ```

3. **Reduce "Add more" section top padding** (line 135):
   ```tsx
   // Before
   <div className="space-y-3 pt-2 border-t">
   
   // After - reduce space-y-3 to space-y-2
   <div className="space-y-2 pt-2 border-t">
   ```

#### SaveRoutineDialog.tsx

Apply the same changes for consistency.

### Summary of Changes

| Element | Before | After |
|---------|--------|-------|
| Dialog outer padding | `p-6` | `p-4 sm:p-6` |
| Content wrapper | `space-y-4 py-4` | `space-y-3 py-2` |
| "Add more" section | `space-y-3` | `space-y-2` |

### Files Modified

| File | Changes |
|------|---------|
| `src/components/SaveMealDialog.tsx` | Reduce padding values |
| `src/components/SaveRoutineDialog.tsx` | Same padding reductions |

### What This Achieves

- ~16px less vertical padding on the content area
- Tighter spacing between entries in "Add more" section
- More compact mobile layout with `p-4` instead of `p-6`
- Still no changes to shared FoodItemsTable/WeightItemsTable

