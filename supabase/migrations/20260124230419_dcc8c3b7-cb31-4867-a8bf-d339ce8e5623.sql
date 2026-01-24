-- Update get_usage_stats to remove exclusion filters
CREATE OR REPLACE FUNCTION public.get_usage_stats(exclude_user_id uuid DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'users_with_entries', (SELECT COUNT(DISTINCT user_id) FROM food_entries),
    'total_entries', (SELECT COUNT(*) FROM food_entries),
    'active_last_7_days', (SELECT COUNT(DISTINCT user_id) FROM food_entries WHERE created_at > NOW() - INTERVAL '7 days'),
    'users_created_last_7_days', (SELECT COUNT(*) FROM profiles WHERE created_at > NOW() - INTERVAL '7 days'),
    'entries_created_last_7_days', (SELECT COUNT(*) FROM food_entries WHERE created_at > NOW() - INTERVAL '7 days'),
    'daily_stats', (
      SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.stat_date DESC), '[]'::json)
      FROM (
        SELECT 
          d.stat_date::text,
          COALESCE(e.entry_count, 0) as entry_count,
          (SELECT COUNT(*) FROM profiles WHERE created_at::date <= d.stat_date) as total_users,
          (SELECT COUNT(DISTINCT user_id) FROM food_entries WHERE eaten_date <= d.stat_date) as users_with_entries,
          COALESCE(p.users_created, 0) as users_created
        FROM (
          SELECT generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, '1 day')::date as stat_date
        ) d
        LEFT JOIN (
          SELECT eaten_date, COUNT(*) as entry_count
          FROM food_entries
          GROUP BY eaten_date
        ) e ON d.stat_date = e.eaten_date
        LEFT JOIN (
          SELECT created_at::date as created_date, COUNT(*) as users_created
          FROM profiles
          GROUP BY created_at::date
        ) p ON d.stat_date = p.created_date
      ) t
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- Update get_user_stats to remove exclusion filter
CREATE OR REPLACE FUNCTION public.get_user_stats(exclude_user_id uuid DEFAULT NULL)
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
    GROUP BY p.id
  ) t;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$;