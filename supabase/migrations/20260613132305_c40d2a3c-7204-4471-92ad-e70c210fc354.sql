
-- 1) profiles: revoke phone column access from anon/authenticated; rely on app to use service role / admin for phone
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, user_id, display_name, avatar_url, created_at, updated_at) ON public.profiles TO anon, authenticated;
-- If 'bio' or other non-sensitive columns exist, they'd need to be added similarly. Phone is intentionally excluded.

-- 2) seller_profiles: revoke sensitive columns from anon/authenticated
REVOKE SELECT ON public.seller_profiles FROM anon, authenticated;
GRANT SELECT (
  id, user_id, business_name, business_name_ar, description, description_ar,
  slug, shipping_preference, created_at, updated_at
) ON public.seller_profiles TO anon, authenticated;
-- Owner & admin can still read full row through the existing RLS policies via service_role / admin flows.
GRANT SELECT ON public.seller_profiles TO service_role;

-- Allow owner & admin to read the sensitive columns via a dedicated policy path:
-- Add column-level grants for service_role already covered. For owner/admin access in client,
-- expose via security-definer function below.
CREATE OR REPLACE FUNCTION public.get_my_seller_profile()
RETURNS SETOF public.seller_profiles
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.seller_profiles
  WHERE user_id = auth.uid() OR public.has_role(auth.uid(), 'admin');
$$;
REVOKE EXECUTE ON FUNCTION public.get_my_seller_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_seller_profile() TO authenticated;

-- 3) recycling_points: remove self-update branch
DROP POLICY IF EXISTS "System can update points" ON public.recycling_points;
CREATE POLICY "Admins can update points"
ON public.recycling_points
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) storage: enforce folder ownership for product-images uploads
DROP POLICY IF EXISTS "Upload product images" ON storage.objects;
CREATE POLICY "Upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 5) storage: remove broad public listing on product-images bucket.
-- Public bucket still allows fetching by URL without a SELECT policy.
DROP POLICY IF EXISTS "Product images public" ON storage.objects;

-- 6) Lock down SECURITY DEFINER functions not meant for direct client calls
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated; -- used by RLS; needs authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_product_slug() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_seller_slug() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_seller_order_ids(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.approve_recycling_submission(uuid, uuid) FROM PUBLIC, anon;
-- Keep redeem_recycling_points executable by authenticated users (intentional endpoint)
REVOKE EXECUTE ON FUNCTION public.redeem_recycling_points(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_recycling_points(uuid, integer) TO authenticated;
