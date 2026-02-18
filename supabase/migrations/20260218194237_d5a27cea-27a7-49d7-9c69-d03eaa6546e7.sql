
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
