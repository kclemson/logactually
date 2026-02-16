

# Fix: Anchor CalorieTargetDialog to top on all screen sizes

## Problem

The CalorieTargetDialog uses vertical centering (`top-50% translate-y-[-50%]`) on desktop. When content expands or collapses (toggling the enable switch, switching modes, equation breakdown appearing), the dialog visibly shifts up and down on the Y axis because its center point changes. This is disorienting.

The mobile fix already anchors the dialog near the top of the viewport (`top-12 translate-y-0`), which avoids this problem. Desktop should behave the same way.

## Solution

Remove the `sm:top-[50%]` and `sm:translate-y-[-50%]` breakpoint overrides from the `DialogContent` className, so the dialog stays top-anchored at all screen sizes. Keep the horizontal centering on desktop (`sm:left-[50%] sm:translate-x-[-50%]`).

## Technical Detail

**File: `src/components/CalorieTargetDialog.tsx` (line 134)**

Change the className from:

```
left-2 right-2 top-12 translate-x-0 translate-y-0 w-auto max-w-[calc(100vw-16px)] max-h-[85vh] overflow-y-auto p-4
sm:left-[50%] sm:right-auto sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:w-full sm:max-w-md
```

To:

```
left-2 right-2 top-12 translate-x-0 translate-y-0 w-auto max-w-[calc(100vw-16px)] max-h-[85vh] overflow-y-auto p-4
sm:left-[50%] sm:right-auto sm:translate-x-[-50%] sm:w-full sm:max-w-md
```

Removes `sm:top-[50%]` and `sm:translate-y-[-50%]` so the dialog stays anchored at `top-12` on all viewports. Horizontal centering on desktop is preserved.

