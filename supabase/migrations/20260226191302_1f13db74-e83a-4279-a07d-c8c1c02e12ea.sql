CREATE OR REPLACE FUNCTION public.increment_login_count(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL OR auth.uid() != user_id THEN
    RAISE EXCEPTION 'Can only increment your own login count';
  END IF;

  INSERT INTO login_events (user_id)
  VALUES (user_id);
END;
$$;