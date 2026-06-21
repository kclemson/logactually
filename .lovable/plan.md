# Make scrapbook entries sort newest-first within each day

## Problem

In the `/custom` list, scrapbook (memory) entries under a date header appear **oldest-first**, the opposite of every other log type, which lists entries **newest-first** within a day. This breaks the user's expectation of descending-timestamp order.

## Root cause

`src/hooks/useMemoryDays.ts` orders entries by `logged_date` descending (correct — newest day first) but `created_at` **ascending** (oldest entry first within a day). The equivalent hook for all other types, `useCustomLogEntriesForType.ts`, orders `created_at` **descending**.

## Fix

In `src/hooks/useMemoryDays.ts`:

- Change the secondary sort from `.order('created_at', { ascending: true })` to `.order('created_at', { ascending: false })` so within-day entries are newest-first, matching the rest of the app.
- Update the hook's doc comment, which currently says entries are "ordered oldest-first," to say newest-first.

This also makes the immersive viewer (which builds its slide list from the same `days` data) step through a day's entries newest-first, keeping the list and viewer consistent. Media *within* a single entry is still ordered by the user's chosen `sort_order` and is unaffected. Day grouping (newest day first) is unchanged.

## Verification

- Open `/custom`, expand a scrapbook type with a day that has multiple entries: confirm the most recently added entry appears at the top of that date.
- Open the viewer on that day and confirm swiping moves newest → oldest, consistent with the list.
