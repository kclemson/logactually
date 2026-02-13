

## Make font weights consistent across the Custom page controls

### Problem
The Select trigger ("Log Weight") renders at `font-weight: normal` (400) while the Button components ("Add Custom Log Type", "Save") render at `font-medium` (500). This creates a subtle but noticeable inconsistency.

### Fix
Add `font-medium` to the SelectTrigger in `src/pages/OtherLog.tsx` so it matches the buttons.

### Technical detail

**File: `src/pages/OtherLog.tsx`**

On the SelectTrigger (currently around line 115), change:
```
className="h-8 text-sm w-auto min-w-[140px]"
```
to:
```
className="h-8 text-sm font-medium w-auto min-w-[140px]"
```

One line, one file. No other changes needed.
