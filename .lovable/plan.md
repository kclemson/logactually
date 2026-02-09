

## Split "Seated Leg Curl" Into Its Own Exercise Key

### Problem
Currently, "Seated Leg Curl" (the hamstring curl machine) and "Leg Curl" (the Precor machine) are both mapped to the same `leg_curl` exercise key. They are different machines and should be tracked separately.

### Data Migration
Update the one existing database row (Feb 9, description "Seated Leg Curl") to use the new `seated_leg_curl` key.

### Code Changes

**1. `supabase/functions/_shared/exercises.ts`**
- Split the current `leg_curl` entry: remove "seated leg curl" and "hamstring curl" from its aliases
- Add a new `seated_leg_curl` entry:
  - Name: "Seated Leg Curl"
  - Aliases: "seated hamstring curl", "hamstring curl", "hamstring curl machine"
  - Primary muscle: Hamstrings
- Keep `leg_curl` with remaining aliases: "lying leg curl", "prone leg curl"

**2. `src/lib/exercise-metadata.ts`**
- Add `seated_leg_curl: { primary: 'Hamstrings' }` entry
- Keep `leg_curl: { primary: 'Hamstrings' }` as-is

**3. Database** (data update)
- Update the one row with `description = 'Seated Leg Curl'` to `exercise_key = 'seated_leg_curl'`

### Files Changed
- `supabase/functions/_shared/exercises.ts` -- split aliases, add new entry
- `src/lib/exercise-metadata.ts` -- add `seated_leg_curl` entry
- Database data update for the one existing row
