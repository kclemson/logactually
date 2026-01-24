CREATE OR REPLACE FUNCTION get_usage_stats(exclude_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(DISTINCT user_id) FROM food_entries WHERE user_id != exclude_user_id),
    'total_entries', (SELECT COUNT(*) FROM food_entries WHERE user_id != exclude_user_id),
    'active_last_7_days', (SELECT COUNT(DISTINCT user_id) FROM food_entries WHERE user_id != exclude_user_id AND created_at > NOW() - INTERVAL '7 days'),
    'entries_by_date', (
      SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
      FROM (
        SELECT eaten_date::text, COUNT(*) as count
        FROM food_entries
        WHERE user_id != exclude_user_id
        GROUP BY eaten_date
        ORDER BY eaten_date DESC
        LIMIT 14
      ) t
    )
  ) INTO result;
  RETURN result;
END;
$$;