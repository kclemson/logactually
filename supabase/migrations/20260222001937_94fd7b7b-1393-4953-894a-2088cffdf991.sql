
CREATE OR REPLACE FUNCTION public.get_user_stats(user_timezone text DEFAULT 'America/Los_Angeles'::text, include_read_only boolean DEFAULT false)
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
      p.is_read_only,
      (SELECT COUNT(*) FROM login_events le WHERE le.user_id = p.id) as login_count,
      (SELECT COUNT(*) FROM login_events le WHERE le.user_id = p.id 
       AND le.created_at > NOW() - INTERVAL '24 hours') as logins_today,
      (SELECT COUNT(*) FROM food_entries fe WHERE fe.user_id = p.id) as total_entries,
      (SELECT COUNT(*) FROM food_entries fe WHERE fe.user_id = p.id 
       AND fe.eaten_date = local_today) as entries_today,
      (SELECT COUNT(*) FROM weight_sets ws WHERE ws.user_id = p.id) as total_weight_entries,
      (SELECT COUNT(*) FROM weight_sets ws WHERE ws.user_id = p.id 
       AND ws.logged_date = local_today) as weight_today,
      (SELECT COUNT(*) FROM saved_meals sm WHERE sm.user_id = p.id) as saved_meals_count,
      (SELECT COUNT(*) FROM saved_routines sr WHERE sr.user_id = p.id) as saved_routines_count,
      (SELECT COALESCE((p.settings->>'showCustomLogs')::boolean, false)) as custom_logs_enabled,
      (SELECT COUNT(*) FROM custom_log_entries cle WHERE cle.user_id = p.id) as custom_log_entries_count,
      (SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_id = p.id AND role = 'beta')) as is_beta,
      (SELECT GREATEST(MAX(combined.created_at), NULL)
       FROM (SELECT created_at FROM food_entries WHERE user_id = p.id
             UNION ALL SELECT created_at FROM weight_sets WHERE user_id = p.id) combined) as last_active,
      (SELECT json_agg(sm2.name ORDER BY sm2.last_used_at DESC NULLS LAST)
       FROM saved_meals sm2 WHERE sm2.user_id = p.id) as saved_meal_names,
      (SELECT json_agg(sr2.name ORDER BY sr2.last_used_at DESC NULLS LAST)
       FROM saved_routines sr2 WHERE sr2.user_id = p.id) as saved_routine_names,
      (SELECT json_agg(json_build_object(
         'raw_input', fe2.raw_input,
         'saved_meal_name', sm2.name,
         'items', (SELECT json_agg(item->>'description')
                   FROM jsonb_array_elements(fe2.food_items) item)))
       FROM food_entries fe2
       LEFT JOIN saved_meals sm2 ON fe2.source_meal_id = sm2.id
       WHERE fe2.user_id = p.id AND fe2.eaten_date = local_today) as food_today_details,
      (SELECT json_agg(json_build_object(
         'raw_input', ws2.raw_input,
         'saved_routine_name', sr2.name,
         'description', ws2.description))
       FROM weight_sets ws2
       LEFT JOIN saved_routines sr2 ON ws2.source_routine_id = sr2.id
       WHERE ws2.user_id = p.id AND ws2.logged_date = local_today) as weight_today_details
    FROM profiles p
    WHERE include_read_only OR NOT COALESCE(p.is_read_only, false)
  ) t;
  
  RETURN COALESCE(result, '[]'::json);
END;
$function$;
