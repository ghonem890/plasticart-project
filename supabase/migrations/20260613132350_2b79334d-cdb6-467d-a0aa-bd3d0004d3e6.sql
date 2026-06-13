
-- Allow verification_status to be publicly readable (used for "Verified" badge in catalog/product pages)
GRANT SELECT (verification_status) ON public.seller_profiles TO anon, authenticated;

-- SECURITY DEFINER function for admins to read all seller profiles (including sensitive cols)
CREATE OR REPLACE FUNCTION public.admin_list_seller_profiles()
RETURNS SETOF public.seller_profiles
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.seller_profiles
  WHERE public.has_role(auth.uid(), 'admin');
$$;
REVOKE EXECUTE ON FUNCTION public.admin_list_seller_profiles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_seller_profiles() TO authenticated;
