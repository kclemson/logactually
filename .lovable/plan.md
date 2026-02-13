

## Fix Custom Log Entry Layout and Delete Button on Mobile

### File: `src/components/CustomLogEntryRow.tsx`

Two issues to fix:

### 1. Delete button always visible on mobile
The delete button currently uses `opacity-0 group-hover:opacity-100`, hiding it on all screen sizes until hover. Food and Exercise logs use `md:opacity-0 md:group-hover:opacity-100` instead -- always visible on mobile, hover-only on desktop (md+).

**Change (line 215):**
```
"h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
```
to:
```
"h-6 w-6 p-0 text-muted-foreground hover:text-destructive hover:bg-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity"
```
This matches the exact pattern used in `FoodItemsTable.tsx` and `WeightItemsTable.tsx`.

### 2. Multiline textarea width overflow on mobile
The textarea has a fixed `w-[280px]` which, combined with the label and delete button, can push the delete button off-screen on narrow viewports (375px). Change to a responsive approach that fills available space.

**Change in MultilineTextArea className (line 41):**
```
"w-[280px] min-h-[60px]"
```
to:
```
"w-full min-w-0 min-h-[60px]"
```

**Wrap the content area to flex-fill (line 145):**
Change the inner div from:
```tsx
<div className={cn("flex gap-2", isMultiline ? "items-start" : "items-center")}>
```
to:
```tsx
<div className={cn("flex gap-2", isMultiline ? "items-start flex-1 min-w-0" : "items-center")}>
```

This lets the multiline textarea fill available width after the label, keeping the delete button visible and in-line. Also add an `aria-label` to the delete button for accessibility consistency.

### Also update LogEntryInput.tsx textarea width
Change the input textarea (line 57) from `w-[280px]` to `w-full min-w-0` so it also adapts to the available space on mobile rather than a fixed width.

