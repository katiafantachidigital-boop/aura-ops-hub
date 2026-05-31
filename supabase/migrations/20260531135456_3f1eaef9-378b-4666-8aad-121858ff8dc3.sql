
-- ranking_history: restrict to authenticated only
DROP POLICY IF EXISTS "Everyone can read ranking history" ON public.ranking_history;
CREATE POLICY "Authenticated users can read ranking history"
  ON public.ranking_history FOR SELECT
  TO authenticated
  USING (true);

-- goals_race_history: restrict to authenticated only
DROP POLICY IF EXISTS "Everyone can read goals race history" ON public.goals_race_history;
CREATE POLICY "Authenticated users can read goals race history"
  ON public.goals_race_history FOR SELECT
  TO authenticated
  USING (true);

-- sales_goals_config: restrict to authenticated only
DROP POLICY IF EXISTS "Everyone can view active sales goals" ON public.sales_goals_config;
CREATE POLICY "Authenticated users can view active sales goals"
  ON public.sales_goals_config FOR SELECT
  TO authenticated
  USING (true);
