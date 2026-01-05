-- Create client_feedbacks table for customer ratings
CREATE TABLE public.client_feedbacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_feedbacks ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert feedback (public form)
CREATE POLICY "Anyone can submit feedback"
ON public.client_feedbacks
FOR INSERT
WITH CHECK (true);

-- Only managers can view feedbacks
CREATE POLICY "Managers can view feedbacks"
ON public.client_feedbacks
FOR SELECT
USING (is_manager(auth.uid()));

-- Managers can manage feedbacks
CREATE POLICY "Managers can manage feedbacks"
ON public.client_feedbacks
FOR ALL
USING (is_manager(auth.uid()));