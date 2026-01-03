-- Atualizar a função is_manager para usar o novo email da gerente
CREATE OR REPLACE FUNCTION public.is_manager(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users u
    WHERE u.id = _user_id
      AND u.email = 'gerenteipfp@gmail.com'
  )
  OR
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'gestora'
  )
$function$;