-- Add source_routine_id column to weight_sets table
ALTER TABLE weight_sets 
ADD COLUMN source_routine_id uuid DEFAULT NULL;