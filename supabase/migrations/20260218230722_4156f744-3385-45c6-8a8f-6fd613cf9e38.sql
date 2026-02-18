CREATE POLICY "Users can update own saved charts"
ON public.saved_charts FOR UPDATE
USING (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));