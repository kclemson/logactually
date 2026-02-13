

## Add Smaller Unit Font Size

As part of the grid layout restructuring (already approved), also reduce the unit label font size from `text-sm` to `text-xs` for a more compact display. Since units are non-editable labels, a smaller size helps them recede visually and saves horizontal space.

### Technical detail

**File: `src/components/CustomLogEntryRow.tsx`** (line 203)

Change:
```tsx
<span className="text-sm text-muted-foreground">{unitLabel}</span>
```
to:
```tsx
<span className="text-xs text-muted-foreground">{unitLabel}</span>
```

This applies within the grid column for units, keeping the value itself at `text-sm` while the unit shrinks to `text-xs`. This will be implemented alongside the grid layout and grouped entries changes from the previously approved plan.
