

## Fix Tooltip Delay and Mobile Tap

### Changes

**File: `src/components/WeightItemsTable.tsx`**

1. **Reduce delay to 150ms**: Change `<TooltipProvider delayDuration={300}>` to `<TooltipProvider delayDuration={150}>`. This is well within normal range (Material UI uses 100ms by default).

2. **Fix mobile tap** by adding `onClick` handlers to both tooltip trigger elements. The current approach relies on Radix's `onOpenChange`, but Radix never fires it for non-focusable elements on touch. The fix adds an explicit click toggle:

   - **Total row trigger** (`<span>` at line ~314): Add `onClick` + `tabIndex={0}` + `role="button"`:
     ```tsx
     <span
       className="text-[11px] font-normal italic text-muted-foreground ml-1 cursor-help"
       onClick={!hasHover ? () => setActiveTooltip(prev => prev === 'total' ? null : 'total') : undefined}
       tabIndex={0}
       role="button"
     >
       {totalCalorieBurnDisplay}
     </span>
     ```

   - **Detail row trigger** (`<p>` at line ~794): Same pattern with the entry-specific key:
     ```tsx
     <p
       className="text-xs text-muted-foreground italic cursor-help"
       onClick={!hasHover ? () => setActiveTooltip(prev => prev === `detail-${currentEntryId}` ? null : `detail-${currentEntryId}`) : undefined}
       tabIndex={0}
       role="button"
     >
       Estimated calories burned: {detail}
     </p>
     ```

These are small additions to the existing elements -- no structural changes.

