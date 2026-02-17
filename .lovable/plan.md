

# Rename label + fix dialog cropping

Two changes in `src/components/PopulateDemoDataDialog.tsx`:

## 1. Rename "Generate Weights" to "Generate Exercise"

Line 172: change the label text from "Generate Weights" to "Generate Exercise". The state variable `generateWeights` stays the same since it maps to the edge function parameter.

## 2. Fix dialog cropping with scrollable content

The dialog has a lot of content (date pickers, checkboxes, inputs, result display, footer buttons) that can overflow the viewport.

Add `max-h-[85vh] overflow-y-auto` to the `DialogContent` className (line 87), following the project's established mobile dialog pattern.

```
Before: className="sm:max-w-md"
After:  className="sm:max-w-md max-h-[85vh] overflow-y-auto"
```

## Technical details

- **File**: `src/components/PopulateDemoDataDialog.tsx`
- **Line 87**: Add `max-h-[85vh] overflow-y-auto` to DialogContent
- **Line 172**: Change label text "Generate Weights" to "Generate Exercise"

