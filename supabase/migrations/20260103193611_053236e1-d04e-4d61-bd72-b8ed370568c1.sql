-- Adicionar coluna para marcar checklist como confirmado pela gestora
ALTER TABLE public.daily_checklists 
ADD COLUMN confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN confirmed_by UUID DEFAULT NULL;

-- Criar política para gestoras poderem atualizar checklists (para confirmar)
CREATE POLICY "Gestoras can update checklists to confirm"
ON public.daily_checklists
FOR UPDATE
USING (is_manager(auth.uid()))
WITH CHECK (is_manager(auth.uid()));