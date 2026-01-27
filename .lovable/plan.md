

## Fix "Add New Meal" Button Styling

### Problem

The current "Add New Meal" button uses `variant="outline"` which creates a full-width bordered button. Combined with:
- The `border-b` on its container div
- The popover's own border
- The `border-b` dividers between meal items

This creates a "cacophony of lines" that looks cluttered, especially where rounded and non-rounded corners meet.

### Solution

Style the "Add New Meal" button to match the meal list items - a simple text row with hover background, no border. This keeps visual consistency and reduces line noise.

### Changes

**File: `src/components/SavedMealsPopover.tsx`**

Replace the outlined button with a ghost-styled row that matches the meal items:

```tsx
// Before (lines 80-92):
{onCreateNew && (
  <div className="p-2 border-b">
    <Button variant="outline" size="sm" className="w-full justify-start" ...>
      <Plus ... /> Add New Meal
    </Button>
  </div>
)}

// After:
{onCreateNew && (
  <button
    onClick={handleCreateNew}
    className="w-full text-left px-3 py-2 hover:bg-accent transition-colors border-b flex items-center gap-2"
  >
    <Plus className="h-4 w-4 text-muted-foreground" />
    <span className="font-medium">Add New Meal</span>
  </button>
)}
```

Also update the empty state button (lines 60-68) to use `variant="ghost"` instead of `variant="outline"`.

### Visual Result

- No extra border around the button
- Matches the meal row styling (same padding, same hover effect)
- Only one divider line between "Add New Meal" and the first saved meal
- Cleaner, less cluttered appearance

