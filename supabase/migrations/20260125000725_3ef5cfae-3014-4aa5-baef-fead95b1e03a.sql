-- Add flexible JSONB settings column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN settings jsonb DEFAULT '{"theme": "system"}'::jsonb;

COMMENT ON COLUMN public.profiles.settings IS 'User preferences stored as JSON (theme, etc.)';