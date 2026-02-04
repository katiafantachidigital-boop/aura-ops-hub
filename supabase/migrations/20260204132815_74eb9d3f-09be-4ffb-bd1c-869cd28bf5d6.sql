-- Add payment method columns to cash_register table
ALTER TABLE public.cash_register
ADD COLUMN IF NOT EXISTS payment_pix numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_credit numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_debit numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_boleto numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_cash numeric DEFAULT 0;

-- Create table to archive monthly ranking snapshots
CREATE TABLE IF NOT EXISTS public.ranking_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  period_month DATE NOT NULL,
  checklists_sent INTEGER DEFAULT 0,
  perfect_checklists INTEGER DEFAULT 0,
  trainings_completed INTEGER DEFAULT 0,
  sales_registered INTEGER DEFAULT 0,
  delays INTEGER DEFAULT 0,
  critical_errors INTEGER DEFAULT 0,
  total_points INTEGER DEFAULT 0,
  rank_position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table to archive monthly goals race snapshots
CREATE TABLE IF NOT EXISTS public.goals_race_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_month DATE NOT NULL,
  final_position INTEGER NOT NULL DEFAULT 0,
  goal_target INTEGER NOT NULL DEFAULT 0,
  total_advances INTEGER DEFAULT 0,
  total_retreats INTEGER DEFAULT 0,
  perfect_checklists INTEGER DEFAULT 0,
  regular_checklists INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ranking_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals_race_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for ranking_history (everyone can read)
CREATE POLICY "Everyone can read ranking history"
ON public.ranking_history
FOR SELECT
USING (true);

CREATE POLICY "Only managers can insert ranking history"
ON public.ranking_history
FOR INSERT
WITH CHECK (public.is_manager(auth.uid()));

-- RLS policies for goals_race_history (everyone can read)
CREATE POLICY "Everyone can read goals race history"
ON public.goals_race_history
FOR SELECT
USING (true);

CREATE POLICY "Only managers can insert goals race history"
ON public.goals_race_history
FOR INSERT
WITH CHECK (public.is_manager(auth.uid()));