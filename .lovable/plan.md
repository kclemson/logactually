## Plan

### 1. Smallest prompt change

File: `supabase/functions/_shared/prompts.ts`

Current line (appears in both `ANALYZE_WEIGHTS_PROMPT_DEFAULT` and `ANALYZE_WEIGHTS_PROMPT_EXPERIMENTAL`):
```text
- exercise_key: a canonical snake_case identifier. PREFER using keys from the reference list below when the user's input matches. You may create new keys for exercises not in the list.
```

Change to:
```text
- exercise_key: a canonical snake_case identifier. PREFER using keys from the reference list below when the user's input matches exactly. You may create new keys for exercises not in the list, including distinct variants of listed exercises.
```

This adds only six words (`exactly` and `including distinct variants of listed exercises`) and does not restructure anything else.

### 2. Add `landmine_press` to the canonical catalog

File: `supabase/functions/_shared/exercises.ts`
- Insert near `shoulder_press`:
  - key: `landmine_press`
  - name: `Landmine Press`
  - aliases: `['landmine shoulder press']`
  - primaryMuscle: `Shoulders`
  - secondaryMuscles: `['Triceps']`

### 3. Sync frontend metadata

File: `src/lib/exercise-metadata.ts`
- Add `landmine_press: 'Landmine Press'` to `EXERCISE_DISPLAY_NAMES`.
- Add muscle mapping if the file keeps a separate muscle catalog.

### 4. Verify

- Typecheck.
- Run any existing weight/exercise tests.