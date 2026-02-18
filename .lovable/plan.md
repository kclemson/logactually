

# Add horizontal margin to DetailDialog on mobile

The dialog currently stretches to the full screen width on mobile because it uses `w-full` with no margin. Adding a small horizontal inset will give it breathing room from the screen edges.

## Change

In `src/components/DetailDialog.tsx`, add `mx-4` (16px margin on each side) to the `DialogContent` className. This only visually matters on mobile since `sm:max-w-md` already constrains the width on larger screens.

## Technical details

**`src/components/DetailDialog.tsx` (line 305):**

Add `mx-4 rounded-lg` to the `DialogContent` className:

```tsx
// Before:
<DialogContent className="top-[5%] translate-y-0 max-h-[90dvh] max-h-[90vh] flex flex-col p-0 gap-0 sm:max-w-md [&>button:last-child]:hidden">

// After:
<DialogContent className="top-[5%] translate-y-0 max-h-[90dvh] max-h-[90vh] flex flex-col p-0 gap-0 mx-4 rounded-lg sm:max-w-md [&>button:last-child]:hidden">
```

The `rounded-lg` is added because without it the sharp corners look odd once there's visible space around the dialog. On `sm:` and up the dialog is already rounded via the base component's `sm:rounded-lg`.

| File | Change |
|------|--------|
| `src/components/DetailDialog.tsx` | Add `mx-4 rounded-lg` to DialogContent for mobile breathing room |

