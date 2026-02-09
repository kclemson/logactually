

## Fix: Collect Diverse Workout Samples

### Problem
The explorer stops after finding 20 total workouts. Since walking entries appear first and are numerous, all 20 samples end up being walking. Other workout types (running, cycling, strength training, etc.) that appear later in the file are never reached.

### Solution
Change the collection strategy:
- **Scan the entire file** (don't stop early at 20)
- Collect up to **3 samples per workout type** (to see variety within each type)
- Track **all** workout type counts across the full file (for the summary)
- Still cap total stored samples at a reasonable limit (e.g., 50) to avoid memory issues from very large workout blocks

### Changes

**File: `src/components/AppleHealthExplorer.tsx`**

1. Remove the `MAX_WORKOUTS = 20` early-stop logic
2. Change `workouts` state to store samples grouped by type
3. During scanning:
   - Always increment the count per workout type in the summary
   - Only store the raw XML if we have fewer than 3 samples of that type
   - Continue scanning through the entire file regardless of samples collected
4. Update the display to group samples by workout type so you can see examples of each

### Expected Result
After a full scan (should take ~30-60 seconds for 2.6GB), you'll see:
- Complete summary of every workout type and how many of each exist
- 2-3 sample XML blocks for each type (running, cycling, strength, etc.)
- Full list of all child elements and metadata keys across all types

