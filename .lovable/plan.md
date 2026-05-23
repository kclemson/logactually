## Boost shaded reference range visibility in dark theme

The bloodwork "normal range" shaded band uses fixed opacities (`0.12` fill, `0.25` stroke) that read fine on a light background but nearly disappear on the dark `--card` background.

### Change

In `src/components/trends/DynamicChart.tsx` (line ~289-300), bump opacities so the band is visible in dark mode without overwhelming light mode. Use Tailwind's `dark:` variant via inline computation since this is a Recharts SVG element (no className passthrough), so instead detect theme via `document.documentElement.classList.contains('dark')` at render time, or simpler — just raise the base values to a level that works in both modes.

Proposed values:
- `fillOpacity`: `0.12` → `0.22`
- `strokeOpacity`: `0.25` → `0.5`

These are still subtle on light backgrounds but become clearly visible on dark. Color (`hsl(142 71% 45%)`) and dashed stroke are unchanged.

No other files touched.