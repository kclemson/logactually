

## UX changes from removing the "Similar Entry" feature

### What happens today

When you type something like **"leftover pizza from yesterday"** into the food input and hit Log:

1. **Input is intercepted** — the system scans your text for ~30 natural language patterns (e.g. "leftover", "yesterday", "same as", "other half", "from Monday")
2. **History search runs** — if a pattern is detected, it searches your last 90 days of food entries for a text similarity match
3. **A prompt card appears** below the input showing:
   - The matched past entry's date ("Looks like your entry from Wed, Feb 5")
   - A match confidence percentage ("87% match")
   - A preview table of that entry's food items with macros
   - Three buttons: **Use past entry** · **Log as new** · **Cancel**
4. **Your input is blocked** — nothing goes to the AI until you pick one of those three options
5. If you hit **Cancel** and re-submit the same text, it remembers you dismissed it and skips straight to AI

### What changes after removal

Typing the same input (**"leftover pizza from yesterday"**) and hitting Log:

1. **Input goes directly to AI analysis** — no interception, no prompt card, no delay
2. The AI returns nutritional estimates as usual
3. The typeahead dropdown (already live) covers the "I want to repeat a past entry" use case — you see matching suggestions *as you type*, before you even hit Log

### Visual diff

```text
BEFORE                              AFTER
┌─────────────────────┐             ┌─────────────────────┐
│ [leftover pizza   ] │             │ [leftover pizza   ] │
│ [Log]               │             │ [Log]               │
├─────────────────────┤             └─────────────────────┘
│ Looks like your     │                      │
│ entry from Wed,     │                      ▼
│ Feb 5 (87% match):  │             AI analysis runs
│ ┌─────────────────┐ │             immediately, entry
│ │ Pizza  450 cal  │ │             logged as usual
│ └─────────────────┘ │
│ [Use past] [New]    │
│ [Cancel]            │
└─────────────────────┘
         │
    User must pick
    an option first
```

### What stays the same

- **Typeahead suggestions** — the dropdown that shows previously logged items as you type remains and handles the "repeat a past entry" workflow
- **Save Suggestion prompt** — the "You've logged this 3 times, save as a meal?" prompt is a separate feature and stays
- **AI analysis** — all food analysis behavior is unchanged
- **Saved meals/routines** — unaffected

### Summary

The only user-visible change: the interstitial prompt card that appears *after* hitting Log (showing a past entry match) will no longer appear. Instead, input always proceeds to AI. Typeahead handles repeat-entry discovery *before* submission.

