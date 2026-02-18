

# Add breathing room around the X close button in DetailDialog

## Problem

The X close button sits at `right-4 top-4` (from the base `dialog.tsx` component), but the DetailDialog uses `p-0` on its content wrapper, so the button crowds into the first row of content (the Name field).

## Fix

Increase the top padding on the `DialogHeader` from `pt-4` to `pt-6`. This pushes the content down slightly, giving the X button (which is absolutely positioned at `top-4`) visual breathing room above the first field row without needing to touch the shared dialog component.

### Technical detail

**`src/components/DetailDialog.tsx` line 476:**
```
DialogHeader className="px-4 pt-4 pb-2 ..."
                            ^^^^
Change to:          "px-4 pt-6 pb-2 ..."
```

This adds 8px of extra space above the header content, so the X button no longer feels jammed against the Name label.

