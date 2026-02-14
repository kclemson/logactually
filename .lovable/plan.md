

## Replace Ask AI Screenshots with Single Image

### Steps

1. **Copy new screenshot** -- Save `user-uploads://askai.png` to `public/changelog/ask-ai.png`.

2. **Update the Feb-12 changelog entry** in `src/pages/Changelog.tsx` -- Change the Feb-12 entry from `images: ["ask-ai-trends.png", "ask-ai-food.png", "ask-ai-exercise.png"]` to `image: "ask-ai.png"`.

3. **Delete old screenshots** -- Remove the three files that are no longer referenced:
   - `public/changelog/ask-ai-trends.png`
   - `public/changelog/ask-ai-food.png`
   - `public/changelog/ask-ai-exercise.png`

