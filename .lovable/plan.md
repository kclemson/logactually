
## Fix: stabilize the view-mode dropdown position when switching between By Date / By Type

### The problem

The row is currently built with two entirely separate JSX branches:

```
viewMode === 'type'  → [view-select] [type-select] [Log New button]
viewMode === 'date'  → [view-select] [Add custom log teal select]
```

Because the view-mode Select is rendered as part of each branch, React treats them as two separate elements. When you switch modes, the whole row re-renders, the view-mode dropdown is unmounted and remounted at a slightly different position (different `min-w` values, different siblings), and it jumps.

### The fix: hoist the view-mode Select above the branch, let only the right-side controls vary

Restructure the control row so:

1. The view-mode Select is rendered **once**, always first, always `w-[90px]` fixed width — never unmounts on mode switch.
2. A separate right-side area conditionally renders either:
   - **Type mode**: `[type-picker select]` + `[+ Log New button]`
   - **Date mode**: `[Add custom log teal select]`

The outer container stays `flex items-center gap-2 justify-center` but now the view-mode Select is a stable first child, and only what's to its right changes.

### Width decisions

- View-mode Select: `w-[90px]` — "By Date" and "By Type" are both 7 chars, `text-sm`, so 90px is snug but not cramped. Currently it's `min-w-[110px]` / `min-w-[100px]` (different per branch), which is wider than needed.
- Type-picker Select: `min-w-[120px]` — accommodates most log type names.
- Log New button: stays as-is (`h-8` teal).
- "Add custom log" teal Select: stays as-is (`min-w-[140px]`).

### Structural change (pseudocode)

```jsx
{/* Always rendered — stable DOM position */}
<Select value={viewMode} onValueChange={handleViewModeChange}>
  <SelectTrigger className="h-8 text-sm px-2 w-[90px] shrink-0">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="date">By Date</SelectItem>
    <SelectItem value="type">By Type</SelectItem>
  </SelectContent>
</Select>

{/* Right side: changes per mode */}
{viewMode === 'type' ? (
  <>
    <Select value={effectiveTypeId} ...>  {/* type picker */}
    <Button ...>+ Log New</Button>
  </>
) : (
  <Select value={effectiveTypeId} ...>  {/* teal "Add custom log" */}
)}
```

This replaces the current three-way branch (`no log types` / `type mode` / `date mode`) with:
- The onboarding empty-state (no log types) stays as its own branch and shows instead of the controls when there are no log types — that case is unchanged.
- When log types exist, the view-mode select is always shown first, then the right-side controls.

### Only file changed

`src/pages/OtherLog.tsx` — restructuring the controls section (~lines 144–203). No new files, no schema changes.
