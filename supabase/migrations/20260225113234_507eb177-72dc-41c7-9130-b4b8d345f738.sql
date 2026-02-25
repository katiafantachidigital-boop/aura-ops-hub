
-- Drop existing SELECT policy on occurrences
DROP POLICY IF EXISTS "Users can view accessible occurrences" ON public.occurrences;

-- New policy: managers see all, other users see only their own
CREATE POLICY "Users can view accessible occurrences"
ON public.occurrences
FOR SELECT
USING (
  is_manager(auth.uid())
  OR (auth.uid() = user_id)
);
