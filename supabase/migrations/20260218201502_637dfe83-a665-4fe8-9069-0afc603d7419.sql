CREATE OR REPLACE FUNCTION public.toggle_demo_read_only()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_val boolean;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  UPDATE profiles
  SET is_read_only = NOT is_read_only
  WHERE id = (
    SELECT p.id FROM profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE u.email = 'demo@logactually.com'
    LIMIT 1
  )
  RETURNING is_read_only INTO new_val;

  RETURN new_val;
END;
$$;