-- Allow admins to view all profiles (needed for feedback user lookup)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));