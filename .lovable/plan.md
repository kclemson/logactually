

## Rename "Other" to "Custom", Add Type Management, Use "Enable" Wording

### Part 1: Rename "Other" to "Custom" everywhere

| File | Current | New |
|------|---------|-----|
| `src/components/BottomNav.tsx` (line 21) | `label: 'Other'`, `to: '/other'` | `label: 'Custom'`, `to: '/custom'` |
| `src/App.tsx` (line 44) | `path="/other"` | `path="/custom"` |
| `src/pages/Trends.tsx` (line 930) | `title="Other Trends"` | `title="Custom Trends"` |

### Part 2: Settings label wording -- "Enable" instead of "Show"

| File | Current | New |
|------|---------|-----|
| `src/pages/Settings.tsx` (line 211) | `"Show other logging types"` | `"Enable custom logging"` |
| `src/pages/Settings.tsx` (line 212) | subtitle `"Weight, measurements, mood, and more"` | Keep as-is (still accurate) |
| `src/pages/Settings.tsx` (line 235) | `"Show Exercise"` | `"Enable Exercise"` |

### Part 3: Custom Tracking Types management section in Settings

Add a new **"Custom Tracking Types"** CollapsibleSection in Settings, visible when `showCustomLogs` is enabled. Positioned after the custom logging toggle (inside or right after Preferences). Follows the SavedMealRow/SavedRoutineRow pattern:

**New component: `src/components/CustomLogTypeRow.tsx`**
- Mirrors `SavedMealRow` pattern: chevron expand, inline contentEditable name, value type badge, delete popover
- Props: `type`, `isExpanded`, `onToggleExpand`, `onRename`, `onDelete`, `openDeletePopoverId`, `setOpenDeletePopoverId`
- Collapsed row: type name (click-to-edit) + value type label (e.g. "numeric") + trash icon with confirmation popover
- No expand/collapse needed since types don't have sub-items -- just flat rows with rename + delete

**Hook updates: `src/hooks/useCustomLogTypes.ts`**
- Add `updateType` mutation: `UPDATE custom_log_types SET name = ? WHERE id = ?`, invalidates `['custom-log-types']`
- Add `deleteType` mutation: `DELETE FROM custom_log_types WHERE id = ?`, invalidates `['custom-log-types']`

**Settings page: `src/pages/Settings.tsx`**
- Add a `CollapsibleSection` titled "Custom Tracking Types" with `ClipboardList` icon, gated by `settings.showCustomLogs`
- Contains list of `CustomLogTypeRow` components + "+ Add Tracking Type" button at top
- Uses same state patterns as saved meals (openDeletePopoverId, etc.)
- Positioned after Preferences, before Saved Meals

### Files changed: 7

| File | Change |
|------|--------|
| `src/components/BottomNav.tsx` | Route `/other` to `/custom`, label "Other" to "Custom" |
| `src/App.tsx` | Route path `/other` to `/custom` |
| `src/pages/Trends.tsx` | "Other Trends" to "Custom Trends" |
| `src/pages/Settings.tsx` | "Show" to "Enable" for both toggles; add Custom Tracking Types section |
| `src/hooks/useCustomLogTypes.ts` | Add `updateType` and `deleteType` mutations |
| `src/components/CustomLogTypeRow.tsx` | New -- row component with inline rename and delete confirmation |

