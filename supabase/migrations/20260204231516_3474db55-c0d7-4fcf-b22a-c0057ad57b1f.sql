-- Add clinic column to profiles table
ALTER TABLE public.profiles
ADD COLUMN clinic text CHECK (clinic IN ('capao_raso', 'batel')) DEFAULT NULL;

-- Add clinic column to cash_register table (required for filtering)
ALTER TABLE public.cash_register
ADD COLUMN clinic text CHECK (clinic IN ('capao_raso', 'batel')) DEFAULT NULL;

-- Add clinic column to user_scores for ranking isolation
ALTER TABLE public.user_scores
ADD COLUMN clinic text CHECK (clinic IN ('capao_raso', 'batel')) DEFAULT NULL;

-- Add clinic column to sales_events for sales isolation
ALTER TABLE public.sales_events
ADD COLUMN clinic text CHECK (clinic IN ('capao_raso', 'batel')) DEFAULT NULL;

-- Add clinic column to goals_race_config for team goals isolation
ALTER TABLE public.goals_race_config
ADD COLUMN clinic text CHECK (clinic IN ('capao_raso', 'batel')) DEFAULT NULL;

-- Add clinic column to goals_race_events
ALTER TABLE public.goals_race_events
ADD COLUMN clinic text CHECK (clinic IN ('capao_raso', 'batel')) DEFAULT NULL;

-- Add clinic column to ranking_history for historical data isolation
ALTER TABLE public.ranking_history
ADD COLUMN clinic text CHECK (clinic IN ('capao_raso', 'batel')) DEFAULT NULL;

-- Add clinic column to sales_goals_config
ALTER TABLE public.sales_goals_config
ADD COLUMN clinic text CHECK (clinic IN ('capao_raso', 'batel')) DEFAULT NULL;

-- Create index for faster filtering
CREATE INDEX idx_profiles_clinic ON public.profiles(clinic);
CREATE INDEX idx_cash_register_clinic ON public.cash_register(clinic);
CREATE INDEX idx_user_scores_clinic ON public.user_scores(clinic);
CREATE INDEX idx_sales_events_clinic ON public.sales_events(clinic);