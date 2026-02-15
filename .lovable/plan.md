

# Raise Admin Reply Character Limit

**Problem**: The admin response textarea in the Admin page is capped at 1000 characters, which is too short for detailed replies.

**Fix**: Change `maxLength` from 1000 to 5000 on the admin response textarea in `src/pages/Admin.tsx` (line 454). Leave user-facing limits at 1000 — those are fine for short messages and follow-ups.

## Technical Detail

**File**: `src/pages/Admin.tsx`, line ~454

Change:
```
maxLength={1000}
```
to:
```
maxLength={5000}
```

One line, no database or backend changes needed — the `response` column is already unlimited `text`.

