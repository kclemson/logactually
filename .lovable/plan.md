
# Fix: "Log New" Button Wrapping in By Meds View

## Root Cause

The `SelectTrigger` component in `src/components/ui/select.tsx` has this base class:

```
[&>span]:line-clamp-1
```

This applies `-webkit-line-clamp: 1` and `display: -webkit-box` to **every direct `<span>` child**. Our "Log New" trigger passes its content as a `<span>`:

```tsx
<SelectTrigger ...>
  <span className="flex items-center gap-1 whitespace-nowrap">
    <Plus className="h-3 w-3 shrink-0" />
    Log New
  </span>
</SelectTrigger>
```

`line-clamp-1` overrides `whitespace-nowrap` by forcing `display: -webkit-box`, which collapses the span and causes the content to wrap before the chevron icon.

## Fix

Two small changes to `OtherLog.tsx` — no changes to the shared `select.tsx` component (which would affect every select in the app):

**1. Stop using a `<span>` wrapper** — pass the icon and text as direct React children instead. Or, easier: add `[&>span]:!whitespace-nowrap [&>span]:!overflow-visible` to the trigger className to override the line-clamp for this specific trigger.

The cleanest approach is to override the problematic utility on this specific trigger:

```tsx
<SelectTrigger className="h-8 text-sm font-medium w-auto bg-teal-500 text-white border-teal-500 hover:bg-teal-600 shrink-0 [&>span]:!overflow-visible [&>span]:![display:flex] [&>span]:items-center [&>span]:gap-1">
  <Plus className="h-3 w-3 shrink-0" />
  Log New
</SelectTrigger>
```

But even simpler: just don't use a `<span>` at all — pass the icon and text as direct children of the trigger (not wrapped in a span), so `[&>span]:line-clamp-1` never fires:

```tsx
<SelectTrigger className="h-8 text-sm font-medium flex items-center gap-1 w-auto bg-teal-500 text-white border-teal-500 hover:bg-teal-600 shrink-0 whitespace-nowrap">
  <Plus className="h-3 w-3 shrink-0" />
  Log New
</SelectTrigger>
```

The trigger is already a flex container (`flex items-center justify-between` from the base class), so `Plus` + `"Log New"` text will sit inline naturally. The `whitespace-nowrap` on the trigger itself prevents any text wrapping. The chevron is appended by the component after our children.

## File Changed

| File | Change |
|---|---|
| `src/pages/OtherLog.tsx` | Remove the inner `<span>` from the "Log New" `SelectTrigger`; move `Plus` icon and "Log New" text as direct children; add `whitespace-nowrap` to the trigger className |

One line change, no other files affected.
