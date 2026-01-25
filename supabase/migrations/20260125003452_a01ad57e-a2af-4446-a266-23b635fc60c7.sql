-- Update get_usage_stats to accept timezone parameter
CREATE OR REPLACE FUNCTION public.get_usage_stats(
  user_timezone text DEFAULT 'America/Los_Angeles'
)
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
  -- Get current time in user's timezone
  local_now := NOW() AT TIME ZONE user_timezone;
  local_today := local_now::date;
  
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'users_with_entries', (SELECT COUNT(DISTINCT user_id) FROM food_entries),
    'total_entries', (SELECT COUNT(*) FROM food_entries),
    'active_last_7_days', (
      SELECT COUNT(DISTINCT user_id) 
      FROM food_entries 
      WHERE (created_at AT TIME ZONE user_timezone)::date > local_today - 7
    ),
    'users_created_last_7_days', (
      SELECT COUNT(*) 
      FROM profiles 
      WHERE (created_at AT TIME ZONE user_timezone)::date > local_today - 7
    ),
    'entries_created_last_7_days', (
      SELECT COUNT(*) 
      FROM food_entries 
      WHERE (created_at AT TIME ZONE user_timezone)::date > local_today - 7
    ),
    'daily_stats', (
      SELECT COALESCE(json_agg(row_to_json(t) ORDER BY t.stat_date DESC), '[]'::json)
      FROM (
        SELECT 
          d.stat_date::text,
          COALESCE(e.entry_count, 0) as entry_count,
          (SELECT COUNT(*) FROM profiles 
           WHERE (created_at AT TIME ZONE user_timezone)::date <= d.stat_date) as total_users,
          (SELECT COUNT(DISTINCT user_id) FROM food_entries 
           WHERE eaten_date <= d.stat_date) as users_with_entries,
          COALESCE(p.users_created, 0) as users_created
        FROM (
          SELECT generate_series(
            local_today - INTERVAL '13 days', 
            local_today, 
            '1 day'
          )::date as stat_date
        ) d
        LEFT JOIN (
          SELECT eaten_date, COUNT(*) as entry_count
          FROM food_entries
          GROUP BY eaten_date
        ) e ON d.stat_date = e.eaten_date
        LEFT JOIN (
          SELECT (created_at AT TIME ZONE user_timezone)::date as created_date, 
                 COUNT(*) as users_created
          FROM profiles
          GROUP BY (created_at AT TIME ZONE user_timezone)::date
        ) p ON d.stat_date = p.created_date
      ) t
    )
  ) INTO result;
  RETURN result;
END;
$function$;

-- Update get_user_stats to accept timezone parameter
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
  -- Get today's date in user's timezone
  local_today := (NOW() AT TIME ZONE user_timezone)::date;
  
  SELECT json_agg(row_to_json(t) ORDER BY t.total_entries DESC)
  INTO result
  FROM (
    SELECT 
      p.id as user_id,
      COUNT(fe.id) as total_entries,
      COUNT(CASE WHEN fe.eaten_date = local_today THEN 1 END) as entries_today
    FROM profiles p
    LEFT JOIN food_entries fe ON p.id = fe.user_id
    GROUP BY p.id
  ) t;
  
  RETURN COALESCE(result, '[]'::json);
END;
$function$;