

## Apple Health Export Explorer (Admin Tool)

### Goal
Build a temporary exploration tool in the Admin page that lets you pick your 2.6GB `export.xml` file and uses `file.slice()` to stream through it in chunks, extracting sample `<Workout>` elements and their child elements so we can see exactly what fields Apple Health provides. This will inform the real import feature design.

### What it does
- File picker for the `export.xml` file
- Streams through the file in ~1MB chunks using `file.slice()` + `FileReader`
- Scans for `<Workout` elements and extracts the first ~20 complete workout records (with all child elements like `WorkoutStatistics`, `WorkoutEvent`, `MetadataEntry`, etc.)
- Displays a progress bar (bytes read / total bytes)
- Renders the raw XML of each found workout in a scrollable panel so you can inspect every attribute and child element
- Also collects a summary: unique `workoutActivityType` values found, unique child element tag names, unique metadata keys

### Why this approach
- No upload needed -- everything runs locally in the browser
- We only need ~20 sample workouts to understand the full data structure
- The streaming approach handles the 2.6GB file without memory issues
- Building it in Admin means it's already gated behind your admin role

### Implementation

**New file: `src/components/AppleHealthExplorer.tsx`**
- File input that accepts `.xml`
- On file select, begins streaming with `file.slice(offset, offset + CHUNK_SIZE)`
- Uses TextDecoder to convert chunks to text
- Maintains a sliding buffer to catch `<Workout ...>...</Workout>` blocks that may span chunk boundaries
- Stops after collecting 20 workout elements or reaching end of file
- Displays:
  - Progress bar with "Scanning... 450MB / 2.6GB"
  - Summary table: workout types found, count of each
  - List of unique child element names (e.g., `WorkoutStatistics`, `WorkoutEvent`, `MetadataEntry`, `WorkoutRoute`)
  - List of unique metadata keys
  - Raw XML of each sample workout in a collapsible code block

**Modified file: `src/pages/Admin.tsx`**
- Add a "Health Export Explorer" collapsible section at the bottom (before the Populate Demo Data button)
- Renders the `AppleHealthExplorer` component

### Technical Details

The parser logic (simplified):
```text
1. Read 1MB chunk via file.slice()
2. Append to text buffer
3. Search buffer for complete <Workout ...>...</Workout> blocks
4. When found, extract and store the raw XML string
5. Trim buffer to after the last extracted block
6. Repeat until 20 workouts found or EOF
```

Key considerations:
- Buffer needs to handle a `<Workout>` block spanning two chunks (keep last ~50KB of previous chunk)
- Some `<Workout>` elements may be large if they contain embedded `<WorkoutRoute>` with GPS points -- we'll capture the first 20 regardless but truncate display if a single workout is huge
- We skip `<Record>` elements entirely (those are the millions of heart rate samples, steps, etc. that make up the bulk of the file)

### After exploration
Once we can see the actual XML structure, we'll have the information needed to design the real import feature with confidence about which fields exist and how they're structured. This temporary tool can be removed afterward.

