

## Export Weight Log with Both Lbs and Kg Columns

### Overview

Instead of conditionally exporting based on user preference, always include both weight columns in the CSV. This makes the export universally useful and doesn't require passing settings around.

---

### File to Modify

| File | Changes |
|------|---------|
| `src/lib/csv-export.ts` | Add both `Weight (lbs)` and `Weight (kg)` columns |

---

### Implementation

**Current headers:**
```typescript
['Date', 'Time', 'Exercise', 'Sets', 'Reps', 'Weight (lbs)', 'Raw Input']
```

**New headers:**
```typescript
['Date', 'Time', 'Exercise', 'Sets', 'Reps', 'Weight (lbs)', 'Weight (kg)', 'Raw Input']
```

**Row mapping update:**
```typescript
const LBS_TO_KG = 0.453592;

const rows = sorted.map((set) => [
  set.logged_date,
  format(new Date(set.created_at), 'HH:mm'),
  set.description,
  set.sets,
  set.reps,
  set.weight_lbs,                              // Original lbs value
  Math.round(set.weight_lbs * LBS_TO_KG),      // Converted kg value
  set.raw_input || '',
]);
```

---

### Result

Sample CSV output:
```
Date,Time,Exercise,Sets,Reps,Weight (lbs),Weight (kg),Raw Input
2024-01-15,09:30,Bench Press,3,10,135,61,bench press 3x10 at 135
2024-01-15,09:45,Lat Pulldown,4,12,100,45,lat pulldown 4x12 at 100
```

---

### Benefits

- No settings dependency needed
- Export is self-contained and complete
- Users can filter/use whichever column they prefer
- Simpler code - no parameter passing required

