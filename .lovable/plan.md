

## Fix Multiline Textarea Position

### File: `src/components/CustomLogEntryRow.tsx`

**Problem**: The row uses `flex justify-between`, which pushes the textarea to the far-right corner, away from the "Journal" label. The textarea should appear right next to the label.

**Fix**: For multiline rows, change from `justify-between` to `gap-3` so the label and textarea sit side-by-side. Keep `justify-between` for all other row types (numeric, text, text_numeric) since that layout works well for them.

### Technical detail

Update line 141 from:
```tsx
<div className={cn("flex justify-between py-2 group", (isMultiline || valueType === 'text') ? "items-start" : "items-center")}>
```
to:
```tsx
<div className={cn("flex py-2 group", 
  isMultiline ? "items-start gap-3" : (valueType === 'text') ? "items-start justify-between" : "items-center justify-between"
)}>
```

This keeps `justify-between` for numeric/text/text_numeric rows but uses `gap-3` (no justify-between) for multiline rows, placing the textarea directly next to the "Journal" label.
