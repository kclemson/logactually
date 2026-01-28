-- Create saved_routines table for storing workout routines
CREATE TABLE public.saved_routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  original_input text,
  exercise_sets jsonb NOT NULL DEFAULT '[]'::jsonb,
  use_count integer NOT NULL DEFAULT 0,
  last_used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saved_routines ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (same pattern as saved_meals)
CREATE POLICY "Users can view own saved routines"
ON public.saved_routines
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved routines"
ON public.saved_routines
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved routines"
ON public.saved_routines
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved routines"
ON public.saved_routines
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_saved_routines_updated_at
BEFORE UPDATE ON public.saved_routines
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();