## Fix duplicate exercise keys from typos

Two typo'd `exercise_key` values in `weight_sets` create phantom split charts. Re-key them to their canonical siblings via a one-off data update (no schema changes).

### Rows affected (all users)
- `bulgarian_split_sqaut` → `bulgarian_split_squat` — **1 row**
- `farmers_carries` → `farmers_carry` — **1 row**

Canonical targets already exist (`bulgarian_split_squat`: 3 rows, `farmers_carry`: 2 rows) and are the keys in the exercise catalog.

### Execution
Single `UPDATE weight_sets SET exercise_key = ... WHERE exercise_key = ...` for each typo, run via the insert tool. No RLS/schema changes, no code changes (catalog already has the correct keys).

### Not in scope
Prompt/catalog hardening to prevent future typos — not requested. AI ingest already uses the catalog; these two rows likely predate a prompt improvement.
