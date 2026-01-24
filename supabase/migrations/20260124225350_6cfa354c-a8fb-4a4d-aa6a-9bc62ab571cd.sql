CREATE OR REPLACE FUNCTION public.get_user_stats(exclude_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_agg(row_to_json(t) ORDER BY t.total_entries DESC)
  INTO result
  FROM (
    SELECT 
      p.id as user_id,
      COUNT(fe.id) as total_entries,
      COUNT(CASE WHEN fe.eaten_date = CURRENT_DATE THEN 1 END) as entries_today
    FROM profiles p
    LEFT JOIN food_entries fe ON p.id = fe.user_id
    WHERE p.id != exclude_user_id
    GROUP BY p.id
  ) t;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$;