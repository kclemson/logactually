

## Add "Refine Your Estimate" Tooltips to Calorie Burn Displays

### What changes

Two tooltip hints are added to the exercise log's calorie burn numbers, nudging users to configure their profile for more accurate estimates.

**Where they appear:**
- The total calorie range next to "Total" (e.g. `(~166-195 cal)`)
- The per-entry "Estimated calories burned: ~82" line in the expanded detail view

**Tooltip text:** "Refine this estimate with your weight, height, and age in Settings."

**Interaction:**
- Desktop (hover devices): standard hover tooltip
- Mobile (touch devices): tap to show, tap again to dismiss (using the existing `useHasHover` hook pattern)

A `cursor-help` style is added to the trigger text so users get a visual hint that it's interactive.

### Technical details

**File: `src/components/WeightItemsTable.tsx`**

1. Add imports for `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` from `@/components/ui/tooltip` and `useHasHover` from `@/hooks/use-has-hover`.

2. Add local state: `const [activeTooltip, setActiveTooltip] = useState<string | null>(null)` and `const hasHover = useHasHover()`.

3. Wrap the component return in `<TooltipProvider>`.

4. **Total row** (line ~305): Wrap the `totalCalorieBurnDisplay` span in a `Tooltip`/`TooltipTrigger`/`TooltipContent` group with controlled open state for touch:
   ```tsx
   <Tooltip
     open={hasHover ? undefined : activeTooltip === 'total'}
     onOpenChange={hasHover ? undefined : (open) => setActiveTooltip(open ? 'total' : null)}
   >
     <TooltipTrigger asChild>
       <span className="text-[11px] font-normal italic text-muted-foreground ml-1 cursor-help">
         {totalCalorieBurnDisplay}
       </span>
     </TooltipTrigger>
     <TooltipContent>
       Refine this estimate with your weight, height, and age in Settings.
     </TooltipContent>
   </Tooltip>
   ```

5. **Expanded detail line** (lines ~774-778): Wrap the `<p>Estimated calories burned: ...</p>` in a similar Tooltip, using `activeTooltip === 'detail-{entryId}'` for the controlled key so multiple expanded entries don't conflict.

