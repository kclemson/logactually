

# Fix: Remove Unnecessary Button Font-Size Override in Mobile CSS

## Problem
The global mobile CSS rule explicitly sets `font-size: 0.875rem` on `button` and `[role="button"]` elements. This prevents Tailwind size classes (like `text-xs`) from applying to buttons on mobile. The rule exists alongside the iOS zoom-prevention rules for inputs, but buttons don't trigger iOS auto-zoom -- only `input`, `textarea`, and `select` do. So the button rule is unnecessary and actively causes problems.

## Changes

### File: `src/index.css` (lines 156-161)

Remove the `button` / `[role="button"]` block from the mobile media query:

```css
/* REMOVE this block: */
button,
[role="button"] {
  font-size: 0.875rem; /* 14px */
}
```

The `input`, `textarea`, `select` rule above it stays -- that's the one actually preventing iOS zoom.

### File: `src/pages/Admin.tsx`

Keep the current two-row layout with action links on a second row, but change `text-[10px]` to `text-xs` (12px) on both the open and resolved feedback action rows. With the CSS override removed, `text-xs` will now apply correctly on all viewports.

## Why this is the right fix
- Buttons don't trigger iOS auto-zoom (only focusable text inputs do)
- Removing the rule lets Tailwind classes work naturally on buttons everywhere
- No `!important` hacks, no element swaps, no `role="button"` workarounds
- Other buttons throughout the app inherit from `body` font-size anyway, so behavior is unchanged for them

