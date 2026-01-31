-- Add response columns to feedback table
ALTER TABLE feedback ADD COLUMN response text DEFAULT NULL;
ALTER TABLE feedback ADD COLUMN responded_at timestamptz DEFAULT NULL;
ALTER TABLE feedback ADD COLUMN read_at timestamptz DEFAULT NULL;

-- RLS policy for admins to update feedback (to add responses)
CREATE POLICY "Admins can update feedback" ON feedback
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policy for users to update their own feedback (to mark as read)
CREATE POLICY "Users can update own feedback" ON feedback
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policy for users to delete their own feedback
CREATE POLICY "Users can delete own feedback" ON feedback
  FOR DELETE USING (auth.uid() = user_id AND NOT is_read_only_user(auth.uid()));