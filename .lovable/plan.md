
# Admin Feedback: Responsive Action Layout

## Problem
On mobile, the action links (Reply, Resolve, Resolve Fixed) render at the same font size as regular text and overflow across two lines awkwardly. They should be smaller and placed on a dedicated second row on mobile for a cleaner layout.

## Changes

### File: `src/pages/Admin.tsx`

**Open feedback section (lines 395-431):**
- Split the metadata row into two parts:
  1. **Info row**: feedback ID, date, user number, status badge, chevron -- stays on one line
  2. **Actions row**: Reply, Resolve, Resolve Fixed -- rendered as a separate `div` below, only when `replyingToId !== f.id`
- The actions row uses `text-[10px]` to keep them compact, matching the smaller sizing used elsewhere in the app

**Resolved feedback section (lines 502-523):**
- Same pattern: move the "Unresolve" action link out of the inline metadata and into its own row below with `text-[10px]`

## Technical Details

For both sections, the current structure is a single `div` with `flex-wrap` containing both metadata spans and action buttons. The change splits this into:

```
<div> <!-- outer wrapper -->
  <div className="flex items-center gap-2 text-xs">
    <!-- #id, date, user, status badge, chevron -->
  </div>
  {replyingToId !== f.id && (
    <div className="flex items-center gap-2 text-[10px] mt-0.5">
      <!-- Reply, Resolve, Resolve Fixed -->
    </div>
  )}
</div>
```

The action buttons keep their existing color classes but get the smaller `text-[10px]` size. This applies universally (not just mobile) since admin is a compact view and the smaller action links work well at all sizes.

No new files or dependencies.
