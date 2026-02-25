
-- Allow all authenticated users to insert clients
DROP POLICY IF EXISTS "Weekly supervisors can insert clients" ON public.clients;
CREATE POLICY "Authenticated users can insert clients"
  ON public.clients FOR INSERT
  WITH CHECK (auth.uid() = registered_by);

-- Allow all authenticated users to view their own clients (managers see all)
DROP POLICY IF EXISTS "Weekly supervisors can view clients" ON public.clients;
CREATE POLICY "Users can view their own clients"
  ON public.clients FOR SELECT
  USING (auth.uid() = registered_by);

-- Allow all authenticated users to insert reports
DROP POLICY IF EXISTS "Weekly supervisors can insert reports" ON public.client_reports;
CREATE POLICY "Authenticated users can insert reports"
  ON public.client_reports FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Allow all authenticated users to view their own reports (managers see all via existing policy)
DROP POLICY IF EXISTS "Weekly supervisors can view reports" ON public.client_reports;
CREATE POLICY "Users can view their own reports"
  ON public.client_reports FOR SELECT
  USING (auth.uid() = created_by);
