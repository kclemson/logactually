-- Create feedback table for user submissions
create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.feedback enable row level security;

-- Users can insert their own feedback
create policy "Users can insert own feedback"
  on public.feedback for insert
  with check (auth.uid() = user_id);

-- Admins can view all feedback
create policy "Admins can view all feedback"
  on public.feedback for select
  using (has_role(auth.uid(), 'admin'));