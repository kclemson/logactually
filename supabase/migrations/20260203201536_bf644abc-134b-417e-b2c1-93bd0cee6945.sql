-- Create login_events table to track all logins
CREATE TABLE public.login_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX idx_login_events_created_at ON public.login_events(created_at DESC);
CREATE INDEX idx_login_events_user_id ON public.login_events(user_id);

-- RLS: Admin-only access
ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all login events"
  ON public.login_events FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Update increment_login_count to also insert login event
CREATE OR REPLACE FUNCTION public.increment_login_count(user_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  UPDATE profiles 
  SET login_count = login_count + 1
  WHERE id = user_id;
  
  INSERT INTO login_events (user_id)
  VALUES (user_id);
$$;

-- Create parameterized get_login_count function
CREATE OR REPLACE FUNCTION public.get_login_count(
  user_filter TEXT DEFAULT 'all',
  timeframe_hours INT DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result INT;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT COUNT(*)::INT INTO result
  FROM login_events le
  JOIN profiles p ON le.user_id = p.id
  WHERE 
    CASE 
      WHEN user_filter = 'demo' THEN p.is_read_only = true
      WHEN user_filter = 'all' THEN true
      ELSE le.user_id = user_filter::uuid
    END
    AND (timeframe_hours IS NULL OR le.created_at > NOW() - (timeframe_hours || ' hours')::interval);

  RETURN result;
END;
$$;