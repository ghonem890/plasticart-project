
-- Fix: Drop restrictive policies and recreate as permissive for seller_profiles

DROP POLICY IF EXISTS "Sellers can insert own profile" ON public.seller_profiles;
DROP POLICY IF EXISTS "Sellers can update own profile" ON public.seller_profiles;
DROP POLICY IF EXISTS "Seller profiles viewable by everyone" ON public.seller_profiles;
DROP POLICY IF EXISTS "Admins can manage seller profiles" ON public.seller_profiles;

-- Permissive SELECT: everyone can view
CREATE POLICY "Seller profiles viewable by everyone"
ON public.seller_profiles FOR SELECT
USING (true);

-- Permissive INSERT: sellers can insert own profile
CREATE POLICY "Sellers can insert own profile"
ON public.seller_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Permissive UPDATE: sellers can update own, admins can update all
CREATE POLICY "Sellers can update own profile"
ON public.seller_profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage seller profiles"
ON public.seller_profiles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));
