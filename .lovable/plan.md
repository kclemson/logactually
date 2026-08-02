Fix changelog multi-image layout

The Aug-02 Quick Add changelog entry uses two images rendered side-by-side via the `images` array syntax. The user reports they are not visible when rendered horizontally and wants them stacked vertically.

Changes
- In `src/pages/Changelog.tsx`, update the `entry.images` rendering block so the container lays out images in a vertical column (`flex-col`) instead of a horizontal wrap (`flex-wrap`).
- Keep existing image sizing (`max-h-[200px] max-w-[280px]`), lazy loading, click-to-lightbox behavior, and the single-image `entry.image` path unchanged.
- No data or asset changes are needed; the existing `images: ["quick-add-food.png", "quick-add-exercise.png"]` entry continues to work.

If vertical stacking with the existing `images` array still does not render well, we can fall back to a single combined image provided by the user.
