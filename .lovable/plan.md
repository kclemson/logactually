## Goal

Make scroll affordance reliable in the saved meals/routines popover, regardless of exact row height (which evidently lands ~29px so 8 rows fill the 232px container with no peek).

## Approach: bottom fade mask when overflowing

Instead of relying on row-height math, add a CSS mask gradient that fades the bottom ~16px of the scroll area to transparent only when content overflows. This visually clips the last row, signaling "there's more below" — and disappears once the user scrolls to the bottom.

### Implementation

In both `src/components/SavedMealsPopover.tsx` and `src/components/SavedRoutinesPopover.tsx`:

1. Revert the scroll container back to `max-h-64` (256px) — restores ~9 visible rows for users with shorter lists.

2. Wrap the scroll container in a relative parent and add a bottom fade overlay:
   ```tsx
   <div className="relative">
     <div ref={scrollRef} onScroll={handleScroll}
          className="max-h-64 overflow-y-auto">
       {/* rows */}
     </div>
     {showBottomFade && (
       <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6
                       bg-gradient-to-t from-popover to-transparent" />
     )}
   </div>
   ```

3. Track overflow state with a small `useState` + `onScroll` handler that sets `showBottomFade = scrollHeight - scrollTop - clientHeight > 1`. Initialize on mount via a ref callback measuring `scrollHeight > clientHeight`.

### Why a fade and not just clipping a row

- Works at any row height (rows could change padding/font in the future).
- Hides itself when the user reaches the bottom — no false signal on short lists.
- Consistent affordance across both popovers.

## Out of scope

- No row, button, header, or width changes.
- No changes to `LogInput.tsx`.
