
CREATE TABLE public.saved_charts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  question text NOT NULL,
  chart_spec jsonb NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE public.saved_charts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved charts"
  ON public.saved_charts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved charts"
  ON public.saved_charts FOR INSERT
  WITH CHECK (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));
CREATE POLICY "Users can delete own saved charts"
  ON public.saved_charts FOR DELETE
  USING (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));
