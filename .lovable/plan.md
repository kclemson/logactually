

## Fix font size hierarchy in the Create Log Type dialog

### Problem
There are 5 font sizes creating a muddy hierarchy. The field labels ("Name", "Type", "Unit") render at 16px -- the same as the dialog description -- making them feel too prominent and flattening the visual distinction between the header area and the form content.

### Current sizes (mobile)
- Title: 18px
- Description: 16px
- Field labels (Name/Type/Unit): 16px (same as description -- problem)
- Radio labels (Numeric, etc.): 14px
- Radio descriptions: 12px

### Proposed fix: clean 3-tier hierarchy
- Title: 18px (unchanged)
- Description: 16px (unchanged)
- Field labels: 14px (add `text-sm` to each Label)
- Radio labels: 14px (unchanged, now matches field labels)
- Radio descriptions: 12px (unchanged)

This reduces the sizes from 5 to 4, and more importantly creates a clear step-down from header to form content.

### Technical details

**File: `src/components/CreateLogTypeDialog.tsx`**

Add `text-sm` class to the three Label components:
- Line 47: `<Label htmlFor="log-type-name" className="shrink-0">` becomes `className="shrink-0 text-sm"`
- Line 57: `<Label>Type</Label>` becomes `<Label className="text-sm">Type</Label>`
- Line 81: `<Label htmlFor="log-type-unit" className="shrink-0">` becomes `className="shrink-0 text-sm"`

No other files need changes.
