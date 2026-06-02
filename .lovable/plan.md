# Customizable Trends: hide/show charts

## Goal
Let users tailor the Trends page by hiding charts they don't care about and bringing them back later. Visibility is per-chart, controlled via an edit mode with eye icons, and synced to the user's account so it follows them across devices.

## How it works (UX)
- A **"Customize"** toggle (pencil icon) sits next to the period selector at the top of Trends.
- Turning it on enters **customize mode** across the built-in sections (Food, Exercise, Custom):
  - Every chart shows a small **eye / eye-off** button in its corner.
  - Hidden charts stay visible but **dimmed** with an eye-off icon, so they can be turned back on.
  - Tapping the icon toggles that chart and saves immediately.
- Turning customize mode off returns to the normal view, where **hidden charts simply don't render**.
- A section with no visible charts is hidden entirely in normal view (its header disappears), but reappears in customize mode so nothing is permanently lost.
- If the user has hidden everything, a gentle hint points them to the Customize button.

The existing **My Charts** section already has its own edit mode (create / edit / delete / reorder), so it stays as-is — this feature targets the auto-generated built-in charts.

## Which charts become toggleable
Every built-in chart across the three sections, each with a stable ID:

```text
Food
  food:calories            Calories
  food:macroSplit          Macro Split (%)
  food:combined            Combined Calories + Macros
  food:macro:<key>         each displayed macro (protein, carbs, fat, ...)
Exercise
  exercise:calorieBurn     Estimated Exercise Calorie Burn
  exercise:<key>:<subtype> each per-exercise chart
Custom
  customlog:<logTypeId>    each custom-log trend
  bloodwork:<chartId>      each bloodwork chart
```

Fixed charts use constant IDs; data-driven charts (exercises, custom logs, bloodwork) derive a stable ID from their existing keys.

## Data model
Add a single field to user settings (stored in the existing `profiles.settings` JSON, same mechanism as `displayMacros`):

- `hiddenCharts: string[]` — list of chart IDs the user has hidden. Default `[]` (everything visible).

A chart is visible when its ID is **not** in `hiddenCharts`. New charts (new exercises, new log types) are visible by default, which is the desired behavior.

## Implementation

1. **`src/hooks/useUserSettings.ts`** — add `hiddenCharts: string[]` to the `UserSettings` interface and `DEFAULT_SETTINGS` (`[]`). No migration needed; the existing merge handles missing keys.

2. **New helper `src/lib/chart-visibility.ts`** — small pure utilities: chart-ID builders for each chart type, an `isChartHidden(id, hidden)` check, and a `toggleChartId(id, hidden)` that returns the next array. Keeps `Trends.tsx` clean and unit-testable.

3. **New wrapper `src/components/trends/ChartVisibilityWrapper.tsx`** — wraps any chart in a `relative` container and, in customize mode, overlays a corner eye/eye-off button and applies dimming when hidden. Outside customize mode it renders `null` for hidden charts and the chart untouched otherwise. Using a wrapper avoids editing every individual chart component.

4. **`src/pages/Trends.tsx`** —
   - Add a `customizeMode` state and a pencil toggle button in the top bar (next to the period `Select`).
   - Read `settings.hiddenCharts`; create a `toggleChart(id)` that calls `updateSettings`.
   - Wrap each built-in chart (Food, Exercise, Custom sections) in `ChartVisibilityWrapper`, passing its stable ID, the hidden state, customize mode, and the toggle.
   - Compute per-section "has any visible chart" so sections with everything hidden are omitted in normal view but shown in customize mode.
   - Add the all-hidden hint.

5. **`src/lib/chart-visibility.test.ts`** — cover ID building, hidden check, and toggle add/remove.

## Technical details
- Persistence reuses `updateSettings` (optimistic update already built in), so toggles feel instant and sync to the account.
- The eye button uses `Eye` / `EyeOff` from lucide-react and the blue interactive color per the design system.
- Per-exercise charts keep their existing "Show more" pagination; visibility filtering applies to whichever are rendered. (Hidden exercises are filtered from the visible slice so paging still surfaces fresh ones.)
- Read-only/demo users: toggling is a harmless personal preference and writes only to their own settings row, so it stays enabled.
- No database or schema changes — `hiddenCharts` lives in the existing settings JSON.
