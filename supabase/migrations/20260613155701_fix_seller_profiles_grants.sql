-- Fix missing GRANTS for seller_profiles to allow anon and authenticated users to read it.
GRANT SELECT ON public.seller_profiles TO anon;
GRANT SELECT ON public.seller_profiles TO authenticated;
