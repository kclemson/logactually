

## Fixes and Prompt Chip Refinement

### Fix 1: Hide checkbox while request is pending

Change the checkbox visibility condition from `!data?.answer` to `!data?.answer && !isPending` so it disappears as soon as the user submits.

**File**: `src/components/AskTrendsAIDialog.tsx` (line 149)

### Fix 2: Parse markdown in AI response

Replace the raw `{data.answer}` text rendering with a simple function that converts `**bold**` markdown to `<strong>` tags. This avoids adding a new dependency -- a lightweight regex replacement is sufficient since the AI responses only use bold formatting.

**File**: `src/components/AskTrendsAIDialog.tsx` (line 181)

### Fix 3: Refine prompt chip libraries

Replace the current prompt lists with curated ones focused on insights that are NOT already visible in the app's charts. The guiding principle: prompts should help users discover things only AI cross-referencing can surface.

Awaiting user input on which prompts to keep/cut/add before finalizing the exact lists. The current candidates marked for removal are those answering questions already visible in the app UI (average calorie intake, macro split, highest calorie day, strongest lift, workout frequency, calories burned).

### Files changed

| File | Change |
|------|--------|
| `src/components/AskTrendsAIDialog.tsx` | Hide checkbox during pending; parse bold markdown in response; update prompt lists |

