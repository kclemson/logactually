

## Fix Flickering Calorie Burn Tooltips on Desktop

### Problem

The Radix UI tooltip flickers on hover because:
- `TooltipProvider` defaults to `delayDuration={700}`, meaning the user must hold the cursor steady for 700ms before it opens -- small movements cancel the timer and restart it
- When the tooltip content appears, it can break the pointer path between trigger and content, causing a mouseleave on the trigger

### Fix

**File: `src/components/WeightItemsTable.tsx`**

1. **Reduce delay on `TooltipProvider`**: Change `<TooltipProvider>` to `<TooltipProvider delayDuration={300}>` -- short enough to feel responsive but long enough to avoid accidental triggers.

2. **Add pointer-event guard on `TooltipContent`**: Add `onPointerDownOutside={(e) => e.preventDefault()}` to both `TooltipContent` elements so clicks near the tooltip don't dismiss it prematurely.

3. **Add `sideOffset`** to both `TooltipContent` elements: `sideOffset={5}` ensures a small gap but maintains the hover bridge that Radix provides between trigger and content (Radix handles this internally when sideOffset is reasonable).

These are small prop additions to the existing tooltip code -- no structural changes needed.
