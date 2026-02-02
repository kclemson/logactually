

## Fix Toggle Circle Positioning

### Problem
The toggle circle isn't positioning correctly - it appears inverted (circle on wrong side relative to the on/off state).

### Root Cause
The circle uses `absolute` positioning with `translate-x` transforms, but lacks an explicit `left-0` to anchor the starting position. This causes inconsistent behavior.

### Solution
Add `left-0` to the circle's className to establish a consistent starting position for the transform.

### Change

**File:** `src/pages/Settings.tsx` (line 274)

```typescript
// Before
"absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"

// After  
"absolute left-0 top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
```

This anchors the circle to the left edge, then `translate-x-0.5` nudges it slightly right when off, and `translate-x-6` moves it to the right side when on.

