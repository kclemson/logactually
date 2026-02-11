

## Make Exercise Charts Flow Naturally

When calorie burn estimates are disabled (or have no data), the Total Volume chart currently sits alone in a 2-column grid with an empty gap. Instead, we should remove the separate wrapper div for volume/calorie burn and let all charts (volume, calorie burn, and individual exercises) flow together in a single 2-column grid.

### Changes

**`src/pages/Trends.tsx`**

Merge the volume chart, calorie burn chart, and individual exercise charts into a single `grid grid-cols-2 gap-3` container. Currently there are two separate grid containers:

1. Volume + Calorie Burn (lines ~781-800)
2. Exercise charts (lines ~814+)

Combine them into one grid so all charts flow naturally into the 2-column layout. When calorie burn is disabled/empty, the exercise charts simply fill in next to the volume chart. This also means the volume chart is always half-width, which matches the screenshot and the user's preference.
