-- Create weight_sets table for normalized weight training data
CREATE TABLE public.weight_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entry_id UUID NOT NULL,
  logged_date DATE NOT NULL DEFAULT CURRENT_DATE,
  exercise_key TEXT NOT NULL,
  description TEXT NOT NULL,
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight_lbs NUMERIC NOT NULL,
  raw_input TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.weight_sets ENABLE ROW LEVEL SECURITY;

-- RLS policies for user access
CREATE POLICY "Users can view own weight sets" 
ON public.weight_sets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weight sets" 
ON public.weight_sets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weight sets" 
ON public.weight_sets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own weight sets" 
ON public.weight_sets 
FOR DELETE 
USING (auth.uid() = user_id);

-- Indexes for efficient queries
CREATE INDEX idx_weight_sets_user_date ON public.weight_sets(user_id, logged_date);
CREATE INDEX idx_weight_sets_exercise ON public.weight_sets(user_id, exercise_key);

-- Trigger for automatic timestamp updates
CREATE TRIGGER update_weight_sets_updated_at
BEFORE UPDATE ON public.weight_sets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();