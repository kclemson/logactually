

## Add Changelog Entry for "Ask AI" Feature

**Date**: Feb-12 (today)

**Files to create/modify**:

1. **Copy uploaded images to `public/changelog/`**:
   - `user-uploads://one.png` -> `public/changelog/ask-ai-trends.png`
   - `user-uploads://two.png` -> `public/changelog/ask-ai-food.png`
   - `user-uploads://three.png` -> `public/changelog/ask-ai-exercise.png`

2. **`src/pages/Changelog.tsx`**:
   - Add a new entry at the top of `CHANGELOG_ENTRIES` using the `images` array field (for side-by-side display, matching the Feb-04 pattern):
   - Update `LAST_UPDATED` to `"Feb-12-26"`

**Proposed blurb** (review/edit as you like):

> Added "Ask AI" on the Trends page — tap it next to Food Trends or Exercise Trends to ask questions about your data. It pulls in up to 90 days of your log history and uses AI to spot patterns, suggest improvements, and answer questions in plain language. Optionally include your personal stats for more tailored answers. Comes with randomized starter questions to get you going.

**Entry structure**:
```ts
{ date: "Feb-12", text: "...", images: ["ask-ai-trends.png", "ask-ai-food.png", "ask-ai-exercise.png"] },
```

Three images will render side-by-side (horizontally scrollable on mobile) using the existing `images` array rendering logic.

