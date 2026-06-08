
-- Monthly goals per clinic
CREATE TABLE public.monthly_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic TEXT NOT NULL CHECK (clinic IN ('capao_raso','batel')),
  period DATE NOT NULL, -- first day of month
  total_goal NUMERIC NOT NULL DEFAULT 0,
  saturday_pct INTEGER NOT NULL DEFAULT 20 CHECK (saturday_pct BETWEEN 0 AND 100),
  morning_pct INTEGER NOT NULL DEFAULT 55 CHECK (morning_pct BETWEEN 0 AND 100),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (clinic, period)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.monthly_goals TO authenticated;
GRANT ALL ON public.monthly_goals TO service_role;
ALTER TABLE public.monthly_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gestoras e supervisoras visualizam metas"
  ON public.monthly_goals FOR SELECT TO authenticated
  USING (public.is_manager_or_supervisor(auth.uid()));

CREATE POLICY "Gestoras gerenciam metas - insert"
  ON public.monthly_goals FOR INSERT TO authenticated
  WITH CHECK (public.is_manager(auth.uid()));

CREATE POLICY "Gestoras gerenciam metas - update"
  ON public.monthly_goals FOR UPDATE TO authenticated
  USING (public.is_manager(auth.uid()))
  WITH CHECK (public.is_manager(auth.uid()));

CREATE POLICY "Gestoras gerenciam metas - delete"
  ON public.monthly_goals FOR DELETE TO authenticated
  USING (public.is_manager(auth.uid()));

CREATE TRIGGER trg_monthly_goals_updated
BEFORE UPDATE ON public.monthly_goals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Manual overrides for daily actuals per shift
CREATE TABLE public.daily_goal_overrides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic TEXT NOT NULL CHECK (clinic IN ('capao_raso','batel')),
  goal_date DATE NOT NULL,
  morning_actual NUMERIC,
  night_actual NUMERIC,
  notes TEXT,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (clinic, goal_date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_goal_overrides TO authenticated;
GRANT ALL ON public.daily_goal_overrides TO service_role;
ALTER TABLE public.daily_goal_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gestoras e supervisoras visualizam overrides"
  ON public.daily_goal_overrides FOR SELECT TO authenticated
  USING (public.is_manager_or_supervisor(auth.uid()));

CREATE POLICY "Gestoras gerenciam overrides - insert"
  ON public.daily_goal_overrides FOR INSERT TO authenticated
  WITH CHECK (public.is_manager(auth.uid()));

CREATE POLICY "Gestoras gerenciam overrides - update"
  ON public.daily_goal_overrides FOR UPDATE TO authenticated
  USING (public.is_manager(auth.uid()))
  WITH CHECK (public.is_manager(auth.uid()));

CREATE POLICY "Gestoras gerenciam overrides - delete"
  ON public.daily_goal_overrides FOR DELETE TO authenticated
  USING (public.is_manager(auth.uid()));

CREATE TRIGGER trg_daily_goal_overrides_updated
BEFORE UPDATE ON public.daily_goal_overrides
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
