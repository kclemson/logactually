CREATE OR REPLACE FUNCTION public.get_user_stats(
  user_timezone text DEFAULT 'America/Los_Angeles'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result json;
  local_today date;
BEGIN
  local_today := (NOW() AT TIME ZONE user_timezone)::date;
  
  SELECT json_agg(row_to_json(t) ORDER BY t.user_number ASC)
  INTO result
  FROM (
    SELECT 
      p.id as user_id,
      p.user_number,
      COUNT(fe.id) as total_entries,
      COUNT(CASE WHEN fe.eaten_date = local_today THEN 1 END) as entries_today
    FROM profiles p
    LEFT JOIN food_entries fe ON p.id = fe.user_id
    GROUP BY p.id, p.user_number
  ) t;
  
  RETURN COALESCE(result, '[]'::json);
END;
$function$;