export interface FeedbackWithUser {
  id: string;
  feedback_id: number;
  message: string;
  created_at: string;
  user_number: number;
  response: string | null;
  responded_at: string | null;
  resolved_at: string | null;
  resolved_reason: string | null;
  image_url: string | null;
}

export interface UserFeedback {
  id: string;
  feedback_id: number;
  message: string;
  created_at: string;
  response: string | null;
  responded_at: string | null;
  read_at: string | null;
  resolved_at: string | null;
  resolved_reason: string | null;
  image_url: string | null;
}
