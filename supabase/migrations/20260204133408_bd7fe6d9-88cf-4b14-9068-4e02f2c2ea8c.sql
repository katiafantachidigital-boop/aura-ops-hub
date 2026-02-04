-- Add unique constraints for upsert operations
ALTER TABLE public.ranking_history
ADD CONSTRAINT ranking_history_user_period_unique UNIQUE (user_id, period_month);

ALTER TABLE public.goals_race_history
ADD CONSTRAINT goals_race_history_period_unique UNIQUE (period_month);