

# Fix dialog cropping on desktop

The `max-h-[85vh] overflow-y-auto` fix addressed vertical overflow, but the actual problem is **horizontal** -- the dialog at `sm:max-w-md` (448px) is too narrow for:
1. Three checkboxes in a row ("Generate Food", "Generate Exercise", "Generate Custom Logs")  
2. Four footer buttons ("Cancel", "Saved Only", "Custom Logs Only", "Populate All")

## Changes in `src/components/PopulateDemoDataDialog.tsx`

### 1. Widen the dialog
Change `sm:max-w-md` to `sm:max-w-lg` (512px), giving enough room for the content.

### 2. Allow checkbox row to wrap
Add `flex-wrap` to the options checkbox container (line 155) so if the window is still tight, labels wrap instead of clipping.

### 3. Allow footer buttons to wrap  
Add `flex-wrap` to the `DialogFooter` (line 265) so the four buttons can wrap to a second row if needed.

## Technical details

- **File**: `src/components/PopulateDemoDataDialog.tsx`
- **Line 87**: `sm:max-w-md` becomes `sm:max-w-lg`
- **Line 155**: Add `flex-wrap` to the checkboxes flex container
- **Line 265**: Add `flex-wrap` to `DialogFooter`

