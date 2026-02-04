-- 1. Criar tabela para rastrear treinamentos vistos
CREATE TABLE public.training_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  training_id UUID NOT NULL REFERENCES public.trainings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint to prevent duplicate reads
ALTER TABLE public.training_reads ADD CONSTRAINT training_reads_unique UNIQUE (training_id, user_id);

-- Enable RLS
ALTER TABLE public.training_reads ENABLE ROW LEVEL SECURITY;

-- Policies for training_reads
CREATE POLICY "Users can view their own training reads"
ON public.training_reads
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can mark trainings as read"
ON public.training_reads
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 2. Criar tabela para rastrear ocorrências vistas
CREATE TABLE public.occurrence_reads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  occurrence_id UUID NOT NULL REFERENCES public.occurrences(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Unique constraint to prevent duplicate reads
ALTER TABLE public.occurrence_reads ADD CONSTRAINT occurrence_reads_unique UNIQUE (occurrence_id, user_id);

-- Enable RLS
ALTER TABLE public.occurrence_reads ENABLE ROW LEVEL SECURITY;

-- Policies for occurrence_reads
CREATE POLICY "Users can view their own occurrence reads"
ON public.occurrence_reads
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can mark occurrences as read"
ON public.occurrence_reads
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 3. Adicionar campos de visibilidade à tabela de ocorrências
ALTER TABLE public.occurrences 
ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public',
ADD COLUMN target_profiles TEXT[] DEFAULT NULL;

-- 4. Atualizar RLS de ocorrências para visibilidade
DROP POLICY IF EXISTS "Users can view their own occurrences" ON public.occurrences;
DROP POLICY IF EXISTS "Managers can view all occurrences" ON public.occurrences;
DROP POLICY IF EXISTS "Everyone can view manager occurrences" ON public.occurrences;

-- Nova política: Usuários podem ver ocorrências públicas, ou exclusivas destinadas a eles, ou criadas por eles
CREATE POLICY "Users can view accessible occurrences"
ON public.occurrences
FOR SELECT
USING (
  (visibility = 'public') 
  OR is_manager(auth.uid()) 
  OR (auth.uid() = user_id)
  OR (
    visibility = 'exclusive' 
    AND (auth.uid())::text = ANY(target_profiles)
  )
);

-- 5. Adicionar coluna sales_count na tabela user_scores para rastrear vendas registradas
ALTER TABLE public.user_scores
ADD COLUMN IF NOT EXISTS sales_registered INTEGER NOT NULL DEFAULT 0;

-- 6. Atualizar trigger de checklist para usar novos valores de pontos (checklist=3, perfeito=5)
CREATE OR REPLACE FUNCTION public.update_scores_on_checklist()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_period DATE := date_trunc('month', CURRENT_DATE)::DATE;
BEGIN
  -- Inserir ou atualizar pontuação do usuário (apenas contadores, sem afetar a corrida)
  INSERT INTO public.user_scores (user_id, checklists_sent, perfect_checklists, period_start)
  VALUES (NEW.submitted_by, 1, CASE WHEN NEW.is_perfect THEN 1 ELSE 0 END, current_period)
  ON CONFLICT (user_id, period_start) 
  DO UPDATE SET 
    checklists_sent = user_scores.checklists_sent + 1,
    perfect_checklists = user_scores.perfect_checklists + CASE WHEN NEW.is_perfect THEN 1 ELSE 0 END,
    updated_at = now();
  
  RETURN NEW;
END;
$$;