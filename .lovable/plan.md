

# Item Detail Dialog + Heart Rate Fix

## Overview

Add a shared `DetailDialog` component that lets users view and edit all properties on any food or exercise item, plus fix the metadata allowlist to stop dropping `heart_rate`, `cadence_rpm`, and `speed_mph` data.

## Part 1: Fix metadata data loss (quick win, ship first)

### 1a. Update edge function allowlist

**`supabase/functions/analyze-weights/index.ts`**

Add `heart_rate`, `cadence_rpm`, `speed_mph` to the `METADATA_ALLOWLIST`:

```
const METADATA_ALLOWLIST = ['incline_pct', 'effort', 'calories_burned', 'heart_rate', 'cadence_rpm', 'speed_mph'] as const;
```

Add validation rules in the sanitization loop for the new keys (same pattern as existing -- clamp `heart_rate` to reasonable range like 30-250, `cadence_rpm` and `speed_mph` as positive finite numbers with 1 decimal).

### 1b. Update AI prompt to request heart_rate

**`supabase/functions/_shared/prompts.ts`**

Add to the `EXERCISE METADATA` section in both default and experimental prompts:

```
- heart_rate: average heart rate in BPM if mentioned (e.g., "avg hr 145" -> 145)
- cadence_rpm: cycling cadence if mentioned (e.g., "80 rpm" -> 80)
- speed_mph: average speed if mentioned (e.g., "3.5 mph" -> 3.5). Convert km/h to mph.
```

### 1c. Update frontend metadata registry

**`src/lib/exercise-metadata.ts`**

Add a `KNOWN_METADATA_KEYS` registry that the DetailDialog will consume:

```typescript
export interface MetadataKeyConfig {
  key: string;
  label: string;
  unit: string;
  appliesTo: 'cardio' | 'strength' | 'both';
  min?: number;
  max?: number;
}

export const KNOWN_METADATA_KEYS: MetadataKeyConfig[] = [
  { key: 'effort', label: 'Effort', unit: '/10', appliesTo: 'both', min: 1, max: 10 },
  { key: 'calories_burned', label: 'Cal Burned', unit: 'cal', appliesTo: 'both', min: 1 },
  { key: 'heart_rate', label: 'Heart Rate', unit: 'bpm', appliesTo: 'both', min: 30, max: 250 },
  { key: 'incline_pct', label: 'Incline', unit: '%', appliesTo: 'cardio', min: 0, max: 30 },
  { key: 'cadence_rpm', label: 'Cadence', unit: 'rpm', appliesTo: 'cardio', min: 1 },
  { key: 'speed_mph', label: 'Speed', unit: 'mph', appliesTo: 'cardio', min: 0.1 },
];
```

### 1d. Update CSV export

**`src/lib/csv-export.ts`**

Add `Heart Rate`, `Cadence`, `Speed (mph)` columns to the weight log export, reading from `exercise_metadata`.

## Part 2: DetailDialog component

### 2a. New shared component: `src/components/DetailDialog.tsx`

A generic, type-agnostic dialog for viewing/editing an item's properties.

**Props:**

```typescript
interface FieldConfig {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  unit?: string;
  readOnly?: boolean;          // e.g., uid, entryId
  options?: { value: string; label: string }[];  // for select type
  min?: number;
  max?: number;
  section?: string;            // grouping label, e.g., "Macros", "Metadata"
}

interface DetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: FieldConfig[];
  values: Record<string, any>;
  onSave: (updates: Record<string, any>) => void;
  readOnly?: boolean;
}
```

**Behavior:**

- Opens in **view mode** by default -- compact read-only display of all fields in a 2-column grid (label: value pairs)
- User taps "Edit" button to enter **edit mode** -- fields become inputs
- Fields are grouped by `section` (e.g., "Nutrition" / "Metadata")
- Explicit "Save" and "Cancel" buttons, always visible (sticky footer)
- On Save: computes a diff of changed fields only, calls `onSave(changedFields)`
- On Cancel or close: discards all changes, reverts to view mode
- Mobile: uses top-anchored dialog with `max-h-[80dvh] overflow-y-auto` per existing mobile dialog standards
- No auto-scaling, no auto-clearing -- every field is independent

### 2b. Food detail field config

Defined as a constant in the food log page/component:

```
Section "Basic": description (text), portion (text)
Section "Nutrition": calories, protein, carbs, fiber, sugar, fat, saturated_fat, sodium, cholesterol
```

10 editable fields total (aside from description/portion). Laid out in 2 columns of 5 rows in the Nutrition section.

**Key behavior difference from inline editing:** Editing calories here does NOT auto-scale P/C/F. Editing description does NOT clear portion. Every field is independent.

### 2c. Exercise detail field config

Two fixed field orderings based on type:

**Strength fields:**
```
Section "Basic": description (text), exercise_key (searchable select), exercise_subtype (select, contextual)
Section "Performance": sets, reps, weight_lbs
Section "Metadata": effort, calories_burned, heart_rate
```

**Cardio fields:**
```
Section "Basic": description (text), exercise_key (searchable select), exercise_subtype (select, contextual)
Section "Performance": duration_minutes, distance_miles
Section "Metadata": effort, calories_burned, heart_rate, incline_pct, cadence_rpm, speed_mph
```

**exercise_key dropdown:** Populated from `EXERCISE_MUSCLE_GROUPS` keys (frontend registry) plus an "other" catch-all. Searchable/filterable. Changing this does NOT auto-update other fields.

**exercise_subtype dropdown:** Shows contextual options based on the current exercise_key (e.g., walk_run shows walking/running/hiking). Uses `EXERCISE_SUBTYPE_DISPLAY` from exercise-metadata.ts.

### 2d. Persistence

**Food items:** On save, compute diff, call `onUpdateItemBatch` with changed fields only. This flows through the existing `useEditableItems` -> `useFoodEntries.updateEntry` pipeline. The food_items JSONB gets the updated values.

**Exercise items:** On save, call `useWeightEntries.updateSet` -- but this currently only supports `description | sets | reps | weight_lbs`. Will need to extend `updateSet` to accept additional fields: `duration_minutes`, `distance_miles`, `exercise_key`, `exercise_subtype`, `exercise_metadata`.

Extend `updateSet` mutation:
```typescript
updates: Partial<Pick<WeightSet,
  'description' | 'sets' | 'reps' | 'weight_lbs' |
  'duration_minutes' | 'distance_miles' |
  'exercise_key' | 'exercise_subtype' | 'exercise_metadata'
>>;
```

For metadata fields: merge individual metadata key changes into the existing `exercise_metadata` JSONB, stripping nulls/empty values before writing.

## Part 3: Entry point -- "Details" link in expanded panel

### 3a. `EntryExpandedPanel` enhancement

Add an optional `onShowDetails` callback prop. When provided, renders a "Details" link alongside the existing "Save as meal/routine" link.

For **single-item entries** (or non-grouped entries): clicking "Details" opens the DetailDialog for that item directly.

For **grouped entries** (expanded group): clicking "Details" opens the DetailDialog showing a list of items in the group. Each item is a collapsible row; expanding it reveals the full field editor for that specific item. Save applies to individual items, not the group.

### 3b. Wiring in FoodLog and WeightLog pages

- `FoodLog.tsx` / `WeightLog.tsx`: pass `onShowDetails` through to the items table
- Items tables pass it to `EntryExpandedPanel`
- State management: `detailDialogItem` state (the item + its field config) held at the page level

## Technical considerations

- **No new database tables or columns** -- all fields already exist (food_items JSONB has all nutrition fields; weight_sets has all exercise columns; exercise_metadata JSONB handles the rest)
- **No new RLS policies** -- uses existing update policies
- **Optimistic updates** via existing `useEditableItems` for food, existing `updateSet.mutate` + query invalidation for exercise
- **Field ordering is fixed** per the configs above -- no reordering between opens
- **Unknown metadata keys** (from AI extracting something new in the future) are preserved on save but not shown in the UI until added to `KNOWN_METADATA_KEYS`

## Implementation sequence

1. Part 1 (metadata fix): prompts, allowlist, frontend registry, CSV export
2. Part 2a-2b: DetailDialog component + food field config
3. Part 2c: Exercise field config with searchable dropdowns
4. Part 2d: Extend `updateSet` mutation
5. Part 3: Wire entry points through expanded panels

