
-- Add description to custom_log_types
ALTER TABLE public.custom_log_types ADD COLUMN description text NULL;

-- Add logged_time and entry_notes to custom_log_entries
ALTER TABLE public.custom_log_entries
  ADD COLUMN logged_time time NULL,
  ADD COLUMN entry_notes text NULL;

-- Drop and recreate value_type check constraint to include medication
ALTER TABLE public.custom_log_types
  DROP CONSTRAINT IF EXISTS custom_log_types_value_type_check;
ALTER TABLE public.custom_log_types
  ADD CONSTRAINT custom_log_types_value_type_check
  CHECK (value_type IN ('numeric','text_numeric','text','text_multiline','dual_numeric','medication'));
