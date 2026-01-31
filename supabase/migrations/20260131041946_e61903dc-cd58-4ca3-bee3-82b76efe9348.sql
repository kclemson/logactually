-- Change duration_minutes from integer to numeric to support fractional minutes
ALTER TABLE weight_sets 
ALTER COLUMN duration_minutes TYPE numeric USING duration_minutes::numeric;