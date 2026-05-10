-- Restrict sales_events SELECT to authenticated users
DROP POLICY IF EXISTS "Everyone can view sales events" ON public.sales_events;
CREATE POLICY "Authenticated users can view sales events"
ON public.sales_events FOR SELECT
TO authenticated
USING (true);

-- Restrict user_scores: users see own, managers see all
DROP POLICY IF EXISTS "Everyone can view scores" ON public.user_scores;
CREATE POLICY "Users view own scores, managers view all"
ON public.user_scores FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_manager(auth.uid()));

-- Restrict training tables to authenticated users
DROP POLICY IF EXISTS "Everyone can view trainings" ON public.trainings;
CREATE POLICY "Authenticated users can view trainings"
ON public.trainings FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Everyone can view training modules" ON public.training_modules;
CREATE POLICY "Authenticated users can view training modules"
ON public.training_modules FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Everyone can view training contents" ON public.training_contents;
CREATE POLICY "Authenticated users can view training contents"
ON public.training_contents FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Everyone can view training questions" ON public.training_questions;
CREATE POLICY "Authenticated users can view training questions"
ON public.training_questions FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Everyone can view question options" ON public.training_question_options;
CREATE POLICY "Authenticated users can view question options"
ON public.training_question_options FOR SELECT
TO authenticated
USING (true);