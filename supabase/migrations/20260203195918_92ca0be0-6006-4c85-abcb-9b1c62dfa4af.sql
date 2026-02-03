CREATE OR REPLACE FUNCTION public.get_usage_stats(user_timezone text DEFAULT 'America/Los_Angeles'::text, include_read_only boolean DEFAULT false)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result json;
  local_now timestamp;
  local_today date;
BEGIN
  IF NOT has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  local_now := NOW() AT TIME ZONE user_timezone;
  local_today := local_now::date;
  
  SELECT json_build_object(
    'total_users', (
      SELECT COUNT(*) FROM profiles 
      WHERE include_read_only OR NOT COALESCE(is_read_only, false)
    ),
    'read_only_users', (SELECT COUNT(*) FROM profiles WHERE is_read_only = true),
    'demo_logins', (
      SELECT COALESCE(login_count, 0) 
      FROM profiles 
      WHERE is_read_only = true 
      LIMIT 1
    ),
    'users_with_entries', (
      SELECT COUNT(DISTINCT fe.user_id) FROM food_entries fe
      JOIN profiles p ON fe.user_id = p.id
      WHERE include_read_only OR NOT COALESCE(p.is_read_only, false)
    ),
    'total_entries', (
      SELECT COUNT(*) FROM food_entries fe
      JOIN profiles p ON fe.user_id = p.id
      WHERE include_read_only OR NOT COALESCE(p.is_read_only, false)
    ),
    'active_last_7_days', (
      SELECT COUNT(DISTINCT fe.user_id) 
      FROM food_entries fe
      JOIN profiles p ON fe.user_id = p.id
      WHERE (fe.created_at AT TIME ZONE user_timezone)::date > local_today - 7
        AND (include_read_only OR NOT COALESCE(p.is_read_only, false))
    ),
    'users_created_last_7_days', (
      SELECT COUNT(*) FROM profiles 
      WHERE (created_at AT TIME ZONE user_timezone)::date > local_today - 7
        AND (include_read_only OR NOT COALESCE(is_read_only, false))
    ),
    'entries_created_last_7_days', (
      SELECT COUNT(*) FROM food_entries fe
      JOIN profiles p ON fe.user_id = p.id
      WHERE (fe.created_at AT TIME ZONE user_timezone)::date > local_today - 7
        AND (include_read_only OR NOT COALESCE(p.is_read_only, false))
    ),
    'total_saved_meals', (
      SELECT COUNT(*) FROM saved_meals sm
      JOIN profiles p ON sm.user_id = p.id
      WHERE include_read_only OR NOT COALESCE(p.is_read_only, false)
    ),
    'total_saved_routines', (
      SELECT COUNT(*) FROM saved_routines sr
      JOIN profiles p ON sr.user_id = p.id
      WHERE include_read_only OR NOT COALESCE(p.is_read_only, false)
    ),
    'users_with_saved_meals', (
      SELECT COUNT(DISTINCT sm.user_id) FROM saved_meals sm
      JOIN profiles p ON sm.user_id = p.id
      WHERE include_read_only OR NOT COALESCE(p.is_read_only, false)
    ),
    'avg_saved_meals_per_user', (
      SELECT COALESCE(
        ROUND(COUNT(*)::numeric / NULLIF(COUNT(DISTINCT sm.user_id), 0), 1),
        0
      ) FROM saved_meals sm
      JOIN profiles p ON sm.user_id = p.id
      WHERE include_read_only OR NOT COALESCE(p.is_read_only, false)
    ),
    'saved_meals_used_last_7_days', (
      SELECT COUNT(*) FROM saved_meals sm
      JOIN profiles p ON sm.user_id = p.id
      WHERE sm.last_used_at IS NOT NULL 
        AND (sm.last_used_at AT TIME ZONE user_timezone)::date > local_today - 7
        AND (include_read_only OR NOT COALESCE(p.is_read_only, false))
    ),
    'daily_stats', (
      SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.stat_date DESC), '[]'::json)
      FROM (
        SELECT 
          d.stat_date::text,
          COALESCE(e.entry_count, 0) as entry_count,
          COALESCE(w.weight_count, 0) as weight_count,
          (SELECT COUNT(*) FROM profiles 
           WHERE (created_at AT TIME ZONE user_timezone)::date <= d.stat_date
             AND (include_read_only OR NOT COALESCE(is_read_only, false))) as total_users,
          (SELECT COUNT(DISTINCT user_id) FROM (
            SELECT fe.user_id FROM food_entries fe
            JOIN profiles p ON fe.user_id = p.id
            WHERE fe.eaten_date = d.stat_date
              AND (include_read_only OR NOT COALESCE(p.is_read_only, false))
            UNION
            SELECT ws.user_id FROM weight_sets ws
            JOIN profiles p ON ws.user_id = p.id
            WHERE ws.logged_date = d.stat_date
              AND (include_read_only OR NOT COALESCE(p.is_read_only, false))
          ) active_users) as users_with_entries,
          COALESCE(p.users_created, 0) as users_created
        FROM (
          SELECT generate_series(
            local_today - INTERVAL '13 days', 
            local_today, 
            '1 day'
          )::date as stat_date
        ) d
        LEFT JOIN (
          SELECT fe.eaten_date, COUNT(*) as entry_count
          FROM food_entries fe
          JOIN profiles p ON fe.user_id = p.id
          WHERE include_read_only OR NOT COALESCE(p.is_read_only, false)
          GROUP BY fe.eaten_date
        ) e ON d.stat_date = e.eaten_date
        LEFT JOIN (
          SELECT ws.logged_date, COUNT(*) as weight_count
          FROM weight_sets ws
          JOIN profiles p ON ws.user_id = p.id
          WHERE include_read_only OR NOT COALESCE(p.is_read_only, false)
          GROUP BY ws.logged_date
        ) w ON d.stat_date = w.logged_date
        LEFT JOIN (
          SELECT (created_at AT TIME ZONE user_timezone)::date as created_date, 
                 COUNT(*) as users_created
          FROM profiles
          WHERE include_read_only OR NOT COALESCE(is_read_only, false)
          GROUP BY (created_at AT TIME ZONE user_timezone)::date
        ) p ON d.stat_date = p.created_date
      ) t
    )
  ) INTO result;
  RETURN result;
END;
$function$;