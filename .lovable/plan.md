

# Three Feedback UX Tweaks

## 1. Color the plain "Resolved" badge

Currently, items resolved without reason show `✓ Resolved` in `text-muted-foreground` (gray), making it look unaddressed. Change it to blue (`text-[hsl(217_91%_60%)]`) to match the app's action/link color. The green "Resolved (Fixed)" stays green.

**Files:** `src/components/FeedbackForm.tsx` (user-facing) and `src/pages/Admin.tsx` (admin resolved section)

## 2. Remove blank line before `---` in follow-up messages

When `handleReply` builds the updated message, it currently uses `\n\n---\n` which produces a blank line before the separator. Change to `\n---\n` so the separator sits directly below the previous text.

**File:** `src/components/FeedbackForm.tsx` line 71

| Current | New |
|---------|-----|
| `` `${item.message}\n\n---\nFollow-up:\n${followUp}` `` | `` `${item.message}\n---\nFollow-up:\n${followUp}` `` |

## 3. Add timestamp to "Follow-up" label

Replace the static `Follow-up:` prefix with `Follow-up on MMM DD HH:MM:` using the client's local time at the moment of submission. The browser's `Date` object and `date-fns` `format()` already use local timezone by default, so no extra configuration is needed.

**File:** `src/components/FeedbackForm.tsx` line 71

The final template becomes:
```
`${item.message}\n---\nFollow-up on ${format(new Date(), "MMM d HH:mm")}:\n${followUp}`
```

## Technical details

| File | Change |
|------|--------|
| `src/components/FeedbackForm.tsx` line 71 | Change `\n\n---\nFollow-up:\n` to `\n---\nFollow-up on ${format(new Date(), "MMM d HH:mm")}:\n` |
| `src/components/FeedbackForm.tsx` lines 149-153 | Change the plain-resolved color from `text-muted-foreground` to `text-[hsl(217_91%_60%)]` |
| `src/pages/Admin.tsx` resolved section | Add a `✓ Resolved` badge (blue) for items without `resolved_reason`, matching the user-facing style |

No new files or dependencies needed. `format` from `date-fns` is already imported.
