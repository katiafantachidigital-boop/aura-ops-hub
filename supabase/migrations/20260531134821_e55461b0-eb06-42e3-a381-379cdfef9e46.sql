
-- Enum de status
CREATE TYPE public.meeting_status AS ENUM ('scheduled', 'finalized', 'completed');

-- Tabela de reuniões
CREATE TABLE public.meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  meeting_date DATE NOT NULL,
  meeting_time TEXT NOT NULL,
  meeting_link TEXT,
  agenda TEXT,
  participants UUID[] NOT NULL DEFAULT '{}',
  status public.meeting_status NOT NULL DEFAULT 'scheduled',
  created_by UUID NOT NULL,
  created_by_name TEXT NOT NULL,
  finalized_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meetings TO authenticated;
GRANT ALL ON public.meetings TO service_role;

ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers manage meetings"
  ON public.meetings FOR ALL
  USING (is_manager(auth.uid()))
  WITH CHECK (is_manager(auth.uid()));

CREATE POLICY "Participants view their meetings"
  ON public.meetings FOR SELECT
  USING (auth.uid() = ANY(participants));

CREATE TRIGGER update_meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_meetings_date ON public.meetings(meeting_date);
CREATE INDEX idx_meetings_participants ON public.meetings USING GIN(participants);

-- Tabela de assinaturas
CREATE TABLE public.meeting_signatures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  signed_name TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, user_id)
);

GRANT SELECT, INSERT ON public.meeting_signatures TO authenticated;
GRANT ALL ON public.meeting_signatures TO service_role;

ALTER TABLE public.meeting_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Managers view all signatures"
  ON public.meeting_signatures FOR SELECT
  USING (is_manager(auth.uid()));

CREATE POLICY "Participants view signatures of their meetings"
  ON public.meeting_signatures FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.meetings m
    WHERE m.id = meeting_signatures.meeting_id
      AND auth.uid() = ANY(m.participants)
  ));

CREATE POLICY "Participants insert own signature on finalized meetings"
  ON public.meeting_signatures FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.meetings m
      WHERE m.id = meeting_signatures.meeting_id
        AND m.status = 'finalized'
        AND auth.uid() = ANY(m.participants)
    )
  );

-- Trigger: quando todos assinarem, marca como completed
CREATE OR REPLACE FUNCTION public.check_meeting_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_participants INTEGER;
  total_signatures INTEGER;
BEGIN
  SELECT array_length(participants, 1) INTO total_participants
  FROM public.meetings WHERE id = NEW.meeting_id;

  SELECT COUNT(*) INTO total_signatures
  FROM public.meeting_signatures WHERE meeting_id = NEW.meeting_id;

  IF total_signatures >= total_participants THEN
    UPDATE public.meetings
    SET status = 'completed', completed_at = now()
    WHERE id = NEW.meeting_id AND status = 'finalized';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_check_meeting_completion
  AFTER INSERT ON public.meeting_signatures
  FOR EACH ROW EXECUTE FUNCTION public.check_meeting_completion();
