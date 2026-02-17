

# Fix CalorieTargetDialog scrolling when mobile keyboard opens

## Problem

When a user taps an input field inside the Daily Calorie Target dialog on mobile, the virtual keyboard appears and shrinks the visible area. The dialog uses `max-h-[85vh]`, but `vh` refers to the **layout viewport** (which doesn't change when the keyboard opens), so the dialog overflows the actual visible space and content gets cut off. The dialog technically scrolls, but users can't tell because the overflow is hidden behind the keyboard.

## Solution

Replace `vh` with `dvh` (dynamic viewport height), which automatically adjusts when the mobile keyboard appears or disappears. This is well-supported in modern browsers (Safari 15.4+, Chrome 108+). As a fallback for older browsers, we keep the `vh` value as well.

## Changes

**File: `src/components/CalorieTargetDialog.tsx` (line 165)**

Change the DialogContent className from:
```
max-h-[85vh]
```
to:
```
max-h-[85vh] max-h-[85dvh]
```

The second declaration overrides the first in browsers that support `dvh`, while older browsers gracefully fall back to `vh`.

This is a single-line, one-property change.

