# Constrain bloodwork upload dialog on mobile

## Problem
When the user picks many files at once, the job list inside the bloodwork upload dialog grows unbounded. The wrapping `DialogContent` has no max-height and the inner `<div className="rounded-lg border border-border bg-card p-5">` lets the list push the dialog past the viewport, so on mobile the top and bottom (dropzone + Done button) get clipped.

## Change
`src/components/BloodworkUploadInput.tsx`:
- Wrap the outer container as a vertical flex column with `max-h-[85dvh]` (with `max-h-[85vh]` fallback in the class list) and `min-h-0`.
- Make the dropzone button and the bottom Done button non-shrinking (`shrink-0`) so they stay visible.
- Add `max-h` + `overflow-y-auto` + `min-h-0` to the jobs list container so only the list scrolls when there are many files. Keep the existing divide-y styling.

`src/pages/OtherLog.tsx` (panel branch around line 374):
- Change the inner panel wrapper from `p-5` to also `flex flex-col min-h-0` so the height constraint inside BloodworkUploadInput propagates correctly.

No DialogContent positioning change is needed beyond this — the list will scroll inside the dialog instead of pushing the dialog off-screen. Works the same on desktop (the constraint only activates when the list overflows).

## Out of scope
- Behavior of any other custom-log entry dialog (only the panel/bloodwork one has this issue).
- Visual styling of the rows themselves.
