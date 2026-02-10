

## Merge Header + Date Picker into One Row

Combine the "Import from Apple Health" header row and the "Import from" date row into a single row:

**`Import from Apple Health (see how) from:  [date picker]`**

### Change in `src/components/AppleHealthImport.tsx`

Replace the two separate rows (lines 356-396) with one row:

```
<div className="flex items-center justify-between gap-2">
  <p className="text-xs text-muted-foreground">
    Import from Apple Health{" "}
    <button onClick={toggle} className="underline ...">
      {showInstructions ? "(hide)" : "(see how)"}
    </button>
    {" "}from:
  </p>
  <input type="date" ... />
</div>
```

- The label, "(see how)" link, and "from:" are all inline text on the left
- Date picker stays right-aligned
- The collapsible instructions block remains unchanged below
- On narrow screens the left text wraps naturally; `flex-shrink-0` on the date input keeps it from collapsing

One row removed, no other changes.

