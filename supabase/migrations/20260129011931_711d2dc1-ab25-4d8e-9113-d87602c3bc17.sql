CREATE OR REPLACE FUNCTION public.get_user_stats(user_timezone text DEFAULT 'America/Los_Angeles'::text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result json;
  local_today date;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  local_today := (NOW() AT TIME ZONE user_timezone)::date;
  
  SELECT json_agg(row_to_json(t) ORDER BY t.user_number ASC)
  INTO result
  FROM (
    SELECT 
      p.id as user_id,
      p.user_number,
      COUNT(DISTINCT fe.id) as total_entries,
      COUNT(DISTINCT CASE WHEN fe.eaten_date = local_today THEN fe.id END) as entries_today,
      COUNT(DISTINCT ws.id) as total_weight_entries,
      COUNT(DISTINCT CASE WHEN ws.logged_date = local_today THEN ws.id END) as weight_today,
      COUNT(DISTINCT sm.id) as saved_meals_count,
      COUNT(DISTINCT sr.id) as saved_routines_count,
      GREATEST(MAX(fe.created_at), MAX(ws.created_at)) as last_active
    FROM profiles p
    LEFT JOIN food_entries fe ON p.id = fe.user_id
    LEFT JOIN weight_sets ws ON p.id = ws.user_id
    LEFT JOIN saved_meals sm ON p.id = sm.user_id
    LEFT JOIN saved_routines sr ON p.id = sr.user_id
    GROUP BY p.id, p.user_number
  ) t;
  
  RETURN COALESCE(result, '[]'::json);
END;
$function$