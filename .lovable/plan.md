

## Apple Health Import -- Revised Plan

### Corrections and Improvements

1. **Correct Apple support link**: Use `https://support.apple.com/guide/iphone/share-your-health-data-iph5ede58c3d/ios` (not the Family Sharing page).

2. **Date selection before file pick**: The user chooses a "from" date before selecting the file. This lets us skip parsing early portions of the file entirely.

3. **Stream from the end of the file**: Apple Health export.xml stores records in chronological order (oldest first, newest last). Since users most likely want recent data, we stream chunks from the **end** of the file backwards. This means for a 2.6GB file where the user only wants the last 90 days, we can stop scanning much sooner.

4. **Smart default date**: Before showing the date picker, query `weight_sets` for the most recent `logged_date` where `raw_input = 'apple-health-import'`. If found, default the "from" date to that date (so re-imports pick up where you left off). If no prior imports, default to 90 days ago.

5. **Honest duplicate language**: The duplicate toggle copy should be clear that it only detects duplicates from previous Apple Health imports, not manually-logged exercises. Something like:
   - Toggle label: "Skip previously imported Apple Health duplicates"
   - Help text: "This only detects duplicates from prior Apple Health imports, not workouts you logged manually in the app."

### User Flow (Revised Order)

1. User opens "Import from Apple Health" in Settings
2. They see instructions:
   > To export your health data from your iPhone: open the **Health** app, tap your profile picture, then **Export All Health Data**. Save the file and unzip it. [Learn more from Apple](https://support.apple.com/guide/iphone/share-your-health-data-iph5ede58c3d/ios)
3. They see a "from" date input (smart-defaulted as described above)
4. They see a duplicate handling toggle (defaulted to "skip")
5. They pick their `export.xml` file -- scanning begins immediately
6. Scan streams from the **end** of the file backwards, stopping once it hits records older than the chosen date
7. Results appear: workout types found, with checkboxes and counts
8. User selects types, clicks "Preview Import"
9. Preview shows "X new, Y already imported (will skip)" (or just "X to import" if duplicates toggle is off)
10. User clicks "Confirm Import" -- batch inserts happen with progress bar
11. Summary shown: "Imported N workouts"

### Reverse Streaming Strategy

```text
File:  [oldest records .................. newest records]
                                         ^--- start here
       Read 1MB chunk from end
       Parse workout blocks
       If all startDates in chunk > fromDate, read next chunk backwards
       Stop when startDate < fromDate
```

Implementation: use `file.slice(offset, offset + CHUNK_SIZE)` starting from `file.size - CHUNK_SIZE` and decrementing. The overlap buffer handles blocks that span chunk boundaries (same 50KB overlap pattern as the explorer).

One subtlety: since we read backwards but the XML within each chunk is still in forward order, we parse each chunk normally but process chunks in reverse order.

### Technical Details

**New files:**

1. **`src/lib/apple-health-mapping.ts`**
   - Activity type mapping: `HKWorkoutActivityType` to `exercise_key` / `exercise_subtype` / `description`
   - XML attribute parser: extract `duration`, `startDate`, `totalDistance`, `totalEnergyBurned` from a workout XML block
   - Distance conversion helper (km to miles)
   - Set of supported/mapped activity types

2. **`src/components/AppleHealthImport.tsx`**
   - Instructions text with correct Apple link
   - Date picker (with smart default from DB query)
   - Duplicate handling toggle with honest copy
   - File picker
   - Phase 1: reverse streaming scan, building type/count summary, stopping at fromDate
   - Type selection checkboxes (only mapped types selectable, unmapped shown greyed out)
   - Preview button: queries DB for existing apple-health imports in the date/type range, computes new vs skip counts
   - Confirm button: batch inserts (50 rows at a time) with progress bar
   - Results summary

**Modified files:**

3. **`src/pages/Settings.tsx`**
   - Add "Import from Apple Health" collapsible section, gated behind `showWeights` and `!isReadOnly`
   - Positioned after Saved Routines, before Export to CSV
   - Uses conditional rendering so the component mounts fresh each open

**No database changes needed.** No edge functions needed.

