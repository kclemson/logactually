

## Add Copy-to-Clipboard Button for Workout Samples

### Goal
Add a "Copy" button next to each workout type header so you can quickly copy all sample XML for that type to your clipboard and paste it into the chat.

### Changes

**File: `src/components/AppleHealthExplorer.tsx`**

1. Add a "Copy" button inside each workout type's header row (next to the expand/collapse arrow)
2. On click, concatenate all sample XML strings for that type (separated by newlines) and copy to clipboard via `navigator.clipboard.writeText()`
3. Show brief "Copied!" feedback by toggling button text for ~2 seconds

No other files need to change.

