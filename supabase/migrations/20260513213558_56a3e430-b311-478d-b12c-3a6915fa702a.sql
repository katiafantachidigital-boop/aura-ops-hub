
CREATE TABLE public.prospeccao_sheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  sheet_date DATE NOT NULL DEFAULT CURRENT_DATE,
  data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, sheet_date)
);

ALTER TABLE public.prospeccao_sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own current sheet"
ON public.prospeccao_sheets
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Managers can view all sheets"
ON public.prospeccao_sheets
FOR SELECT
USING (is_manager(auth.uid()));

CREATE POLICY "Managers can delete sheets"
ON public.prospeccao_sheets
FOR DELETE
USING (is_manager(auth.uid()));

CREATE TRIGGER update_prospeccao_sheets_updated_at
BEFORE UPDATE ON public.prospeccao_sheets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_prospeccao_user_date ON public.prospeccao_sheets(user_id, sheet_date DESC);
