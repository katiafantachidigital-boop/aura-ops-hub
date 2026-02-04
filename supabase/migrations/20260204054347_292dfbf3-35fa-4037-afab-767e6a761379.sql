-- Criar tabela para registros de caixa
CREATE TABLE public.cash_register (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    total_value NUMERIC NOT NULL,
    register_date DATE NOT NULL DEFAULT CURRENT_DATE,
    registered_by UUID NOT NULL,
    registered_by_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cash_register ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Gestoras e supervisoras podem ver registros de caixa"
ON public.cash_register
FOR SELECT
USING (is_manager_or_supervisor(auth.uid()));

CREATE POLICY "Gestoras e supervisoras podem inserir registros de caixa"
ON public.cash_register
FOR INSERT
WITH CHECK (is_manager_or_supervisor(auth.uid()) AND auth.uid() = registered_by);

CREATE POLICY "Gestoras podem deletar registros de caixa"
ON public.cash_register
FOR DELETE
USING (is_manager(auth.uid()));