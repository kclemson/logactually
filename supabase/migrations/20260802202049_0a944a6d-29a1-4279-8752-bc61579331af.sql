CREATE OR REPLACE FUNCTION public.get_demo_read_only()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result boolean;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT p.is_read_only INTO result
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.email = 'demo@logactually.com'
  LIMIT 1;

  RETURN COALESCE(result, false);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_demo_user_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result uuid;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT p.id INTO result
  FROM profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.email = 'demo@logactually.com'
  LIMIT 1;

  RETURN result;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_demo_read_only() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_demo_user_id() TO authenticated;