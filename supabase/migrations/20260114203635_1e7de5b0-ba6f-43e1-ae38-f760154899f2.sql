-- Drop existing insert policy that only allows managers
DROP POLICY IF EXISTS "Gestoras can insert sales events" ON public.sales_events;

-- Create new policy that allows any authenticated user to insert sales
CREATE POLICY "Authenticated users can insert sales events"
ON public.sales_events
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);