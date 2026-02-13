
-- Custom log types (user-defined tracking categories)
CREATE TABLE public.custom_log_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  value_type TEXT NOT NULL CHECK (value_type IN ('numeric', 'text_numeric', 'text')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_log_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own log types"
  ON public.custom_log_types FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own log types"
  ON public.custom_log_types FOR INSERT
  WITH CHECK (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));

CREATE POLICY "Users can update own log types"
  ON public.custom_log_types FOR UPDATE
  USING (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));

CREATE POLICY "Users can delete own log types"
  ON public.custom_log_types FOR DELETE
  USING (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));

CREATE TRIGGER update_custom_log_types_updated_at
  BEFORE UPDATE ON public.custom_log_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Custom log entries (individual logged values)
CREATE TABLE public.custom_log_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_type_id UUID NOT NULL REFERENCES public.custom_log_types(id) ON DELETE CASCADE,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  numeric_value NUMERIC,
  text_value TEXT,
  unit TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_log_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own log entries"
  ON public.custom_log_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own log entries"
  ON public.custom_log_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));

CREATE POLICY "Users can update own log entries"
  ON public.custom_log_entries FOR UPDATE
  USING (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));

CREATE POLICY "Users can delete own log entries"
  ON public.custom_log_entries FOR DELETE
  USING (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));

CREATE TRIGGER update_custom_log_entries_updated_at
  BEFORE UPDATE ON public.custom_log_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for efficient date-based queries
CREATE INDEX idx_custom_log_entries_user_date ON public.custom_log_entries(user_id, logged_date);
CREATE INDEX idx_custom_log_types_user ON public.custom_log_types(user_id);
