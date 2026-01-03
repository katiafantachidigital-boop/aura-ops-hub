-- Add new columns to profiles table for onboarding
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS shift text CHECK (shift IN ('Manhã', 'Tarde')),
ADD COLUMN IF NOT EXISTS custom_role text,
ADD COLUMN IF NOT EXISTS profile_completed boolean NOT NULL DEFAULT false;

-- Update RLS policy to allow users to insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Update RLS policy to allow users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);