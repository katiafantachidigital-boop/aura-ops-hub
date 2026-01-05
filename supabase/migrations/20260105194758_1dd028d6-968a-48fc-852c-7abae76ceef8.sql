-- Tabela de clientes cadastrados
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  registered_by UUID NOT NULL,
  registered_by_name TEXT NOT NULL,
  sale_participants TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de relatórios de clientes
CREATE TABLE public.client_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  report_content TEXT NOT NULL,
  sale_details TEXT,
  commission_notes TEXT,
  created_by UUID NOT NULL,
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_reports ENABLE ROW LEVEL SECURITY;

-- Policies for clients
CREATE POLICY "Gestoras can view all clients"
ON public.clients FOR SELECT
USING (is_manager(auth.uid()));

CREATE POLICY "Weekly supervisors can view clients"
ON public.clients FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.weekly_supervisors
    WHERE user_id = auth.uid()
    AND CURRENT_DATE BETWEEN week_start AND week_end
  )
);

CREATE POLICY "Weekly supervisors can insert clients"
ON public.clients FOR INSERT
WITH CHECK (
  auth.uid() = registered_by AND
  EXISTS (
    SELECT 1 FROM public.weekly_supervisors
    WHERE user_id = auth.uid()
    AND CURRENT_DATE BETWEEN week_start AND week_end
  )
);

CREATE POLICY "Gestoras can manage clients"
ON public.clients FOR ALL
USING (is_manager(auth.uid()));

-- Policies for reports
CREATE POLICY "Gestoras can view all reports"
ON public.client_reports FOR SELECT
USING (is_manager(auth.uid()));

CREATE POLICY "Weekly supervisors can view reports"
ON public.client_reports FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.weekly_supervisors
    WHERE user_id = auth.uid()
    AND CURRENT_DATE BETWEEN week_start AND week_end
  )
);

CREATE POLICY "Weekly supervisors can insert reports"
ON public.client_reports FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM public.weekly_supervisors
    WHERE user_id = auth.uid()
    AND CURRENT_DATE BETWEEN week_start AND week_end
  )
);

CREATE POLICY "Gestoras can manage reports"
ON public.client_reports FOR ALL
USING (is_manager(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();