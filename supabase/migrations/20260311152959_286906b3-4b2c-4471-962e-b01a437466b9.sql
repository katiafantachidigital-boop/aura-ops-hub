
-- Create occurrence_replies table
CREATE TABLE public.occurrence_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurrence_id uuid NOT NULL REFERENCES public.occurrences(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.occurrence_replies ENABLE ROW LEVEL SECURITY;

-- Only managers can insert replies
CREATE POLICY "Only managers can insert replies"
ON public.occurrence_replies
FOR INSERT
WITH CHECK (is_manager(auth.uid()) AND auth.uid() = user_id);

-- Users can see replies on their own occurrences, managers see all
CREATE POLICY "Users can view replies"
ON public.occurrence_replies
FOR SELECT
USING (
  is_manager(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.occurrences o
    WHERE o.id = occurrence_id AND o.user_id = auth.uid()
  )
);

-- Only managers can delete replies
CREATE POLICY "Managers can delete replies"
ON public.occurrence_replies
FOR DELETE
USING (is_manager(auth.uid()));
