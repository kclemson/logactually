

# Responsive Admin Actions: Inline on Desktop, Second Row on Mobile

## Approach

Merge the metadata row and actions row back into a single `flex flex-wrap` container. Use standard flex utilities to control wrapping behavior:

- **Chevron**: Add `md:order-last` so it renders last on desktop (after actions) but stays in its natural position on mobile
- **Actions wrapper**: Use `w-full md:w-auto md:ml-auto` -- `w-full` forces a line break on mobile; `md:w-auto md:ml-auto` keeps it inline and right-aligned on desktop

### Desktop layout (single row)
```text
[#id] [date] [user] [status] --------ml-auto-------- [Reply] [Resolve] [Resolve Fixed] [v]
```

### Mobile layout (two rows)
```text
[#id] [date] [user] [status]                                                          [v]
[Reply] [Resolve] [Resolve Fixed]
```

## Changes

### File: `src/pages/Admin.tsx`

**Open feedback section (lines 395-433):**
Remove the outer wrapper `<div>` and merge into one `flex flex-wrap` container:

```tsx
<div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
  <span className="text-muted-foreground font-mono">#{f.feedback_id}</span>
  <span className="text-muted-foreground">{format(...)}</span>
  <span className="text-muted-foreground">User #{f.user_number}</span>
  {/* status badges (Active / Response) -- unchanged */}
  <ChevronDown className="h-3 w-3 text-muted-foreground transition-transform ml-auto md:ml-0 md:order-last ..." />
  {replyingToId !== f.id && (
    <div className="flex items-center gap-2 w-full md:w-auto md:ml-auto">
      <button ...>Reply</button>
      <button ...>Resolve</button>
      <button ...>Resolve Fixed</button>
    </div>
  )}
</div>
```

Key class changes:
- Outer div: `flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs` (replaces two nested divs)
- ChevronDown: add `md:ml-0 md:order-last` (keeps `ml-auto` for mobile, loses it on desktop where actions take that role, renders last on desktop)
- Actions wrapper: `w-full md:w-auto md:ml-auto` (replaces `mt-0.5` second-row div)

**Resolved feedback section (lines 505-529):**
Same pattern -- merge into single flex-wrap container, same classes on chevron and actions wrapper (just one "Unresolve" button).

No new files, no new dependencies, no CSS changes.
