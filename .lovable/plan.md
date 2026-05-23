## Problem

The bloodwork chart line is hardcoded to red (`hsl(0 65% 50%)`) in `src/lib/chart-dsl.ts`, which clashes with the app's Custom=Teal color theme and reads as "bad" rather than "bloodwork."

## Plan

1. Change the bloodwork chart color in `src/lib/chart-dsl.ts` from red to teal (`hsl(173 80% 40%)`) to match the Custom Trends thematic color.

2. Leave the per-dot High/Low flag colors unchanged:
   - Amber dot = above reference range
   - Blue dot = below reference range  
   - In-range dots inherit the line color (now teal, via the existing `color` variable in DynamicChart)

This keeps the health signal of out-of-range flags while unifying the line with the Custom aesthetic.

## Files changed

- `src/lib/chart-dsl.ts` — single color token swap