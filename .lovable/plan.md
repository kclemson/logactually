## Goal

Two changes bundled together:

1. **Extracted date is source of truth.** The `collected_date` on a bloodwork panel comes from the document itself (set by the parser), not from whatever day the user was viewing when they uploaded. Panels appear in the day-view of their real collection date.
2. **Two-layer duplicate detection** to prevent accidentally re-uploading the same labs.

## Duplicate detection

**Layer 1 — File-bytes hash (pre-parse, global per user).**
SHA-256 the file in the browser before upload. Query existing panels by `(user_id, file_sha256)` — no date filter, because we don't know the collection date yet, and identical bytes = identical labs regardless. If a match exists (and isn't `parse_status='failed'`), block upload immediately, no storage write, no AI call.

**Layer 2 — Content signature (post-parse, scoped to extracted date).**
After parse succeeds in the edge function, compute `content_signature = collected_date + ":" + sorted(canonical_keys).join(",")`. Look for an existing `parse_status='success'` panel with the same `(user_id, collected_date, content_signature)`. If found, set the new panel to `parse_status='duplicate_pending'` and stash the matched panel id in `raw_extraction.duplicate_of`. No results inserted yet.

Both layers block at save and ask the user what to do — never auto-discard, never silently keep both.

## Flow

```text
client picks file
  │
  ▼
hash file (SubtleCrypto)
query bloodwork_panels for (user, file_sha256, status ≠ failed)
  │
  ├─ match → DuplicateBlockedDialog:
  │      "You already uploaded this file. It was logged for [extracted_date of match]."
  │      [View existing] [Upload anyway] [Cancel]
  │
  └─ no match → upload bytes to storage
                insert panel: collected_date=NULL, file_sha256=hash, parse_status='pending'
                invoke parse-bloodwork
                  │
                  ▼
            edge function:
              parse with AI → get collected_date + sections
              set collected_date on panel from extraction
              compute content_signature
              check for existing (user, collected_date, signature) with status='success'
                  │
                  ├─ match → parse_status='duplicate_pending', raw_extraction.duplicate_of=existing_id
                  │            client sees duplicate_pending → DuplicateContentDialog:
                  │              "These look like the same labs as [existing panel], collected [date]."
                  │              [Replace existing] [Keep both] [Discard this one]
                  │
                  └─ no match → insert results, parse_status='success'
                                inline confirmation to user: "Saved to [Mar 14, 2025] — view"
```

## Date-from-extraction changes

- `bloodwork_panels.collected_date` stays nullable, set by edge function from AI extraction (not by client at insert time).
- Client insert no longer passes `collected_date`. The "upload row" is just the entrypoint — the day being viewed doesn't determine where the panel lands.
- If extraction can't find a collection date, edge function leaves it null and sets `parse_status='success'` anyway with a `parse_error` note like "Couldn't find collection date — tap to set manually." Panel surfaces in a small "needs a date" bucket on today's view until the user assigns one. (Manual date-fix UI is out of scope for this round; just surfacing the unassigned state is enough.)
- After successful parse, `useBloodworkPanelsForDate` queries the panel's actual extracted date, so the new panel "jumps" from the upload day to its real date. UX: while parsing, show a small inline "Reading your labs…" row on today's view; on success, replace it with a brief toast/inline confirmation `Saved to Mar 14, 2025 [view]` that links to that date.
- `bloodwork_results.collected_date` is also set by edge function from the extracted date (already denormalized for fast trend queries).

## Schema changes

`bloodwork_panels`:
- `file_sha256 text` — set by client on insert.
- `content_signature text` — set by edge function after parse.
- New allowed `parse_status` value: `duplicate_pending`.
- Partial unique index for Layer 1: `unique (user_id, file_sha256) where parse_status <> 'failed' and file_sha256 is not null`.
- **No unique index for Layer 2** — enforced purely by edge function, so the "Keep both" choice works.

## Client actions on Layer 2 prompt

- **Replace existing**: delete the old panel (cascades results + storage file via existing `deletePanel`), then flip new panel to `success` and bulk-insert results from `raw_extraction`.
- **Keep both**: flip new panel to `success` and insert results. Allowed because no unique index blocks it.
- **Discard this one**: delete the new panel + its storage file.

## UI

- **`DuplicateBlockedDialog`** (Layer 1) — modal, three actions. Shows existing panel's filename, original upload time, and its extracted collection date.
- **`DuplicateContentDialog`** (Layer 2) — modal, three actions. Side-by-side: existing panel title + result count + collection date vs new panel's same fields.
- **`BloodworkUploadInput`**: adds the pre-upload SHA-256 hash step and Layer 1 dialog trigger. Stops passing `loggedDate` as the source-of-truth date; passes it only as a "view context" for the post-parse toast.
- **Post-parse confirmation**: small non-blocking inline message on the upload row: `Saved to [Mar 14, 2025] · view`. If the extracted date == the day being viewed, the panel just appears in place and no jump message is needed.
- **Unassigned-date state**: panels with `collected_date=null` and `parse_status='success'` show on today's view with a "no date found" label, deferred for manual fix later.

## Hooks

`useBloodworkPanels.ts`:
- `uploadAndParse` mutation:
  - Hash file → `findByHash(hash)` (global per user, no date filter).
  - If hit → throw a typed `DuplicateFileError` carrying the matched panel; component opens Layer 1 dialog.
  - Else upload, insert panel with `collected_date=null` and `file_sha256`, invoke function, return the panel id and (after the function resolves) the extracted `collected_date`.
- `resolveDuplicate(panelId, action, existingPanelId?)` mutation for the Layer 2 dialog.
- `useDuplicatePendingPanels()` — small global query so the Layer 2 dialog can open on whatever day the panel actually landed on.
- Invalidate `bloodwork-panels` for both the old viewing date and the newly extracted date after success.

## Edge function changes

`parse-bloodwork`:
- After parse: set `collected_date` on the panel from extraction.
- Compute `content_signature`.
- Check for `(user_id, collected_date, content_signature, parse_status='success')` match → if found, set `parse_status='duplicate_pending'`, write `raw_extraction.duplicate_of`, return early without inserting results.
- Else: insert `bloodwork_results` (with their own `collected_date` from extraction) and set `parse_status='success'`.
- If extraction returns no date: leave `collected_date` null, write a short note to `parse_error`, still `parse_status='success'`.

## Out of scope

- Cross-date duplicate detection beyond bytes-hash (covered by Layer 1).
- Fuzzy matching on value drift (e.g. AI parsed slightly different numbers).
- Manual date-fix UI for unassigned panels (just surface them; fix later).
- Bulk dedup sweep of historical panels.

## Files touched

- New migration: add `file_sha256`, `content_signature` columns; Layer 1 partial unique index; allow `duplicate_pending` status.
- `supabase/functions/parse-bloodwork/index.ts`: set `collected_date` from extraction, signature computation, duplicate branch.
- `src/hooks/useBloodworkPanels.ts`: pre-upload hash check + `DuplicateFileError`, drop client-side `collected_date`, `resolveDuplicate` mutation, `useDuplicatePendingPanels`, dual-date cache invalidation.
- `src/components/BloodworkUploadInput.tsx`: SHA-256 hash, Layer 1 dialog wiring, post-parse confirmation showing extracted date.
- New: `src/components/DuplicateBlockedDialog.tsx`, `src/components/DuplicateContentDialog.tsx`.
- `src/components/CustomLogEntriesView.tsx` (or `BloodworkPanelGroup.tsx`): surface `duplicate_pending` panels, open Layer 2 dialog; surface unassigned-date panels.
- Update `mem://features/bloodwork-panel-system` to document: extracted-date as source of truth, two-layer dedup contract, and the upload-day vs collection-day UX.
