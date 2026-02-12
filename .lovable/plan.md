

## Add "Ask AI" Prompt Eval to DevToolsPanel

A new collapsible section in the DevToolsPanel for batch-testing Ask AI prompts against your real account data, reviewing responses, and promoting good ones to the chip lists.

### How It Works

1. **Two textareas** -- one for food prompts, one for exercise prompts (one prompt per line)
2. **Run All** button sends each prompt to the existing `ask-trends-ai` edge function (1 call per prompt, with `includeProfile: true`, using your authenticated session)
3. **Results list** shows each prompt with its AI response (expandable/collapsible)
4. **Thumbs up/down** on each result marks it as good or not
5. **"Copy Approved" button** copies all "good" prompts as a JS array literal to your clipboard, ready to paste into the `FOOD_PROMPTS` or `EXERCISE_PROMPTS` arrays in `AskTrendsAIDialog.tsx`

### UI Layout (inside DevToolsPanel, as a new section below existing prompt eval)

```text
+--------------------------------------------------+
| Ask AI Prompt Eval                          [v]  |
+--------------------------------------------------+
| Food Prompts (one per line)                      |
| [textarea]                                       |
|                                                  |
| Exercise Prompts (one per line)                  |
| [textarea]                                       |
|                                                  |
|                          [Run All]               |
+--------------------------------------------------+
| Results: Food (3 prompts)     [Copy Approved]    |
|                                                  |
| [+] "How has my diet changed?"           [v][x]  |
|     Your diet shows a gradual increase...        |
|     (1.2s)                                       |
|                                                  |
| [+] "What are my nutritional gaps?"      [ ][x]  |
|     Based on your data...                        |
|     (0.9s)                                       |
|                                                  |
| Results: Exercise (2 prompts) [Copy Approved]    |
| ...                                              |
+--------------------------------------------------+
```

### Technical Details

**File: `src/components/DevToolsPanel.tsx`**

Add a new section (collapsible, like the existing eval panel) with:

- State: `askAiFoodText`, `askAiExerciseText` (persisted to localStorage), `askAiResults` array of `{ prompt, mode, answer, latencyMs, error?, approved: boolean }`, `askAiRunning`
- `runAskAiTests()`: iterates through food prompts then exercise prompts, calling `supabase.functions.invoke('ask-trends-ai', { body: { question, mode, includeProfile: true } })` for each
- Results rendered as expandable cards with approve/reject toggle buttons (check/x icons)
- "Copy Approved" button per mode: filters approved results, formats as `"prompt text",` lines, copies to clipboard

**No backend changes needed** -- reuses the existing `ask-trends-ai` edge function as-is, authenticated with the current user's session.

**No changes to `AskTrendsAIDialog.tsx`** -- the "copy approved" feature gives you formatted text to paste manually into the hardcoded arrays. This keeps the prompt lists in source control where they belong.

