## Scope
Two additions to bloodwork panel display, applied to both the **By Type** view's `PanelHistory` (`src/components/CustomLogByTypeView.tsx`) and the **By Date** `BloodworkPanelGroup` (`src/components/BloodworkPanelGroup.tsx`).

## 1. Collapse/Expand all

Add a small toolbar above the panel list with a single toggle button (Collapse all ↔ Expand all).
- Lift `expanded` state out of `BloodworkPanelRow` into a controlled `expanded?` + `onToggle?` prop, with internal state as fallback so existing call sites still work.
- Parent holds a `Record<panelId, boolean>` map; toggle sets all entries true/false at once.
- Toolbar only appears when 2+ panels exist.

## 2. Substring filter

Add a search input next to the toggle.
- Case-insensitive substring match against each result's `display_name` and `analyte_name` only (no numeric values, no flags).
- Panel with zero matching results is hidden entirely.
- Panel with some matches shows only matching rows; section headers shown only when they have visible rows.
- When the query is non-empty, all visible panels auto-expand so matches are visible.
- Empty query restores normal behavior.

Implementation: pass `filterQuery` down to `BloodworkPanelRow`; it filters `section.results` before rendering and reports back (or parent computes match count from panels prop) so empty panels can be hidden.

## Layout
`[search input flex-1]  [collapse/expand toggle]`, compact, `mb-2` above the list. Uses existing input styling.

## Files
- `src/components/CustomLogByTypeView.tsx`
- `src/components/BloodworkPanelGroup.tsx`