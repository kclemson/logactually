## Goal

Get the test suite fully green before you publish, by fixing the single stale test that's unrelated to the scrapbook. No app behavior changes.

## Background

`DateNavigation.tsx` intentionally renders the Next-day arrow with `disabled={false}` (line 101) — your design decision to allow navigating to future days ("no future blocks"). The test `disables next-day button when on today` still asserts the button is disabled, so it fails even though the app is behaving as intended.

## Change

In `src/components/DateNavigation.test.tsx`, replace the stale test:

```text
it('disables next-day button when on today', ...) {
  ...expect(nextButton).toBeDisabled();
}
```

with one that matches current behavior:

```text
it('keeps next-day button enabled on today (no future-date block)', ...) {
  ...expect(nextButton).toBeEnabled();
}
```

Same render setup (`selectedDate={new Date()}`, `isTodaySelected={true}`), only the assertion flips from `toBeDisabled()` to `toBeEnabled()`, plus a renamed test title that documents the intent.

## Verification

Run `bunx vitest run` and confirm all tests pass (expected: 311/311).

## Scope

- One file edited: `src/components/DateNavigation.test.tsx`
- No production/runtime code touched, no scrapbook code touched, no schema changes.

After this passes, you can publish from the Publish button whenever you're ready.
