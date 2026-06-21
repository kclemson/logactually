-- 1. Additive columns on custom_log_entries (memory-only, harmless to other log types)
ALTER TABLE public.custom_log_entries
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid();

-- Backfill author = owner for existing rows
UPDATE public.custom_log_entries SET created_by = user_id WHERE created_by IS NULL;

-- 2. memory_media table
CREATE TABLE public.memory_media (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  created_by uuid DEFAULT auth.uid(),
  entry_id uuid NOT NULL REFERENCES public.custom_log_entries(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('image','video')),
  mime_type text,
  width integer,
  height integer,
  duration_secs numeric,
  poster_path text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_memory_media_entry_id ON public.memory_media(entry_id);
CREATE INDEX idx_memory_media_user_id ON public.memory_media(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.memory_media TO authenticated;
GRANT ALL ON public.memory_media TO service_role;

ALTER TABLE public.memory_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own memory media"
  ON public.memory_media FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own memory media"
  ON public.memory_media FOR INSERT
  WITH CHECK (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));

CREATE POLICY "Users can update own memory media"
  ON public.memory_media FOR UPDATE
  USING (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));

CREATE POLICY "Users can delete own memory media"
  ON public.memory_media FOR DELETE
  USING (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));

-- 3. Storage RLS for the private memory-media bucket (owner-prefixed paths)
CREATE POLICY "Users can read own memory media files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'memory-media' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own memory media files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'memory-media' AND (auth.uid())::text = (storage.foldername(name))[1] AND NOT is_read_only_user(auth.uid()));

CREATE POLICY "Users can delete own memory media files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'memory-media' AND (auth.uid())::text = (storage.foldername(name))[1] AND NOT is_read_only_user(auth.uid()));