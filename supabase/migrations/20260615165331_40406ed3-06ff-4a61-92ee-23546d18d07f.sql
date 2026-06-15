
-- 1) Announcements: require authenticated
DROP POLICY IF EXISTS "Users can view public or targeted announcements" ON public.announcements;
CREATE POLICY "Users can view public or targeted announcements"
ON public.announcements
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL AND (
    visibility = 'public'
    OR public.is_manager(auth.uid())
    OR (visibility = 'exclusive' AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND (profiles.id)::text = ANY (announcements.target_profiles)
    ))
  )
);

-- 2) Storage: restrict bucket SELECT to authenticated (public URLs still work)
DROP POLICY IF EXISTS "Anyone can view announcement files" ON storage.objects;
CREATE POLICY "Authenticated can view announcement files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'announcements');

DROP POLICY IF EXISTS "Anyone can view training content" ON storage.objects;
CREATE POLICY "Authenticated can view training content"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'training-content');

DROP POLICY IF EXISTS "Avatars are publicly viewable" ON storage.objects;
CREATE POLICY "Authenticated can view avatars"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars');

-- 3) media-library bucket policies (managers only)
CREATE POLICY "Managers can view media library"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'media-library' AND public.is_manager(auth.uid()));

CREATE POLICY "Managers can upload to media library"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'media-library' AND public.is_manager(auth.uid()));

CREATE POLICY "Managers can update media library"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'media-library' AND public.is_manager(auth.uid()))
WITH CHECK (bucket_id = 'media-library' AND public.is_manager(auth.uid()));

CREATE POLICY "Managers can delete from media library"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'media-library' AND public.is_manager(auth.uid()));

-- 4) user_roles: replace broad ALL policy with explicit per-cmd policies
DROP POLICY IF EXISTS "Gestoras can manage roles" ON public.user_roles;

CREATE POLICY "Gestoras can insert roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'gestora'::app_role));

CREATE POLICY "Gestoras can update roles"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'gestora'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'gestora'::app_role));

CREATE POLICY "Gestoras can delete roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'gestora'::app_role));

-- 5) Revoke EXECUTE from anon on SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_manager(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_manager(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_manager_or_supervisor(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_manager_or_supervisor(uuid) TO authenticated;

-- Trigger-only helpers: not callable directly by clients
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.check_meeting_completion() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_scores_on_checklist() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_scores_on_training_complete() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
