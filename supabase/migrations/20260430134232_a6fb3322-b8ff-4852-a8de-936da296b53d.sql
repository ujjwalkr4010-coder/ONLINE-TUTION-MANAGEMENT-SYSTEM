
-- Pin search_path on all functions
ALTER FUNCTION public.update_updated_at() SET search_path = public;

-- Revoke public execute; keep callable from RLS (definer runs as owner regardless)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
