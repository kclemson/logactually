
-- Add image_url column to feedback table
ALTER TABLE public.feedback ADD COLUMN image_url text;

-- Create feedback-images storage bucket (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('feedback-images', 'feedback-images', false);

-- RLS: Users can upload their own images
CREATE POLICY "Users can upload own feedback images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'feedback-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND NOT is_read_only_user(auth.uid())
);

-- RLS: Users can view their own images
CREATE POLICY "Users can view own feedback images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'feedback-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS: Admins can view all feedback images
CREATE POLICY "Admins can view all feedback images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'feedback-images'
  AND has_role(auth.uid(), 'admin'::app_role)
);
