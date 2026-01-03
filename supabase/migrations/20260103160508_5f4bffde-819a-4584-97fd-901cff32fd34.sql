-- Criar função para verificar se é gestora por email ou role
CREATE OR REPLACE FUNCTION public.is_manager(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = _user_id
      AND u.email = 'importacaofilms@gmail.com'
  )
  OR
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'gestora'
  )
$$;

-- Atualizar política de trainings para usar nova função
DROP POLICY IF EXISTS "Gestoras can manage trainings" ON public.trainings;

CREATE POLICY "Gestoras can manage trainings"
ON public.trainings FOR ALL
USING (is_manager(auth.uid()))
WITH CHECK (is_manager(auth.uid()));

-- Atualizar políticas de training_modules
DROP POLICY IF EXISTS "Gestoras can manage training modules" ON public.training_modules;

CREATE POLICY "Gestoras can manage training modules"
ON public.training_modules FOR ALL
USING (is_manager(auth.uid()))
WITH CHECK (is_manager(auth.uid()));

-- Atualizar políticas de training_contents
DROP POLICY IF EXISTS "Gestoras can manage training contents" ON public.training_contents;

CREATE POLICY "Gestoras can manage training contents"
ON public.training_contents FOR ALL
USING (is_manager(auth.uid()))
WITH CHECK (is_manager(auth.uid()));

-- Atualizar políticas de storage
DROP POLICY IF EXISTS "Gestoras can upload training content" ON storage.objects;
DROP POLICY IF EXISTS "Gestoras can update training content" ON storage.objects;
DROP POLICY IF EXISTS "Gestoras can delete training content" ON storage.objects;

CREATE POLICY "Gestoras can upload training content"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'training-content' AND is_manager(auth.uid()));

CREATE POLICY "Gestoras can update training content"
ON storage.objects FOR UPDATE
USING (bucket_id = 'training-content' AND is_manager(auth.uid()));

CREATE POLICY "Gestoras can delete training content"
ON storage.objects FOR DELETE
USING (bucket_id = 'training-content' AND is_manager(auth.uid()));