-- Create occurrences table
CREATE TABLE public.occurrences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.occurrences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own occurrences
CREATE POLICY "Users can insert their own occurrences"
ON public.occurrences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own occurrences
CREATE POLICY "Users can view their own occurrences"
ON public.occurrences
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can view occurrences created by managers (everyone sees manager's occurrences)
CREATE POLICY "Everyone can view manager occurrences"
ON public.occurrences
FOR SELECT
USING (is_manager(user_id));

-- Policy: Managers can view all occurrences
CREATE POLICY "Managers can view all occurrences"
ON public.occurrences
FOR SELECT
USING (is_manager(auth.uid()));

-- Policy: Users can delete their own occurrences
CREATE POLICY "Users can delete their own occurrences"
ON public.occurrences
FOR DELETE
USING (auth.uid() = user_id);

-- Policy: Managers can delete any occurrence
CREATE POLICY "Managers can delete any occurrence"
ON public.occurrences
FOR DELETE
USING (is_manager(auth.uid()));