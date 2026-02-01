

## Fix Duration Parsing Type

### Problem

Line 42 of the edge function prompt specifies `duration_minutes` as `(integer)`, causing the AI to truncate decimal values. When you enter "11:40", it returns `11` instead of `11.67`.

### Solution

Change one word in the prompt: `(integer)` → `(number)`

### File Change

**`supabase/functions/analyze-weights/index.ts`** (line 42)

| Before | After |
|--------|-------|
| `duration_minutes: duration in minutes (integer), if relevant` | `duration_minutes: duration in minutes (number), if relevant` |

### Result

The AI will correctly return decimal minutes for time-format inputs:
- "11:40" → `11.67`
- "5:30" → `5.5`

