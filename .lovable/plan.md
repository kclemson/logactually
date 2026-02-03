

## Update Cardio Display Format

### Overview
Change the expanded cardio metadata format to prioritize distance and duration, with pace and speed in parentheses.

---

### New Format
```
1.18 mi in 12:41 (10:45/mi, 5.6 mph)
```

Structure: `distance in duration (pace, speed)`

---

### Logic Summary

| Data Available | Display Format |
|----------------|----------------|
| Both duration + distance | `1.18 mi in 12:41 (10:45/mi, 5.6 mph)` |
| Duration only | `12:41` |
| Distance only | `1.18 mi` |

---

### Implementation

**File:** `src/components/WeightItemsTable.tsx` (lines 638-641)

```tsx
// Before
if (hasBothMetrics) {
  const paceFormatted = formatDurationMmSs(paceDecimal!);
  const durationFormatted = formatDurationMmSs(duration);
  displayParts = `${paceFormatted}/mi, ${mph} mph, ${distance} mi in ${durationFormatted}`;
}

// After
if (hasBothMetrics) {
  const paceFormatted = formatDurationMmSs(paceDecimal!);
  const durationFormatted = formatDurationMmSs(duration);
  displayParts = `${distance} mi in ${durationFormatted} (${paceFormatted}/mi, ${mph} mph)`;
}
```

Also remove redundant description prefix for single cardio items (lines 648-651):

```tsx
// Before
return (
  <p key={ex.uid || idx} className="text-sm text-muted-foreground">
    <span className="font-medium">{ex.description}:</span>{' '}
    {displayParts}
  </p>
);

// After
return (
  <p key={ex.uid || idx} className="text-sm text-muted-foreground">
    {cardioItems.length > 1 && (
      <><span className="font-medium">{ex.description}:</span>{' '}</>
    )}
    {displayParts}
  </p>
);
```

---

### Files Changed
- `src/components/WeightItemsTable.tsx` - Update format string and conditionally hide description

