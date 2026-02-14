CREATE UNIQUE INDEX custom_log_types_user_name_unique
  ON custom_log_types (user_id, lower(name));