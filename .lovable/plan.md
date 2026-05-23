## Left-align panel-row chevron with section headers

In the bloodwork expanded view, the per-report chevron sits visually indented because it's centered in a 24px-wide button (`h-6 w-6 justify-center`), so the icon falls ~5px to the right of the button's left edge. The section headers below use only `pl-1` (4px) and read flush-left.

### Change

In `src/components/BloodworkPanelGroup.tsx` line 271, change the toggle button's icon alignment from centered to left-aligned:

- `justify-center` → `justify-start`

That puts the chevron's left edge flush with the same `pl-1` baseline used by the section header below it. No other layout/spacing changes.