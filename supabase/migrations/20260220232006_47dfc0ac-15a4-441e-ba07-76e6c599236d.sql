
CREATE TABLE public.spreadsheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Nova Planilha',
  data JSONB NOT NULL DEFAULT '[[""]]'::jsonb,
  column_widths JSONB DEFAULT '[]'::jsonb,
  created_by UUID NOT NULL,
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.spreadsheets ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can view all spreadsheets
CREATE POLICY "Everyone can view spreadsheets"
  ON public.spreadsheets FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Everyone authenticated can create spreadsheets
CREATE POLICY "Users can create spreadsheets"
  ON public.spreadsheets FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Only creator or manager can update
CREATE POLICY "Creator or manager can update spreadsheets"
  ON public.spreadsheets FOR UPDATE
  USING (auth.uid() = created_by OR is_manager(auth.uid()));

-- Only creator or manager can delete
CREATE POLICY "Creator or manager can delete spreadsheets"
  ON public.spreadsheets FOR DELETE
  USING (auth.uid() = created_by OR is_manager(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_spreadsheets_updated_at
  BEFORE UPDATE ON public.spreadsheets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
