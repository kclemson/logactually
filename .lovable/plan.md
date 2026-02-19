
# Unify All Entry Types into the Same Grid Layout

## What's changing

The screenshot shows the current state: medication rows use a clean 4-column grid (`time | dose | notes | actions`) but non-medication rows (Blood Pressure, numeric, text, etc.) use their own legacy layout from `CustomLogEntryRow` — no timestamp column, different structure.

The goal: every row uses the same 4-column grid. Timestamp goes in col 1 for all entry types. The value (formatted display + inline edit inputs) goes in col 2. Col 3 is notes/spacer. Col 4 is actions.

`CustomLogEntryRow.tsx` is retired entirely — all rendering moves into `CustomLogEntriesView.tsx`.

---

## Grid structure (unified, all types)

```text
[time: w-16] [value: auto] [notes/spacer: flex-1] [actions: auto]
```

- **Col 1 — Time**: `text-xs text-muted-foreground tabular-nums`
  - Medications: `dose_time` formatted as `h:mm a` (or `—`)
  - All other types: `logged_at` or `created_at` formatted as `h:mm a` — check which timestamp field is available on `CustomLogEntry`
- **Col 2 — Value**: type-specific content (details below)
- **Col 3 — Notes/spacer**: truncated italic muted text for medications; empty `<span />` for others (keeps grid aligned)
- **Col 4 — Actions**: pencil (medications only) + trash, `md:opacity-0 md:group-hover:opacity-100`

---

## Per-type value rendering (col 2)

| Type | Col 2 content |
|---|---|
| `medication` | `{value} {unit}` as plain text — unchanged from current |
| `numeric` | Inline-editable `<Input>` (w-14) + unit label |
| `dual_numeric` | Two inline-editable `<Input>`s (w-12 each) with `/` separator + unit label |
| `text` | `<DescriptionCell>` (inline editable text) |
| `text_numeric` | `<DescriptionCell>` + `:` + `<Input>` + unit label |
| `text_multiline` | `<textarea>` spanning cols 2–3 (no notes col, different grid) |

For `text_multiline`, since the textarea needs to span, it gets a separate 2-column grid (`[1fr_auto]`) — same as today but now with a time prefix. Actually, `text_multiline` rarely has a meaningful timestamp to show — we can still put the time in col 1, then span the textarea across cols 2–3 using `col-span-2` or just use a slightly different inner layout.

---

## Timestamp field for non-medication entries

Need to confirm what field is available. Looking at `CustomLogEntry` type: the entry likely has `logged_date` (date only) and `created_at` (full timestamp). We use `created_at` formatted as `h:mm a` for the time column on non-medication entries.

---

## What's NOT changing

- The `useInlineEdit` hook logic — stays, just moves from `CustomLogEntryRow` into inline handlers in `CustomLogEntriesView`
- The `DescriptionCell` component — still used for text/text_numeric types
- The `onUpdate` callback signature — unchanged
- Medication pencil/edit flow — unchanged
- Section headers, grouping, export footer — unchanged

---

## Files to edit

| File | Action |
|---|---|
| `src/components/CustomLogEntriesView.tsx` | Expand to handle all entry types inline; add timestamp col to all rows; import `useInlineEdit`, `Input`, `DescriptionCell` |
| `src/components/CustomLogEntryRow.tsx` | Delete — no longer used |

`OtherLog.tsx` needs no changes since `CustomLogEntriesView` already receives `onUpdate`.

---

## Visual result (after)

```
Blood Pressure
12:48 PM   120 / 80  mmHg                          [🗑]

Compazine
12:48 PM   5 mg    foo bar...              [✎]  [🗑]

Weight
9:04 AM    185.2  lbs                              [🗑]

Notes
10:00 AM   Feeling better today                    [🗑]
```

All rows share the same left-aligned time column, making the list scannable at a glance.

---

## Implementation notes

- `useInlineEdit` is a React hook so it can't be called inside a `.map()`. The current `CustomLogEntryRow` component works around this by being a separate component (hooks are called at the top of that component). We preserve this pattern by extracting a small `NonMedEntryRow` component (internal to the file, not exported) that calls `useInlineEdit` — this keeps hooks legal while avoiding a separate file.
- `text_multiline` rows will use a 2-col inner grid (`[w-16_1fr_auto]` → time | textarea | delete) since notes don't apply.
