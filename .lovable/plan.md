

## Make AI Responses More Concise and Pattern-Focused

### Change

Update the system prompt in the edge function to stop the AI from listing individual dates and exercises verbatim, producing shorter, more scannable answers.

### Technical Details

**File:** `supabase/functions/ask-trends-ai/index.ts` -- line 166 only

Replace the `systemPrompt` string. The key differences:

| Removed | Added |
|---------|-------|
| "Reference specific data points, dates, and numbers." | "Summarize trends and patterns at a high level -- avoid listing individual dates or day-by-day examples." |
| "2-4 paragraphs max" | "2-3 short paragraphs max" |
| (nothing) | "Use ranges and generalizations (e.g. 'over the past month', 'consistently around X') instead of citing specific dates." |
| (nothing) | "Use bullet points when making multiple observations." |

No other files change. The edge function will be redeployed automatically.

