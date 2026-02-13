

## Align Date Picker Height on Custom Page

The Food and Exercise pages render a `LogInput` component (a 100px-tall textarea + a row of buttons) above the date picker. The Custom page only has a short dropdown row (~32px tall), so the date picker sits much higher.

### Approach

Wrap the Custom page's top controls (dropdown + Add Tracking Type button, plus the optional LogEntryInput form) in a container with a fixed minimum height that matches the vertical space the `LogInput` component occupies on Food/Exercise pages.

The `LogInput` renders:
- Textarea: `min-h-[100px]`
- Gap: `space-y-3` (12px)
- Button row: ~32px
- Total: ~144px

The outer `space-y-4` gap (16px) before the date picker is the same on all pages, so we only need the inner section height to match.

### Change

**File: `src/pages/OtherLog.tsx`**

Wrap the two top blocks (the dropdown row and the conditional `LogEntryInput`) in a single `<section>` with `min-h-[144px]` and use `flex flex-col justify-center` to vertically center the controls within that space. This ensures the date picker below starts at the exact same vertical position as on Food and Exercise pages, regardless of whether a log type is selected.

| File | Change |
|------|--------|
| `src/pages/OtherLog.tsx` | Wrap the dropdown + LogEntryInput blocks in `<section className="min-h-[144px] flex flex-col justify-center">` so the date picker aligns with Food/Exercise pages |

