# Timing probe: one comment-only edit

## Goal
Measure how long a single trivial edit takes end to end, and observe what Lovable's automatic post-edit processing does.

## The change
One added comment line in `src/lib/toggle-label.ts` (a small, 38-line helper that shortens log-type names for the view toggle). Nothing else in the file changes.

Specifically, add a single line above the `DEFAULT_MAX_LEN` constant, e.g.:

```text
// Timing probe: temporary no-op comment.
const DEFAULT_MAX_LEN = 11;
```

## Constraints I will honor
- Exactly one file touched; no behavior, dependency, config, or memory changes.
- No manually run typecheck, tests, lint, dev server, or build.
- Only Lovable's own automatic post-edit processing runs.
- The comment stays until you explicitly ask for it to be removed.

## What I will report back
- Total elapsed wall-clock time for the edit-bearing response.
- Whether an automatic typecheck/build ran, its result, and its duration if that information is exposed.
- Whether the preview refreshed.

Note: I can only report a typecheck duration if the automatic build log records one; if it only records pass/fail, I will say so rather than estimate.
