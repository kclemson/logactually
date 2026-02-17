

# Add `dvh` fallback to all tall dialogs

## What this fixes
The same mobile keyboard issue we fixed in CalorieTargetDialog exists in several other dialogs. When a user taps an input, the keyboard shrinks the visible area but `vh` doesn't adjust, so content can get hidden behind the keyboard.

## Changes

Add `max-h-[Xdvh]` immediately after the existing `max-h-[Xvh]` in each dialog's `DialogContent` className. The `dvh` value overrides `vh` in modern browsers; older browsers fall back gracefully.

**Files to edit (8 total):**

1. `src/components/CalorieBurnDialog.tsx` -- `max-h-[85vh]` to `max-h-[85vh] max-h-[85dvh]`
2. `src/components/AskTrendsAIDialog.tsx` -- `max-h-[85vh]` to `max-h-[85vh] max-h-[85dvh]`
3. `src/components/SaveMealDialog.tsx` -- `max-h-[90vh]` to `max-h-[90vh] max-h-[90dvh]`
4. `src/components/SaveRoutineDialog.tsx` -- `max-h-[90vh]` to `max-h-[90vh] max-h-[90dvh]`
5. `src/components/CreateSavedDialog.tsx` -- `max-h-[90vh]` to `max-h-[90vh] max-h-[90dvh]`
6. `src/components/DemoPreviewDialog.tsx` -- `max-h-[80vh]` to `max-h-[80vh] max-h-[80dvh]`
7. `src/components/AppleHealthImport.tsx` -- `max-h-[80vh]` to `max-h-[80vh] max-h-[80dvh]`
8. `src/components/PopulateDemoDataDialog.tsx` -- `max-h-[85vh]` to `max-h-[85vh] max-h-[85dvh]`

Each is a single class addition on one line per file. No logic changes.
