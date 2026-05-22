## Problem
When a user uploads a bloodwork document whose extracted collection date differs from the currently viewed date, clicking **View** navigates to `/custom?date=<new-date>` but stays in **By Type** mode if that was the active view. The user expects to see the bloodwork results in **By Date** mode.

## Root Cause
`OtherLogContent` reads its view mode (`date` vs `by_type`) from `localStorage` on mount. Because `OtherLog` remounts `OtherLogContent` via `key={dateKey}` whenever the date param changes, a fresh `getStoredViewMode()` call runs after navigation. If the user was in **By Type** mode, the new instance also starts in **By Type** mode, hiding the date-specific bloodwork panels.

## Fix
In `BloodworkUploadInput.tsx`, set `localStorage.setItem('custom-log-view-mode', 'date')` before calling `navigate()` in both:
1. `handleViewDate(date)` — used when a parsed document's extracted date differs from `loggedDate`.
2. `handleViewExisting(panel)` — used when clicking **View existing** on a duplicate file.

This ensures the remounted `OtherLogContent` reads `date` mode and renders the date-specific view with `BloodworkPanelGroup` visible.