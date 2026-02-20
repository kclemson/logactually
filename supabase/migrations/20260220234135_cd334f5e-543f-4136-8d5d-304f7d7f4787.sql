
-- Add 'beta' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'beta';

-- Create toggle function for demo beta role
CREATE OR REPLACE FUNCTION public.toggle_demo_beta()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  demo_uid uuid;
  currently_beta boolean;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT p.id INTO demo_uid
  FROM profiles p JOIN auth.users u ON u.id = p.id
  WHERE u.email = 'demo@logactually.com'
  LIMIT 1;

  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = demo_uid AND role = 'beta'
  ) INTO currently_beta;

  IF currently_beta THEN
    DELETE FROM user_roles WHERE user_id = demo_uid AND role = 'beta';
  ELSE
    INSERT INTO user_roles (user_id, role) VALUES (demo_uid, 'beta');
  END IF;

  RETURN NOT currently_beta;
END;
$$;
