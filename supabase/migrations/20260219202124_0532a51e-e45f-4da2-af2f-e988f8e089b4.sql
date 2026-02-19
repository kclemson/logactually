
ALTER TABLE public.custom_log_types 
  ADD COLUMN default_dose numeric NULL,
  ADD COLUMN doses_per_day int NOT NULL DEFAULT 0,
  ADD COLUMN dose_times text[] NULL;
