
## Plan: "View by Log Type" + Medication Schema Thinking

---

### Part 1: View by Log Type (what we're building now)

#### What changes in OtherLog

`OtherLogContent` in `src/pages/OtherLog.tsx` gets a `viewMode` state (`'date' | 'type'`) that is:
- Initialized from `localStorage.getItem('custom-log-view-mode')`, falling back to `'date'`
- Written back to localStorage in the change handler (not a useEffect — just write in the handler directly)

The toggle only appears when `logTypes.length > 0`. When there are no log types yet, the existing onboarding template-picker UI renders unchanged.

#### The three-control row in type view

In date view, the current teal "Add custom log" Select sits alone. When `viewMode === 'type'`, the row becomes three controls:

```text
[ View: By Log Type ▾ ]   [ Body Weight ▾ ]   [ + Log Body Weight ]
```

- **Left**: a plain (non-teal) `<Select>` with options "By Date" and "By Log Type"
- **Middle**: a `<Select>` showing all log type names, defaulting to `sortedLogTypes[0]` (most recently used, same logic that already exists). Its selected value is stored in the same component state as the existing `selectedTypeId`.
- **Right**: a teal button `+ Log [Type Name]` — clicking it opens the existing `LogEntryInput` inline form below (the same `showInput` flag already in the component). In type view, `LogEntryInput` always submits `logged_date = today` (format today's date as `yyyy-MM-dd`).

In date view, the view-mode select and the existing "Add custom log" Select sit on the same row (view select on the left, action select on the right, same layout as today but with the view dropdown added).

#### New hook: `useCustomLogEntriesForType`

New file: `src/hooks/useCustomLogEntriesForType.ts`

Fetches all entries for a single `log_type_id` across all dates, ordered by `created_at DESC`, limit 500. This parallels `useCustomLogEntries(dateStr)` which fetches by date.

Mutations:
- `deleteEntry`: same as existing, but invalidates `['custom-log-entries-for-type', logTypeId]` in addition to the date-keyed query
- `createEntry`: inserts with `logged_date = today`, invalidates both query keys

The date-keyed and type-keyed queries stay in sync because both are invalidated on any mutation from either hook.

#### New component: `CustomLogTypeView`

New file: `src/components/CustomLogTypeView.tsx`

Renders the full history table for a selected log type. Key decisions:

**Date column rendering** — which timestamp to show depends on the `value_type`:
- `text` and `text_multiline`: show `created_at` with time of day — "Today, 2:14 PM" / "Yesterday, 8:00 AM" / "Feb 18, 3:00 PM". This is meaningful for things like medication notes, mood entries, journal entries where time matters.
- `numeric`, `dual_numeric`, `text_numeric`: show `logged_date` as a plain date — "Feb 18" / "Yesterday" / "Today". Time of day is not meaningful for a body weight or blood pressure reading.

**Value column** — renders using the same value display logic already in `CustomLogEntryRow`. The type view is intentionally read-only (no inline editing). Edits still happen in the date view. This keeps the type view simple.

**Delete** — trash icon per row, same appearance as `CustomLogEntryRow`.

**Empty state** — "No entries yet for [Type Name]. Tap + Log to add your first entry."

The component receives: `logType: CustomLogType`, `entries: CustomLogEntry[]`, `isLoading: boolean`, `onDelete: (id: string) => void`, `isReadOnly: boolean`.

#### What OtherLog.tsx renders in type view

When `viewMode === 'type'`:
- The three-control row (view select | type select | add button)
- `LogEntryInput` form (inline, shown when `showInput` is true), submitting to today's date
- `CustomLogTypeView` table (no DateNavigation, no grouped-by-date entries list)

When `viewMode === 'date'`:
- The view-mode select + existing "Add custom log" Select on the same row (unchanged behavior)
- Existing `DateNavigation`
- Existing grouped-by-date entries

#### Files changed for Phase 1

| File | Change |
|---|---|
| `src/hooks/useCustomLogEntriesForType.ts` | New — all entries for one type, newest first |
| `src/components/CustomLogTypeView.tsx` | New — read-only type-first history table |
| `src/pages/OtherLog.tsx` | Add view-mode Select with localStorage; conditional rendering |

No database changes. No changes to `CustomLogEntryRow`, `LogEntryInput`, Settings, Trends, or export.

---

### Part 2: Medication schema — thinking through it before committing

You asked the right question by looking at what Apple Health does. The key insight from comparing their flow to what would actually be useful in this app:

#### What Apple Health tracks that we probably don't need

- **Form factor** (liquid-filled capsule, tablet, foam, gel) — Apple needs this for the visual pill log and potentially for interactions. We don't need it.
- **Scheduled reminders** (specific time, cyclical schedules) — we have no notification infrastructure. Out of scope for now.
- **Duration/recurrence** (end date) — tightly tied to reminder schedules. Out of scope.
- **Pill shape** — visual customization. Not useful for logging.

#### What Apple Health tracks that IS useful signal for us

- **Name** (obvious)
- **Strength** (e.g. 325mg) — this is what `unit` already captures on `custom_log_types`
- **"As needed" vs scheduled** — this is actually the most interesting one for us

#### The "as needed" insight

Your friend's spreadsheet is entirely "as needed" medications — Compazine, Ativan, Tylenol for pain. The Apple Health flow distinguishes "as needed" from "every day at the same time". For our use case, the interesting constraint is specifically the **as-needed** case: "I can only take this every 6 hours" or "max 3 doses per day."

The scheduled case (take every day at 8am) is really a reminder feature, which we can't support yet.

So the fields that actually serve a non-reminder purpose are:

- `med_min_hours_between_doses numeric` — "I took this. When can I take it again?" Computed answer: `last_taken_at + min_hours`. Directly useful as a display feature in the type view ("Next dose available in 3h 20m").
- `med_max_doses_per_day integer` — "Have I hit my limit today?" Computed from counting today's entries.
- `med_notes text` — The free-text "Anti-nausea: Morning and Evening Day 2, 3, 4" from your friend's spreadsheet. Also useful for "Take with food" type instructions.

What Apple calls "strength" (325mg) we handle naturally via `unit` on `custom_log_types` — the log type named "Tylenol" has `unit = "mg"` and each dose entry has `numeric_value = 325`.

#### Schema recommendation: four nullable columns on `custom_log_types`

```sql
ALTER TABLE custom_log_types
  ADD COLUMN is_medication boolean NOT NULL DEFAULT false,
  ADD COLUMN med_min_hours_between_doses numeric,
  ADD COLUMN med_max_doses_per_day integer,
  ADD COLUMN med_notes text;
```

This is deferred to Phase 2. We are not building the medication creation dialog or medication-specific UI in this plan. What we ARE building (the type view) will already work perfectly for medications once Phase 2 adds the medication columns — the type view's time-aware date display (`created_at` with time-of-day for `text` types) is exactly right for medication dose logging.

#### Why defer?

The "as needed" columns (`min_hours_between_doses`, `max_doses_per_day`) only become meaningful UI when we build the "next dose available in X hours" indicator. That indicator belongs in the type view — which we're building now. But we can add it in the same page once the schema exists. There's no blocker to shipping the type view first and layering medication metadata on top. A user creating a "Tylenol" custom log type today will get the full medication experience once Phase 2 lands.

The medication creation flow (the specialized dialog, the template picker entry) is Phase 2 scope.

---

### Implementation order

1. Create `src/hooks/useCustomLogEntriesForType.ts`
2. Create `src/components/CustomLogTypeView.tsx`
3. Update `src/pages/OtherLog.tsx` — add view-mode select, conditional rendering

No migration needed for Phase 1.
