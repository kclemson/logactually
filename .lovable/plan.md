# Fix: "view" link 404 after bloodwork upload

## Problem

After uploading a bloodwork file, the "Saved to <date> · view" link 404s. The custom log page is mounted at `/custom`, but `BloodworkUploadInput.tsx` navigates to `/other?date=...` in two places:

- `handleViewSaved` (clicked from the success link)
- `handleViewExisting` (clicked from the duplicate dialog)

## Change

In `src/components/BloodworkUploadInput.tsx`, replace both `/other?date=...` strings with `/custom?date=...`.

No other files affected. No backend changes.
