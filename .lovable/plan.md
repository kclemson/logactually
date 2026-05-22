## Goal

In the "By Type" view on `/custom`, render each log type as a collapsed section by default. The user clicks a header to expand and see its body (chart, panel history, text history, or medication summary). Mirrors the "details" expansion pattern used on grouped food/exercise rows.

## Changes

**`src/components/CustomLogByTypeView.tsx`** (only file edited)

- `TypeCard` gains local `const [expanded, setExpanded] = useState(false)`.
- Header row becomes the click target (whole row toggles expanded state).
  - Add a chevron on the left (`ChevronRight` rotated 90° when expanded, matching existing food/exercise group disclosure styling).
  - Keep the "+ Log" button on the right; stop its click from toggling (`e.stopPropagation()`).
- Body (`<TypeBody />`) only renders when `expanded === true`, so the heavy hooks (`useBloodworkPanelsForType`, `useCustomLogEntriesForType`, `CustomLogGroupTrend`'s query) don't fire until the user opens that card. This also keeps the initial view fast even with many types.
- Border-bottom on the header is removed when collapsed (no visible body to separate); restored when expanded.

No other files change. No state persistence — collapsed is always the default on mount, consistent with how food/exercise group "details" behave.

## Out of scope

- Persisting expanded state across navigation.
- "Expand all" affordance.
- Changes to the By Date view or template picker.
