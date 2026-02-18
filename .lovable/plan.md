

## Fix: Empty data objects in generated charts

### Problem
The AI model returns a chart spec where the `data` array contains empty objects `{}`. The chart title, axes, and color are correct, but no actual data points are populated. This means the model understood the request but failed to fill in the data values.

### Root Cause
The tool definition for `data` is very loosely typed:
```json
{ "type": "array", "items": { "type": "object", "additionalProperties": true } }
```

The model has no schema-level guidance on what fields each data item needs. The system prompt mentions it, but that's not enough for reliable structured output.

### Fixes

**1. Add logging of raw AI tool call arguments** (diagnostic)
In `supabase/functions/generate-chart/index.ts`, add a `console.log` after parsing the tool call arguments so we can see exactly what the model returned:
```typescript
console.log("generate_chart args:", JSON.stringify(args).slice(0, 2000));
```

**2. Improve the tool definition to guide the model**
Update the `data` items description to explicitly state the required structure:
```json
"data": {
  "type": "array",
  "description": "Array of data points. Each object MUST contain a key matching xAxisField (the label) and a key matching dataKey (the numeric value). Example: if xAxisField='time' and dataKey='avg_cal', each item must be like {\"time\": \"6am\", \"avg_cal\": 120}.",
  "items": { "type": "object", "additionalProperties": true }
}
```

**3. Add server-side validation and filtering**
After mapping to `chartSpec`, filter out any empty data items and log a warning:
```typescript
const validData = args.data.filter((d: any) =>
  d && Object.keys(d).length > 0 && d[args.xAxisField] !== undefined && d[args.dataKey] !== undefined
);
if (validData.length < args.data.length) {
  console.warn(`Filtered ${args.data.length - validData.length} empty/invalid data items`);
}
// use validData in chartSpec
```

If all items are empty after filtering, return an error message rather than an empty chart.

### Files to modify
| File | Change |
|------|--------|
| `supabase/functions/generate-chart/index.ts` | Add args logging, improve tool data schema description, add data validation |

### Expected outcome
- Better model guidance via the tool schema should prevent empty data in most cases
- Server-side validation catches and reports the issue when it does happen
- Logging lets us diagnose the raw model output for future debugging
