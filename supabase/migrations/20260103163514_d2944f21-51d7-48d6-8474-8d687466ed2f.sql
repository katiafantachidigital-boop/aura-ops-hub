-- Drop the restrictive ALL policy and create specific ones for managers
DROP POLICY IF EXISTS "Gestoras can manage weekly supervisors" ON public.weekly_supervisors;

-- Create INSERT policy for managers
CREATE POLICY "Managers can insert weekly supervisors" 
ON public.weekly_supervisors 
FOR INSERT 
WITH CHECK (is_manager(auth.uid()));

-- Create UPDATE policy for managers  
CREATE POLICY "Managers can update weekly supervisors" 
ON public.weekly_supervisors 
FOR UPDATE 
USING (is_manager(auth.uid()))
WITH CHECK (is_manager(auth.uid()));

-- Create DELETE policy for managers
CREATE POLICY "Managers can delete weekly supervisors" 
ON public.weekly_supervisors 
FOR DELETE 
USING (is_manager(auth.uid()));