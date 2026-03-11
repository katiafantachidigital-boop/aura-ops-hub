
-- Add title and signature columns to occurrences
ALTER TABLE public.occurrences ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.occurrences ADD COLUMN IF NOT EXISTS signature text;

-- Drop the old SELECT policy
DROP POLICY IF EXISTS "Users can view accessible occurrences" ON public.occurrences;

-- New SELECT policy: managers see everything, non-managers see only:
-- 1. Their own messages
-- 2. Public messages from managers
-- 3. Exclusive messages targeted at them from managers
CREATE POLICY "Users can view accessible occurrences" ON public.occurrences
FOR SELECT USING (
  is_manager(auth.uid())
  OR (auth.uid() = user_id)
  OR (
    is_manager(user_id) AND (
      visibility = 'public'
      OR (visibility = 'exclusive' AND auth.uid()::text = ANY(target_profiles))
    )
  )
);
