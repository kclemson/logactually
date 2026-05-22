
ALTER TABLE public.bloodwork_panels
  ADD COLUMN IF NOT EXISTS file_sha256 text,
  ADD COLUMN IF NOT EXISTS content_signature text;

CREATE UNIQUE INDEX IF NOT EXISTS bloodwork_panels_user_file_hash_uniq
  ON public.bloodwork_panels (user_id, file_sha256)
  WHERE parse_status <> 'failed' AND file_sha256 IS NOT NULL;

CREATE INDEX IF NOT EXISTS bloodwork_panels_user_signature_idx
  ON public.bloodwork_panels (user_id, collected_date, content_signature)
  WHERE content_signature IS NOT NULL;
