

# Remove pairedField, make Category a normal grid field

## What changes

The `pairedField` concept is removed entirely. Category becomes a regular `type: 'select'` field on its own grid row, naturally aligning with every other right-column field (like Subtype).

## Technical changes (all in `src/components/DetailDialog.tsx`)

### 1. Remove `pairedField` from `FieldConfig` type (~line 32-33)

Delete the `pairedField?: FieldConfig` property from the interface.

### 2. `buildExerciseDetailFields` (~lines 631-642)

Split into two separate fields:

```typescript
{ key: 'description', label: 'Name', type: 'text' },
{
  key: '_exercise_category', label: 'Category', type: 'select',
  options: [
    { value: 'strength', label: 'Strength' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'other', label: 'Other' },
  ],
},
```

### 3. `FieldViewGrid` (~lines 147-165)

- Remove the filter that hides `_exercise_category` (line 148).
- Remove the `pairedField` rendering block (lines 161-165).
- For `type: 'select'` fields in view mode, display the matching option label instead of the raw value (e.g. "Cardio" not "cardio").

### 4. `FieldEditGrid` (~lines 200, 257-274)

- Remove the filter that hides `_exercise_category` (around line 200 if present).
- Remove the entire `pairedField` rendering block (lines 257-274).
- In the existing select `onChange` handler (line 224), add: when the field key is `_exercise_category`, also clear `exercise_key`.

### Result

- Category gets its own row in the same grid column as Subtype -- perfect vertical alignment in both view and edit modes.
- Name becomes a clean full-width text field.
- ~40 lines of special-case code removed.

