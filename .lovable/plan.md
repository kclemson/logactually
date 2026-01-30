

## Add Max Width to Prompt Eval Tools Panel

### Problem
The Prompt Eval Tools panel at the bottom of the screen spans the full viewport width, making the results table extremely wide and difficult to read on large monitors.

### Solution
Add a max-width constraint to the panel content while keeping the border spanning full width for visual consistency.

### Changes Required

**File: `src/components/DevToolsPanel.tsx`**

Update the inner container (line 280) to include a max-width and center alignment:

```tsx
// Before (line 280):
<div className="px-6">

// After:
<div className="mx-auto max-w-5xl px-6">
```

This applies a `max-w-5xl` (1024px) constraint which:
- Keeps the table readable on wide screens
- Centers the content horizontally
- Maintains the border-t spanning full width for visual separation
- Matches a reasonable desktop reading width for dense data tables

### Alternative Widths Considered
- `max-w-4xl` (896px) - Slightly narrower, good for focused reading
- `max-w-6xl` (1152px) - Wider, allows more columns visible
- `max-w-5xl` (1024px) - Sweet spot for data tables with many columns

Recommending `max-w-5xl` as it provides enough room for the many columns while preventing extreme stretching.

