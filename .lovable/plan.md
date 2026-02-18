

# Move unit indicators into field labels and add colons in read-only mode

## Changes

All changes are in `src/components/DetailDialog.tsx`.

### 1. Labels in read-only mode get colons and unit suffixes

Every label in `FieldViewGrid` will end with a colon (matching edit mode), and fields with units will show them in the label:

- `Distance:` becomes `Distance (mi):` or `Distance (km):`
- `Weight:` becomes `Weight (lbs):` or `Weight (kg):`
- `Duration:` becomes `Duration (min):`
- `Cal Burned:` becomes `Cal Burned (cal):`
- `Effort:` becomes `Effort (/10):`

The unit suffix comes from either `unitToggle` (active unit) or the static `unit` property.

### 2. Remove UnitToggle and standalone unit text from read-only mode

In `FieldViewGrid`, remove the `UnitToggle` component and the static unit `<span>` after the value. The unit context is now fully in the label. The value displays as just the number.

### 3. Labels in edit mode also get unit suffixes

In `FieldEditGrid`, the label already has a colon. Add the same unit suffix logic so labels read `Distance (mi):` and update dynamically when the user clicks the unit toggle buttons.

### 4. Static `unit` fields: strip unit from displayValue

Currently `displayValue` appends ` ${field.unit}` to the value for fields with a static `unit` property (like duration showing "39.05 min"). Since the unit is now in the label, remove this suffix from `displayValue` so the value is just the number.

## Technical details

| Location | Change |
|----------|--------|
| `displayValue` helper (line 76) | Remove the `if (field.unit) return \`\${val} \${field.unit}\`` line so values render without unit suffixes |
| `FieldViewGrid` label (line 143) | Add colon and unit suffix: `{field.label}{unitSuffix}:` where unitSuffix is ` (${activeUnit})` for unitToggle fields or ` (${field.unit})` for static unit fields |
| `FieldViewGrid` after value (lines 147-151) | Remove the `UnitToggle` component and static unit `<span>` -- no unit indicators after the value in read-only mode |
| `FieldEditGrid` label (line 182) | Add unit suffix before the colon: `{field.label}{unitSuffix}:` using the same logic |

