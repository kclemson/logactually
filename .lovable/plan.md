
# Medication: Standard Dose Amount + Unit in Creation Dialog

## The Gap

The current plan has a "Dose unit" field (e.g., `mg`) but no dose amount field. A complete medication setup needs both:

- **Dose amount**: `325` (numeric — the prescribed quantity per dose)
- **Dose unit**: `mg` (text — the unit of measure)

Together these mean "325 mg per dose." This is stored on the log type as the **default/prescribed dose** so it can pre-fill the logging form.

Note: unlike time (which always uses the current moment), the dose amount IS worth pre-filling from the definition — the user almost always takes the same prescribed amount, and they can change it if needed (e.g., taking half a dose).

---

## Database Change

One new column added to `custom_log_types`. The `unit` column already exists for the unit string — we only need to add the numeric amount:

```sql
ALTER TABLE public.custom_log_types ADD COLUMN default_dose numeric NULL;
ALTER TABLE public.custom_log_types ADD COLUMN doses_per_day int NOT NULL DEFAULT 0;
ALTER TABLE public.custom_log_types ADD COLUMN dose_times text[] NULL;
```

`unit` (already exists) = "mg", `default_dose` (new) = 325.0

---

## Updated CreateMedicationDialog Layout

```
┌─────────────────────────────────────────┐
│  Add Medication                    [×]  │
├─────────────────────────────────────────┤
│                                         │
│  Medication name *                      │
│  [ Tylenol                           ]  │
│                                         │
│  Standard dose *                        │
│  [ 325      ]  [ mg              ]      │
│   (number)      (text unit)             │
│                                         │
│  How often per day?                     │
│  [As needed]  [1]  [2]  [3]  [4]       │
│                                         │
│  — when 1+ selected —                  │
│  Dose 1  [ morning               ]     │
│  Dose 2  [ evening               ]     │
│                                         │
│  Notes                                  │
│  [ e.g. Max 4000mg/day, take with  ]   │
│  [ food. Every 6 hours as needed.  ]   │
│                                         │
│           [Cancel]  [Add Medication]    │
└─────────────────────────────────────────┘
```

"Standard dose" uses two side-by-side inputs: a compact number input (w-24) and a text input for the unit (w-28). Both are required (marked with `*`). The label "Standard dose" is clearer than "Dose unit" since it conveys both the amount and the unit together.

Smart defaults for dose times (unchanged from previous plan):
- 1 dose → `['morning']`
- 2 doses → `['morning', 'evening']`
- 3 doses → `['8am', '12pm', '4pm']`
- 4 doses → `['8am', '12pm', '4pm', '8pm']`

---

## Updated MedicationEntryInput Layout (logging a dose)

When the user opens the log form for Tylenol, the amount field pre-fills from `default_dose`:

```
┌─────────────────────────────────────────┐
│  Tylenol                            [×] │
├─────────────────────────────────────────┤
│  Max 4000mg/day. Take with food.        │  ← read-only description
│                                         │
│  2x/day · morning, evening              │  ← read-only schedule
│  1 of 2 doses logged today              │  ← computed from today's entries
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  Time  [10:42]    Amount  [325]  mg     │
│          ↑ current time    ↑ pre-filled │
│          (always now)      from default_dose
│                                         │
│  Notes  [__________________________]    │
│                                         │
│                          [Save dose]    │
└─────────────────────────────────────────┘
```

**Time**: always initializes to `getCurrentTimeValue()` — current moment, never from a stored default.  
**Amount**: pre-fills from `logType.default_dose` (the prescribed amount). User can change it if needed.

---

## EditLogTypeDialog — medication fields

The pencil icon in settings opens this for editing. For medication types it shows all the same fields as creation, allowing the user to fix anything:

- Medication name (already editable inline in the row — may not need to duplicate here)
- Standard dose amount + unit (side-by-side, same as creation)
- How often per day (pill selector)
- Dose time inputs (if > 0)
- Notes textarea

---

## Hook Changes

### `useCustomLogTypes.ts`

Add to `CustomLogType` interface:
```ts
default_dose: number | null;
doses_per_day: number;
dose_times: string[] | null;
```

Add to `createType` params:
```ts
default_dose?: number | null;
doses_per_day?: number;
dose_times?: string[] | null;
```

Add to `updateType` params (same fields).

### `MedicationEntryInput.tsx`

Add `defaultDose?: number | null` prop. Initial state:
```ts
const [doseValue, setDoseValue] = useState(defaultDose != null ? String(defaultDose) : '');
```

Add `dosesPerDay?: number`, `doseTimes?: string[] | null`, `todayEntryCount?: number` props for the contextual read-only display.

---

## Files Changed

| File | Change |
|---|---|
| DB migration | Add `default_dose numeric NULL`, `doses_per_day int NOT NULL DEFAULT 0`, `dose_times text[] NULL` to `custom_log_types` |
| `src/hooks/useCustomLogTypes.ts` | Add 3 new fields to interface + `createType`/`updateType` params |
| `src/components/CreateMedicationDialog.tsx` | **New** — name + standard dose (amount + unit side-by-side) + frequency + dose times + notes |
| `src/components/MedicationEntryInput.tsx` | Add `defaultDose` prop (pre-fills amount), add read-only description/schedule/count display |
| `src/components/LogTemplatePickerDialog.tsx` | Add `onSelectMedication?: () => void` prop; Medication row calls it |
| `src/pages/OtherLog.tsx` | Wire `CreateMedicationDialog`; pass `defaultDose`, `dosesPerDay`, `doseTimes`, `todayEntryCount` to `MedicationEntryInput` |
| `src/components/settings/CustomLogTypesSection.tsx` | Wire `CreateMedicationDialog` for the settings picker |
| `src/components/EditLogTypeDialog.tsx` | Add all medication fields (dose amount + unit, frequency, dose times) for the pencil-edit flow |
| `src/components/CustomLogTypeRow.tsx` | Show `default_dose + unit` in nameAppend for medication (e.g., `325 mg · 2x/day`) |

No changes to `custom_log_entries` — `logged_time` and `entry_notes` already exist.
