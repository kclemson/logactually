ALTER TABLE public.custom_log_types DROP CONSTRAINT custom_log_types_value_type_check;

ALTER TABLE public.custom_log_types ADD CONSTRAINT custom_log_types_value_type_check CHECK (value_type IN ('numeric', 'text_numeric', 'text', 'text_multiline'));