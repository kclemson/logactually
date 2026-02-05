-- Add is_auto_named column to track auto-generated routine names
ALTER TABLE saved_routines 
ADD COLUMN is_auto_named boolean NOT NULL DEFAULT true;