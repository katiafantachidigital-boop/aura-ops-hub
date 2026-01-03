-- Add policy for managers to view all profiles (needed for supervisor management)
CREATE POLICY "Managers can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_manager(auth.uid()));

-- Add policy for managers to update any profile's is_supervisor field
CREATE POLICY "Managers can update supervisor status" 
ON public.profiles 
FOR UPDATE 
USING (is_manager(auth.uid()))
WITH CHECK (is_manager(auth.uid()));