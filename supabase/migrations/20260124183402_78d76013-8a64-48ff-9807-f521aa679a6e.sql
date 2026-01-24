CREATE OR REPLACE FUNCTION public.get_usage_stats(exclude_user_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(DISTINCT user_id) FROM food_entries WHERE user_id != exclude_user_id),
    'total_entries', (SELECT COUNT(*) FROM food_entries WHERE user_id != exclude_user_id),
    'active_last_7_days', (SELECT COUNT(DISTINCT user_id) FROM food_entries WHERE user_id != exclude_user_id AND created_at > NOW() - INTERVAL '7 days'),
    'users_created_last_7_days', (SELECT COUNT(*) FROM profiles WHERE id != exclude_user_id AND created_at > NOW() - INTERVAL '7 days'),
    'entries_created_last_7_days', (SELECT COUNT(*) FROM food_entries WHERE user_id != exclude_user_id AND created_at > NOW() - INTERVAL '7 days'),
    'daily_stats', (
      SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.stat_date DESC), '[]'::json)
      FROM (
        SELECT 
          d.stat_date::text,
          COALESCE(e.entry_count, 0) as entry_count,
          (SELECT COUNT(*) FROM profiles WHERE created_at::date <= d.stat_date AND id != exclude_user_id) as total_users,
          COALESCE(p.users_created, 0) as users_created
        FROM (
          SELECT generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, '1 day')::date as stat_date
        ) d
        LEFT JOIN (
          SELECT eaten_date, COUNT(*) as entry_count
          FROM food_entries
          WHERE user_id != exclude_user_id
          GROUP BY eaten_date
        ) e ON d.stat_date = e.eaten_date
        LEFT JOIN (
          SELECT created_at::date as created_date, COUNT(*) as users_created
          FROM profiles
          WHERE id != exclude_user_id
          GROUP BY created_at::date
        ) p ON d.stat_date = p.created_date
      ) t
    )
  ) INTO result;
  RETURN result;
END;
$$