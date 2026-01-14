-- Tighten permissive RLS policy flagged by linter while keeping feedback public
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.client_feedbacks;

CREATE POLICY "Anyone can insert feedback"
ON public.client_feedbacks
FOR INSERT
TO public
WITH CHECK (
  overall_rating IS NOT NULL
  AND overall_rating >= 1
  AND overall_rating <= 5
);