
-- Create sales goals configuration table
CREATE TABLE public.sales_goals_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  min_goal NUMERIC NOT NULL DEFAULT 20,
  mid_goal NUMERIC NOT NULL DEFAULT 50,
  max_goal NUMERIC NOT NULL DEFAULT 100,
  current_value NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  period_start DATE NOT NULL DEFAULT CURRENT_DATE,
  period_end DATE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sales events table to track each sale
CREATE TABLE public.sales_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id UUID NOT NULL REFERENCES public.sales_goals_config(id) ON DELETE CASCADE,
  sale_value NUMERIC NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales_goals_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_events ENABLE ROW LEVEL SECURITY;

-- RLS for sales_goals_config
CREATE POLICY "Everyone can view active sales goals"
ON public.sales_goals_config
FOR SELECT
USING (true);

CREATE POLICY "Gestoras can manage sales goals config"
ON public.sales_goals_config
FOR ALL
USING (has_role(auth.uid(), 'gestora'::app_role));

-- RLS for sales_events
CREATE POLICY "Everyone can view sales events"
ON public.sales_events
FOR SELECT
USING (true);

CREATE POLICY "Gestoras can insert sales events"
ON public.sales_events
FOR INSERT
WITH CHECK (is_manager(auth.uid()));

CREATE POLICY "Gestoras can delete sales events"
ON public.sales_events
FOR DELETE
USING (is_manager(auth.uid()));

-- Trigger for updated_at on sales_goals_config
CREATE TRIGGER update_sales_goals_config_updated_at
BEFORE UPDATE ON public.sales_goals_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for active config lookup
CREATE INDEX idx_sales_goals_config_active ON public.sales_goals_config(is_active) WHERE is_active = true;

-- Index for events by config
CREATE INDEX idx_sales_events_config_id ON public.sales_events(config_id);
