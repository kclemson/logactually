

## Cap Changelog Thumbnail Width

Add a `max-w-[280px]` constraint to both the single-image and multi-image `<img>` tags in `src/pages/Changelog.tsx`. This keeps landscape screenshots (like the portion scaling and photo logging ones) from dominating the page while portrait/square ones stay reasonably sized.

### Technical Details

In `src/pages/Changelog.tsx`, update the two `<img>` className strings:

1. **Single image** (around line 85): add `max-w-[280px]` to the existing classes.
2. **Multi-image** (around line 94): add `max-w-[280px]` to each image in the `.images` array.

No other files need changes.

