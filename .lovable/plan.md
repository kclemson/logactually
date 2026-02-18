

# Data Migration: Convert text_numeric Body Measurements to individual numeric log types

## Step 1: Create new numeric log types for User #10 (sister, `b85f020e-...`)

Create 5 new `numeric` log types with `unit = 'in'`:
- Calf
- Upper Calf
- Mid Thigh
- Waist
- Hips

## Step 2: Create new numeric log types for User #12 (demo, `f65d7de9-...`)

Create 2 new `numeric` log types with `unit = 'in'`:
- Chest
- Waist

## Step 3: Reassign entries for User #10

For each of the 5 entries, update `log_type_id` to point to the matching new type (matched by `text_value`), then set `text_value = NULL`.

## Step 4: Reassign entries for User #12

For each of the 29 entries, update `log_type_id` to point to the matching new type (matched by `text_value`), then set `text_value = NULL`.

## Step 5: Delete old Body Measurements log types

Delete the original `text_numeric` "Body Measurements" types for all three users:
- User #10: `b85f020e-...` type
- User #12: `f65d7de9-...` type
- User #1: `3e4be559-...` type (empty, no entries)

## Step 6: Code changes (same approved plan)

1. **`src/lib/log-templates.ts`** -- Replace single "Body Measurements" template with 6 individual numeric templates (Waist, Hips, Chest, Bicep, Thigh, Neck).
2. **`src/components/CreateLogTypeDialog.tsx`** -- Remove `text_numeric` from `VALUE_TYPE_OPTIONS`.
3. **`src/pages/OtherLog.tsx`** -- Remove `'text_numeric'` from `handleCreateType` type annotation.

## Technical notes

- All SQL operations use the data insert tool (not migration tool) since these are data changes, not schema changes.
- The operations will be run sequentially: create types first, then reassign entries using the new type IDs, then delete old types.
- RLS is bypassed by the insert tool (service role), so no auth issues.
- Existing `text_numeric` rendering code stays in place for safety.

