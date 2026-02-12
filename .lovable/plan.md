

## Move Resolved Indicator Inline with Date

### File: `src/components/FeedbackForm.tsx`

Change the date line (currently around line 119) from:

```tsx
<span className="text-xs text-muted-foreground">
  {format(parseISO(item.created_at), "MMM d, yyyy")}
</span>
```

to:

```tsx
<span className="text-xs text-muted-foreground">
  {format(parseISO(item.created_at), "MMM d, yyyy")}
</span>
{item.resolved_at && !item.response && (
  <span className="text-xs text-green-600 dark:text-green-400">✓ Resolved</span>
)}
```

Then remove the standalone resolved block below (lines 136-140) that currently renders it as a separate indented section.

The resolved badge inside the response block (for items with both a response and resolved status) stays unchanged.

