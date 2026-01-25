-- Add source column to track how the test was processed
ALTER TABLE public.prompt_tests 
ADD COLUMN source text DEFAULT 'ai';

-- Add a check constraint for valid values
ALTER TABLE public.prompt_tests 
ADD CONSTRAINT prompt_tests_source_check 
CHECK (source IN ('upc-lookup', 'ai', 'ai-fallback'));