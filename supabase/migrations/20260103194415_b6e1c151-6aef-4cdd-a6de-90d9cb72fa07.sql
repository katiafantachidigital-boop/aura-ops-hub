-- Atualizar o trigger para NÃO adicionar pontos automaticamente na corrida da meta
-- Os pontos só serão adicionados quando a gestora confirmar o checklist

CREATE OR REPLACE FUNCTION public.update_scores_on_checklist()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  -- NÃO atualiza mais a corrida da meta aqui
  -- Os pontos são adicionados apenas quando a gestora confirma o checklist
  
  RETURN NEW;
END;
$function$;