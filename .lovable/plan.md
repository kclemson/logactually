

## Remove Default Intensity from AI Profile Context

### Change

**File:** `supabase/functions/ask-trends-ai/index.ts` (around line 148)

Remove the line that appends `defaultIntensity` to the profile context parts array:

```
if (s.defaultIntensity) parts.push(`Default workout intensity: ${s.defaultIntensity}/10`);
```

The remaining profile fields sent will be: body weight, height, age, and body composition. No other files change.

