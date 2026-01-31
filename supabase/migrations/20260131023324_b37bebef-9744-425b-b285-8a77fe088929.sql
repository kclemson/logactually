-- Add cardio-specific columns (nullable for backwards compatibility)
ALTER TABLE weight_sets 
  ADD COLUMN duration_minutes integer,
  ADD COLUMN distance_miles numeric;

-- Set defaults on existing columns for resilience (Postel's Law)
-- This only affects NEW inserts with missing values, not existing data
ALTER TABLE weight_sets
  ALTER COLUMN sets SET DEFAULT 0,
  ALTER COLUMN reps SET DEFAULT 0,
  ALTER COLUMN weight_lbs SET DEFAULT 0;