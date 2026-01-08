-- Drop existing table and recreate with all survey fields
DROP TABLE IF EXISTS public.client_feedbacks;

CREATE TABLE public.client_feedbacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Identificação (opcional)
  unit TEXT, -- 'batel' or 'capao_raso'
  procedure_type TEXT,
  professional_name TEXT,
  
  -- Experiência na Chegada
  reception_rating TEXT, -- 'excelente', 'bom', 'regular', 'ruim'
  felt_welcomed TEXT, -- 'sim_totalmente', 'em_parte', 'nao'
  environment_clean TEXT, -- 'sim', 'parcialmente', 'nao'
  
  -- Atendimento do Profissional
  professional_polite TEXT, -- 'sim_excelente', 'bom', 'regular', 'ruim'
  procedure_explained TEXT, -- 'sim', 'mais_ou_menos', 'nao'
  felt_comfortable TEXT, -- 'sim', 'em_parte', 'nao'
  
  -- Experiência Geral
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  met_expectations TEXT, -- 'superou', 'atendeu', 'ficou_abaixo'
  
  -- Percepção e Indicação
  would_recommend TEXT, -- 'com_certeza', 'talvez', 'nao'
  would_return TEXT, -- 'sim', 'talvez', 'nao'
  
  -- Comentário Final
  comment TEXT
);

-- Enable RLS
ALTER TABLE public.client_feedbacks ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert feedback (public form)
CREATE POLICY "Anyone can insert feedback"
  ON public.client_feedbacks
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Only managers can view feedbacks
CREATE POLICY "Managers can view feedbacks"
  ON public.client_feedbacks
  FOR SELECT
  USING (public.is_manager(auth.uid()));