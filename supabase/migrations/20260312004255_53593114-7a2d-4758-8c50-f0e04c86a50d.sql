
-- Drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Only managers can insert replies" ON public.occurrence_replies;
DROP POLICY IF EXISTS "Users can view replies" ON public.occurrence_replies;
DROP POLICY IF EXISTS "Managers can delete replies" ON public.occurrence_replies;

-- Recreate as permissive (default)
CREATE POLICY "Only managers can insert replies"
ON public.occurrence_replies
FOR INSERT
TO authenticated
WITH CHECK (is_manager(auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Users can view replies"
ON public.occurrence_replies
FOR SELECT
TO authenticated
USING (
  is_manager(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.occurrences o
    WHERE o.id = occurrence_id AND o.user_id = auth.uid()
  )
);

CREATE POLICY "Managers can delete replies"
ON public.occurrence_replies
FOR DELETE
TO authenticated
USING (is_manager(auth.uid()));
