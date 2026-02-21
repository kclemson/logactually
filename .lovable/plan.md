

# Add "My highest calorie food items" chip

## Change
Add one new entry to the `ALL_CHIPS` array in `src/components/CustomChartDialog.tsx`:

```typescript
{ label: "My highest calorie food items", mode: "v2" },
```

This will be inserted among the other v2 chips (e.g., after "My highest calorie days" on line 29) since the new `valuesPerEntry` support we just added means the DSL engine can now correctly resolve per-item max aggregation.

## Files Modified
- `src/components/CustomChartDialog.tsx` -- add one line to `ALL_CHIPS`

