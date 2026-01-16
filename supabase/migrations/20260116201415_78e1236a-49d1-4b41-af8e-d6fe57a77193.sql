-- Add visibility columns to announcements table
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public',
ADD COLUMN IF NOT EXISTS target_profiles TEXT[] DEFAULT NULL;

-- Update RLS policy to filter by visibility
DROP POLICY IF EXISTS "Anyone can view announcements" ON public.announcements;

CREATE POLICY "Users can view public or targeted announcements" 
ON public.announcements 
FOR SELECT 
USING (
  visibility = 'public' 
  OR is_manager(auth.uid())
  OR (
    visibility = 'exclusive' 
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.id::text = ANY(target_profiles)
    )
  )
);