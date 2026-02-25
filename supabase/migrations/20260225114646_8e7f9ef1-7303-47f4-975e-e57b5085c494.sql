
-- Add is_public column to spreadsheets
ALTER TABLE public.spreadsheets ADD COLUMN is_public boolean NOT NULL DEFAULT false;

-- Drop the old UPDATE policy
DROP POLICY IF EXISTS "Creator or manager can update spreadsheets" ON public.spreadsheets;

-- New UPDATE policy: creator/manager can always update, everyone can update if public
CREATE POLICY "Users can update spreadsheets"
ON public.spreadsheets
FOR UPDATE
USING (
  (auth.uid() = created_by) OR is_manager(auth.uid()) OR (is_public = true AND auth.uid() IS NOT NULL)
);
