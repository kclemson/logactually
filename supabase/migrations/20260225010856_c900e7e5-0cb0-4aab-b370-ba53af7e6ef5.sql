CREATE OR REPLACE FUNCTION public.is_demo_beta()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  demo_uid uuid;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT p.id INTO demo_uid
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.email = 'demo@logactually.com'
  LIMIT 1;

  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = demo_uid AND role = 'beta'
  );
END;
$$;