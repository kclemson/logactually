## Change pinned bloodwork icon color

In `src/components/BloodworkPanelGroup.tsx` line 177, the pinned state currently uses `text-[hsl(0_65%_50%)]` (red). Change this to the app's custom teal/green color (`text-teal-500` or equivalent HSL) to match the "Custom" theme color used elsewhere in the app (e.g., BottomNav uses `text-teal-500 dark:text-teal-400` for custom logs).