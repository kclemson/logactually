

## Add `dual_numeric` Value Type with Dedicated Column

### Database Changes

**Migration: Add `numeric_value_2` column and update constraint**

```sql
ALTER TABLE custom_log_entries ADD COLUMN numeric_value_2 numeric;

ALTER TABLE custom_log_types DROP CONSTRAINT IF EXISTS custom_log_types_value_type_check;
ALTER TABLE custom_log_types ADD CONSTRAINT custom_log_types_value_type_check
  CHECK (value_type IN ('numeric', 'text_numeric', 'text', 'text_multiline', 'dual_numeric'));
```

This gives `dual_numeric` entries a clean, dedicated column:
- `numeric_value` = first number (e.g. systolic, 120)
- `numeric_value_2` = second number (e.g. diastolic, 80)

### Code Changes

**`src/hooks/useCustomLogTypes.ts`**
- Add `'dual_numeric'` to the `ValueType` union

**`src/lib/log-templates.ts`**
- Change Blood Pressure template: `valueType: 'dual_numeric'`, `unitImperial: 'mmHg'`, `unitMetric: 'mmHg'`

**`src/hooks/useCustomLogEntries.ts`**
- Add `numeric_value_2: number | null` to the `CustomLogEntry` interface
- Add `numeric_value_2` to `createEntry` and `updateEntry` param types

**`src/components/LogEntryInput.tsx`**
- Add a `dual_numeric` branch: two side-by-side number inputs with a `/` separator and unit suffix
- On submit: `{ numeric_value: first, numeric_value_2: second }`

**`src/components/CustomLogEntryRow.tsx`**
- Add `dual_numeric` display: two inline-editable number fields shown as `120 / 80 mmHg`

**`src/components/CreateLogTypeDialog.tsx`**
- Add a "Dual Numeric" radio option with description "Two numbers with / (e.g. blood pressure)"

**`src/hooks/useCustomLogTrends.ts`**
- Add a `dual_numeric` branch: generate two series from `numeric_value` and `numeric_value_2`, labeled "High" and "Low" (generic) so both values chart as separate lines

### Template Update

| Template | Before | After |
|---|---|---|
| Blood Pressure | text, no unit | dual_numeric, mmHg |
