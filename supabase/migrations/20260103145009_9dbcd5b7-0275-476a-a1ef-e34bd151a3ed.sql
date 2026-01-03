-- Enum para roles do app
CREATE TYPE public.app_role AS ENUM ('gestora', 'supervisora', 'colaborador');

-- Tabela de roles dos usuários (separada do profiles para segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'colaborador',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Função para verificar role (security definer para evitar recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para verificar se é gestora ou supervisora
CREATE OR REPLACE FUNCTION public.is_manager_or_supervisor(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('gestora', 'supervisora')
  )
$$;

-- RLS para user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Gestoras can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'gestora'));

CREATE POLICY "Gestoras can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'gestora'));

-- =============================================
-- TABELA: Supervisora da Semana
-- =============================================
CREATE TABLE public.weekly_supervisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  assigned_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (week_start)
);

ALTER TABLE public.weekly_supervisors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view weekly supervisors"
ON public.weekly_supervisors FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Gestoras can manage weekly supervisors"
ON public.weekly_supervisors FOR ALL
USING (public.has_role(auth.uid(), 'gestora'));

-- =============================================
-- TABELA: Checklists Diários
-- =============================================
CREATE TABLE public.daily_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by UUID NOT NULL REFERENCES auth.users(id),
  submitted_by_name TEXT NOT NULL,
  checklist_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Seção 1: Pontualidade e Conduta
  punctuality_on_time BOOLEAN,
  punctuality_uniforms BOOLEAN,
  punctuality_hair BOOLEAN,
  punctuality_makeup BOOLEAN,
  
  -- Seção 2: Limpeza e Organização
  cleaning_reception BOOLEAN,
  cleaning_rooms BOOLEAN,
  cleaning_equipment BOOLEAN,
  cleaning_towels BOOLEAN,
  cleaning_bathrooms BOOLEAN,
  cleaning_common_areas BOOLEAN,
  cleaning_trash BOOLEAN,
  
  -- Seção 3: Atendimento e Experiência
  service_cordial BOOLEAN,
  service_on_time BOOLEAN,
  service_room_ready BOOLEAN,
  service_post_cleaning BOOLEAN,
  service_explanations BOOLEAN,
  service_satisfied BOOLEAN,
  
  -- Seção 4: Organização Operacional
  operations_previous_checklist BOOLEAN,
  operations_schedule_visible BOOLEAN,
  operations_materials_stocked BOOLEAN,
  operations_equipment_working BOOLEAN,
  operations_agenda_reviewed BOOLEAN,
  operations_cash_checked BOOLEAN,
  
  -- Seção 5: Comportamento e Clima
  behavior_quiet_environment BOOLEAN,
  behavior_clear_communication BOOLEAN,
  behavior_no_conflicts BOOLEAN,
  behavior_proactivity BOOLEAN,
  behavior_positive_climate BOOLEAN,
  
  -- Metadados
  is_perfect BOOLEAN GENERATED ALWAYS AS (
    punctuality_on_time = true AND punctuality_uniforms = true AND punctuality_hair = true AND punctuality_makeup = true AND
    cleaning_reception = true AND cleaning_rooms = true AND cleaning_equipment = true AND cleaning_towels = true AND 
    cleaning_bathrooms = true AND cleaning_common_areas = true AND cleaning_trash = true AND
    service_cordial = true AND service_on_time = true AND service_room_ready = true AND service_post_cleaning = true AND 
    service_explanations = true AND service_satisfied = true AND
    operations_previous_checklist = true AND operations_schedule_visible = true AND operations_materials_stocked = true AND 
    operations_equipment_working = true AND operations_agenda_reviewed = true AND operations_cash_checked = true AND
    behavior_quiet_environment = true AND behavior_clear_communication = true AND behavior_no_conflicts = true AND 
    behavior_proactivity = true AND behavior_positive_climate = true
  ) STORED,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gestoras and supervisoras can view all checklists"
ON public.daily_checklists FOR SELECT
TO authenticated
USING (public.is_manager_or_supervisor(auth.uid()));

CREATE POLICY "Gestoras and supervisoras can insert checklists"
ON public.daily_checklists FOR INSERT
TO authenticated
WITH CHECK (public.is_manager_or_supervisor(auth.uid()) AND auth.uid() = submitted_by);

-- =============================================
-- TABELA: Ocorrências do Checklist
-- =============================================
CREATE TABLE public.checklist_occurrences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES public.daily_checklists(id) ON DELETE CASCADE,
  occurrence TEXT NOT NULL,
  action_taken TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.checklist_occurrences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gestoras and supervisoras can view occurrences"
ON public.checklist_occurrences FOR SELECT
TO authenticated
USING (public.is_manager_or_supervisor(auth.uid()));

CREATE POLICY "Gestoras and supervisoras can insert occurrences"
ON public.checklist_occurrences FOR INSERT
TO authenticated
WITH CHECK (public.is_manager_or_supervisor(auth.uid()));

-- =============================================
-- TABELA: Corrida da Meta (Configuração)
-- =============================================
CREATE TABLE public.goals_race_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_target INTEGER NOT NULL DEFAULT 20,
  current_position INTEGER NOT NULL DEFAULT 0,
  period_start DATE NOT NULL DEFAULT CURRENT_DATE,
  period_end DATE,
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.goals_race_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active goals race"
ON public.goals_race_config FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Gestoras can manage goals race config"
ON public.goals_race_config FOR ALL
USING (public.has_role(auth.uid(), 'gestora'));

-- =============================================
-- TABELA: Eventos da Corrida da Meta
-- =============================================
CREATE TYPE public.race_event_type AS ENUM (
  'checklist_sent',
  'checklist_perfect',
  'delay',
  'critical_error',
  'checklist_missing'
);

CREATE TABLE public.goals_race_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id UUID NOT NULL REFERENCES public.goals_race_config(id) ON DELETE CASCADE,
  event_type race_event_type NOT NULL,
  points INTEGER NOT NULL,
  description TEXT,
  related_user_id UUID REFERENCES auth.users(id),
  related_checklist_id UUID REFERENCES public.daily_checklists(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.goals_race_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view race events"
ON public.goals_race_events FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System can insert race events"
ON public.goals_race_events FOR INSERT
TO authenticated
WITH CHECK (public.is_manager_or_supervisor(auth.uid()));

-- =============================================
-- TABELA: Pontuação Individual (Ranking)
-- =============================================
CREATE TABLE public.user_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checklists_sent INTEGER NOT NULL DEFAULT 0,
  perfect_checklists INTEGER NOT NULL DEFAULT 0,
  delays INTEGER NOT NULL DEFAULT 0,
  critical_errors INTEGER NOT NULL DEFAULT 0,
  trainings_completed INTEGER NOT NULL DEFAULT 0,
  supervisor_weeks INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER GENERATED ALWAYS AS (
    (checklists_sent * 5) + 
    (perfect_checklists * 10) + 
    (trainings_completed * 3) + 
    (supervisor_weeks * 2) - 
    (delays * 3) - 
    (critical_errors * 5)
  ) STORED,
  period_start DATE NOT NULL DEFAULT date_trunc('month', CURRENT_DATE)::DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, period_start)
);

ALTER TABLE public.user_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view scores"
ON public.user_scores FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Gestoras can manage scores"
ON public.user_scores FOR ALL
USING (public.has_role(auth.uid(), 'gestora'));

-- =============================================
-- TABELA: Treinamentos
-- =============================================
CREATE TABLE public.trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view trainings"
ON public.trainings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Gestoras can manage trainings"
ON public.trainings FOR ALL
USING (public.has_role(auth.uid(), 'gestora'));

-- =============================================
-- TABELA: Progresso em Treinamentos
-- =============================================
CREATE TABLE public.training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  training_id UUID NOT NULL REFERENCES public.trainings(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, training_id)
);

ALTER TABLE public.training_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress"
ON public.training_progress FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Gestoras can view all progress"
ON public.training_progress FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'gestora'));

CREATE POLICY "Users can update their own progress"
ON public.training_progress FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- TRIGGER: Atualizar pontuação após checklist
-- =============================================
CREATE OR REPLACE FUNCTION public.update_scores_on_checklist()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_period DATE := date_trunc('month', CURRENT_DATE)::DATE;
BEGIN
  -- Inserir ou atualizar pontuação do usuário
  INSERT INTO public.user_scores (user_id, checklists_sent, perfect_checklists, period_start)
  VALUES (NEW.submitted_by, 1, CASE WHEN NEW.is_perfect THEN 1 ELSE 0 END, current_period)
  ON CONFLICT (user_id, period_start) 
  DO UPDATE SET 
    checklists_sent = user_scores.checklists_sent + 1,
    perfect_checklists = user_scores.perfect_checklists + CASE WHEN NEW.is_perfect THEN 1 ELSE 0 END,
    updated_at = now();
  
  -- Atualizar posição na corrida da meta
  UPDATE public.goals_race_config 
  SET current_position = current_position + CASE WHEN NEW.is_perfect THEN 2 ELSE 1 END,
      updated_at = now()
  WHERE is_active = true;
  
  -- Registrar evento na corrida
  INSERT INTO public.goals_race_events (race_id, event_type, points, description, related_user_id, related_checklist_id)
  SELECT 
    id,
    CASE WHEN NEW.is_perfect THEN 'checklist_perfect'::race_event_type ELSE 'checklist_sent'::race_event_type END,
    CASE WHEN NEW.is_perfect THEN 2 ELSE 1 END,
    CASE WHEN NEW.is_perfect THEN 'Checklist perfeito enviado' ELSE 'Checklist enviado' END,
    NEW.submitted_by,
    NEW.id
  FROM public.goals_race_config
  WHERE is_active = true;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_checklist_submitted
AFTER INSERT ON public.daily_checklists
FOR EACH ROW
EXECUTE FUNCTION public.update_scores_on_checklist();

-- Trigger para updated_at
CREATE TRIGGER update_daily_checklists_updated_at
BEFORE UPDATE ON public.daily_checklists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_goals_race_config_updated_at
BEFORE UPDATE ON public.goals_race_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_scores_updated_at
BEFORE UPDATE ON public.user_scores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();