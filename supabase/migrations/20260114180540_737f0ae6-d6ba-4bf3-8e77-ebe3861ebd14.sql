-- Allow multiple supervisors per week by removing incorrect unique constraint
ALTER TABLE public.weekly_supervisors
DROP CONSTRAINT IF EXISTS weekly_supervisors_week_start_key;

-- Prevent duplicate assignment of the same user in the same week
ALTER TABLE public.weekly_supervisors
ADD CONSTRAINT weekly_supervisors_user_id_week_start_key UNIQUE (user_id, week_start);

-- Helpful index for the "active today" lookup (week_start <= today <= week_end)
CREATE INDEX IF NOT EXISTS idx_weekly_supervisors_period
ON public.weekly_supervisors (week_start, week_end);