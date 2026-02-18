

# Fix expanded panel layout — stop action links from constraining text

## Problem
The current layout uses `flex items-end justify-between` to put left-side text and right-side action links on the same row. This forces long text (raw input, saved routine names) to share horizontal space with the action links, causing it to wrap earlier than it should.

## Fix
Change from a side-by-side layout to a vertical stack. Text content flows at full width, and action links sit on their own line below, right-aligned.

## Changes

### `src/components/EntryExpandedPanel.tsx`
- Replace the outer `flex items-end justify-between gap-2` div with a vertical `space-y-1.5` container.
- Let `extraContent`, "Logged as", and "From saved" text flow at full width without a constraining wrapper.
- Move all action links ("Copy to today", "Details", and "Save as meal/routine") into a single `flex justify-end gap-4` row at the bottom.

One file, layout-only change. No logic changes.

