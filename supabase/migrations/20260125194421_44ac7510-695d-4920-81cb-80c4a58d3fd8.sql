-- Create table for storing prompt test results
CREATE TABLE public.prompt_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  run_id UUID NOT NULL,
  prompt_version TEXT NOT NULL,
  test_input TEXT NOT NULL,
  additional_context TEXT,
  actual_output JSONB NOT NULL,
  is_hallucination BOOLEAN DEFAULT false,
  latency_ms INTEGER
);

-- Enable Row Level Security
ALTER TABLE public.prompt_tests ENABLE ROW LEVEL SECURITY;

-- Only admins can view prompt tests
CREATE POLICY "Admins can view prompt tests"
  ON public.prompt_tests
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Only admins can insert prompt tests
CREATE POLICY "Admins can insert prompt tests"
  ON public.prompt_tests
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Only admins can update prompt tests (for marking hallucinations)
CREATE POLICY "Admins can update prompt tests"
  ON public.prompt_tests
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

-- Only admins can delete prompt tests
CREATE POLICY "Admins can delete prompt tests"
  ON public.prompt_tests
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Index for efficient queries by run_id
CREATE INDEX idx_prompt_tests_run_id ON public.prompt_tests(run_id);

-- Index for filtering by prompt version
CREATE INDEX idx_prompt_tests_version ON public.prompt_tests(prompt_version);