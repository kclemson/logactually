ALTER TABLE custom_log_entries ADD COLUMN numeric_value_2 numeric;

ALTER TABLE custom_log_types DROP CONSTRAINT IF EXISTS custom_log_types_value_type_check;
ALTER TABLE custom_log_types ADD CONSTRAINT custom_log_types_value_type_check
  CHECK (value_type IN ('numeric', 'text_numeric', 'text', 'text_multiline', 'dual_numeric'));