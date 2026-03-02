CREATE OR REPLACE FUNCTION public.get_user_activity_dates(target_user_id uuid)
RETURNS TABLE(activity_date date)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  RETURN QUERY
    SELECT DISTINCT d FROM (
      SELECT eaten_date AS d FROM food_entries WHERE user_id = target_user_id
      UNION
      SELECT logged_date AS d FROM weight_sets WHERE user_id = target_user_id
    ) combined
    WHERE d >= CURRENT_DATE - INTERVAL '90 days'
    ORDER BY d DESC;
END;
$$;