-- Adicionar campo de público-alvo aos treinamentos
ALTER TABLE public.trainings 
ADD COLUMN target_audience text[] DEFAULT '{}',
ADD COLUMN cover_image_url text,
ADD COLUMN points_reward integer DEFAULT 10;

-- Criar tabela de módulos de treinamento
CREATE TABLE public.training_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id uuid REFERENCES public.trainings(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Criar tabela de conteúdos do módulo
CREATE TABLE public.training_contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES public.training_modules(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  content_type text NOT NULL CHECK (content_type IN ('video', 'audio', 'document', 'text')),
  content_url text,
  content_text text,
  duration_minutes integer,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Atualizar training_progress para rastrear conteúdos concluídos
ALTER TABLE public.training_progress
ADD COLUMN content_id uuid REFERENCES public.training_contents(id) ON DELETE CASCADE,
ADD COLUMN module_id uuid REFERENCES public.training_modules(id) ON DELETE CASCADE;

-- Habilitar RLS
ALTER TABLE public.training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_contents ENABLE ROW LEVEL SECURITY;

-- Políticas para training_modules
CREATE POLICY "Everyone can view training modules"
ON public.training_modules FOR SELECT
USING (true);

CREATE POLICY "Gestoras can manage training modules"
ON public.training_modules FOR ALL
USING (has_role(auth.uid(), 'gestora'::app_role));

-- Políticas para training_contents
CREATE POLICY "Everyone can view training contents"
ON public.training_contents FOR SELECT
USING (true);

CREATE POLICY "Gestoras can manage training contents"
ON public.training_contents FOR ALL
USING (has_role(auth.uid(), 'gestora'::app_role));

-- Criar bucket para conteúdos de treinamento
INSERT INTO storage.buckets (id, name, public) 
VALUES ('training-content', 'training-content', true);

-- Políticas de storage
CREATE POLICY "Anyone can view training content"
ON storage.objects FOR SELECT
USING (bucket_id = 'training-content');

CREATE POLICY "Gestoras can upload training content"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'training-content' AND has_role(auth.uid(), 'gestora'::app_role));

CREATE POLICY "Gestoras can update training content"
ON storage.objects FOR UPDATE
USING (bucket_id = 'training-content' AND has_role(auth.uid(), 'gestora'::app_role));

CREATE POLICY "Gestoras can delete training content"
ON storage.objects FOR DELETE
USING (bucket_id = 'training-content' AND has_role(auth.uid(), 'gestora'::app_role));

-- Função para atualizar pontos quando treinamento é concluído
CREATE OR REPLACE FUNCTION public.update_scores_on_training_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  training_points integer;
  user_role text;
  training_target text[];
  current_period DATE := date_trunc('month', CURRENT_DATE)::DATE;
BEGIN
  -- Buscar pontos do treinamento e público-alvo
  SELECT t.points_reward, t.target_audience INTO training_points, training_target
  FROM trainings t
  JOIN training_modules m ON m.training_id = t.id
  JOIN training_contents c ON c.module_id = m.id
  WHERE c.id = NEW.content_id;

  -- Buscar função do usuário
  SELECT COALESCE(p.custom_role, p.role) INTO user_role
  FROM profiles p
  WHERE p.id = NEW.user_id;

  -- Verificar se é treinamento da área do usuário (bônus de pontos)
  IF user_role = ANY(training_target) THEN
    training_points := training_points * 2; -- Dobra pontos para treinamentos da área
  END IF;

  -- Atualizar pontuação
  INSERT INTO public.user_scores (user_id, trainings_completed, period_start)
  VALUES (NEW.user_id, 1, current_period)
  ON CONFLICT (user_id, period_start)
  DO UPDATE SET
    trainings_completed = user_scores.trainings_completed + 1,
    updated_at = now();

  -- Atualizar posição na corrida da meta
  UPDATE public.goals_race_config
  SET current_position = current_position + (training_points / 5),
      updated_at = now()
  WHERE is_active = true;

  -- Registrar evento na corrida
  INSERT INTO public.goals_race_events (race_id, event_type, points, description, related_user_id)
  SELECT
    id,
    'training_completed'::race_event_type,
    training_points / 5,
    'Treinamento concluído',
    NEW.user_id
  FROM public.goals_race_config
  WHERE is_active = true;

  RETURN NEW;
END;
$$;

-- Adicionar novo tipo de evento para treinamentos
ALTER TYPE race_event_type ADD VALUE IF NOT EXISTS 'training_completed';

-- Trigger para atualizar pontos
CREATE TRIGGER on_training_content_complete
AFTER INSERT ON public.training_progress
FOR EACH ROW
WHEN (NEW.completed_at IS NOT NULL AND NEW.content_id IS NOT NULL)
EXECUTE FUNCTION public.update_scores_on_training_complete();