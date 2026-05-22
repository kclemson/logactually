
-- bloodwork_panels: one row per uploaded document
CREATE TABLE public.bloodwork_panels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  log_type_id uuid NOT NULL,
  collected_date date,
  panel_title text,
  storage_path text NOT NULL,
  source_mime_type text,
  source_filename text,
  raw_extraction jsonb,
  parse_status text NOT NULL DEFAULT 'pending',
  parse_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bloodwork_panels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bloodwork panels"
  ON public.bloodwork_panels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bloodwork panels"
  ON public.bloodwork_panels FOR INSERT
  WITH CHECK ((auth.uid() = user_id) AND (NOT is_read_only_user(auth.uid())));
CREATE POLICY "Users can update own bloodwork panels"
  ON public.bloodwork_panels FOR UPDATE
  USING ((auth.uid() = user_id) AND (NOT is_read_only_user(auth.uid())));
CREATE POLICY "Users can delete own bloodwork panels"
  ON public.bloodwork_panels FOR DELETE
  USING ((auth.uid() = user_id) AND (NOT is_read_only_user(auth.uid())));

CREATE TRIGGER update_bloodwork_panels_updated_at
  BEFORE UPDATE ON public.bloodwork_panels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_bloodwork_panels_user_date
  ON public.bloodwork_panels(user_id, collected_date DESC);
CREATE INDEX idx_bloodwork_panels_log_type
  ON public.bloodwork_panels(log_type_id);

-- bloodwork_results: one row per extracted analyte
CREATE TABLE public.bloodwork_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  panel_id uuid NOT NULL REFERENCES public.bloodwork_panels(id) ON DELETE CASCADE,
  collected_date date,
  panel_section text,
  section_order integer NOT NULL DEFAULT 0,
  result_order integer NOT NULL DEFAULT 0,
  analyte_name text NOT NULL,
  canonical_key text NOT NULL,
  display_name text NOT NULL,
  numeric_value numeric,
  unit text,
  reference_low numeric,
  reference_high numeric,
  reference_raw text,
  flag text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bloodwork_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bloodwork results"
  ON public.bloodwork_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bloodwork results"
  ON public.bloodwork_results FOR INSERT
  WITH CHECK ((auth.uid() = user_id) AND (NOT is_read_only_user(auth.uid())));
CREATE POLICY "Users can update own bloodwork results"
  ON public.bloodwork_results FOR UPDATE
  USING ((auth.uid() = user_id) AND (NOT is_read_only_user(auth.uid())));
CREATE POLICY "Users can delete own bloodwork results"
  ON public.bloodwork_results FOR DELETE
  USING ((auth.uid() = user_id) AND (NOT is_read_only_user(auth.uid())));

CREATE INDEX idx_bloodwork_results_trend
  ON public.bloodwork_results(user_id, canonical_key, collected_date);
CREATE INDEX idx_bloodwork_results_panel
  ON public.bloodwork_results(panel_id);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('bloodwork-files', 'bloodwork-files', false);

CREATE POLICY "Users can read own bloodwork files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'bloodwork-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload own bloodwork files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'bloodwork-files' AND auth.uid()::text = (storage.foldername(name))[1] AND (NOT is_read_only_user(auth.uid())));
CREATE POLICY "Users can delete own bloodwork files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'bloodwork-files' AND auth.uid()::text = (storage.foldername(name))[1] AND (NOT is_read_only_user(auth.uid())));
