

# Right-justify the "Details" link in the expanded panel

## Problem

The "Details" link blends in with the other left-aligned content (raw input, save-as link), making it easy to miss.

## Fix

Wrap the existing left-aligned content and the "Details" button in a flex container with `justify-between`, so the left content stays left and "Details" floats to the bottom-right of the panel.

### File: `src/components/EntryExpandedPanel.tsx`

Change the inner `div` (line 45) from a simple `space-y-1.5` column to a flex layout with two children:

1. A left `div` containing `extraContent`, "Logged as", and "Save as" (the existing content minus Details)
2. The "Details" button, self-aligned to the bottom-right

```tsx
<div className="col-span-full pl-6 pr-4 pt-2 pb-1 flex items-end justify-between gap-2">
  <div className="space-y-1.5">
    {extraContent}
    {/* "Logged as" line */}
    {!isFromSaved && rawInput && (
      <p className="text-xs text-muted-foreground italic">
        Logged as: {rawInput}
      </p>
    )}
    {isFromSaved ? (
      <p className="text-xs text-muted-foreground italic">
        From saved {typeLabel}: ...
      </p>
    ) : onSaveAs && (
      <button ...>Save as {typeLabel}</button>
    )}
  </div>

  {onShowDetails && (
    <button
      onClick={onShowDetails}
      className="text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0"
    >
      Details
    </button>
  )}
</div>
```

Key changes:
- Parent becomes `flex items-end justify-between` so Details anchors bottom-right
- Added `pr-4` for right padding so the link doesn't hug the edge
- Added `shrink-0` on the Details button so it never gets squeezed
- No logic changes, just layout

