

## Pinned Chats for Ask AI

### What the user sees

1. **Pin icon + count badge in dialog header** -- A small `Pin` icon appears in the header area (near the existing refresh button position). When pinned chats exist, a count badge shows (e.g., "3"). Tapping it switches to the pinned chats view.

2. **Pin button on AI responses** -- After the AI answers, a pin icon appears next to the "Ask another question" button. Tapping it shows "Pinned!" text briefly (~1.5s), then switches to a filled/active pin state. Same transient feedback pattern as "Copied" elsewhere.

3. **Pinned chats view** -- Shows all pinned chats (food and exercise combined), newest first. Each item shows:
   - Timestamp: `MMM d h:mm a` format
   - Mode badge: "Food" or "Exercise"
   - Full question text (no truncation, wraps naturally across lines)
   - Expand/collapse chevron for the AI answer (inline, no navigation)
   - Unpin button (trash or X icon) per item
   - "Back" button to return to the ask view

4. **Empty state** -- If no pinned chats exist, show a brief message like "No pinned chats yet. Pin an AI response to save it here."

### Visual layout

```text
Ask view (with response):
+------------------------------------------+
| Sparkles  Ask AI about food trends  [Pin 3] [X] |
+------------------------------------------+
| "What patterns do you see?"              |
|                                          |
| [AI response text...]                    |
|                                          |
| [Pin icon]  [Ask another question]       |
+------------------------------------------+

Pinned chats view:
+------------------------------------------+
| Pin  Pinned chats              [<- Back] [X] |
+------------------------------------------+
| Feb 18 2:30 PM  -  Food          [Unpin] |
| "What patterns do you notice in how I    |
|  eat on higher-calorie vs lower-calorie  |
|  days?"                             [v]  |
|------------------------------------------|
| Feb 15 9:15 AM  -  Exercise      [Unpin] |
| "Am I neglecting any movement            |
|  patterns?"                         [v]  |
+------------------------------------------+
```

### Technical Details

#### 1. Database: `pinned_chats` table

New table with RLS following existing patterns:

```sql
CREATE TABLE public.pinned_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  mode text NOT NULL CHECK (mode IN ('food', 'exercise')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pinned_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pinned chats"
  ON public.pinned_chats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pinned chats"
  ON public.pinned_chats FOR INSERT
  WITH CHECK (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));

CREATE POLICY "Users can delete own pinned chats"
  ON public.pinned_chats FOR DELETE
  USING (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));
```

No UPDATE policy needed -- pins are immutable (create or delete only).

#### 2. New hook: `src/hooks/usePinnedChats.ts`

- `usePinnedChats()` returns:
  - `pinnedChats`: array ordered by `created_at DESC`
  - `pinCount`: number for the badge
  - `pinMutation`: insert (question, answer, mode)
  - `unpinMutation`: delete by id
- Uses React Query with `['pinned-chats']` query key
- Optimistic updates for instant UI feedback on pin/unpin

#### 3. Update `src/components/AskTrendsAIDialog.tsx`

- Add `view` state: `'ask' | 'pinned'`
- **Header**: Add pin icon button with count badge, positioned similar to the refresh icon. Only shows when in ask view. In pinned view, header shows "Pinned chats" with a back arrow.
- **Response view**: Add `Pin` icon button in the same row as "Ask another question". On click: call `pinMutation`, show "Pinned!" for 1.5s, then show filled pin. If already pinned (check by matching question+answer in pinned list), show filled pin immediately.
- **Pinned view**: List of pinned chats with:
  - `format(createdAt, 'MMM d h:mm a')` using date-fns
  - Mode badge (small pill: "Food" / "Exercise")
  - Question text displayed in full (text wraps, no truncation)
  - Chevron to expand/collapse the answer inline
  - Unpin button (small icon) per item
  - Empty state message when no pins exist

### Files to create
- `src/hooks/usePinnedChats.ts`

### Files to modify
- `src/components/AskTrendsAIDialog.tsx` -- pin button on responses, header badge, pinned view
- Database migration for `pinned_chats` table

