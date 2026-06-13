
DROP POLICY IF EXISTS "Seller profiles viewable by everyone" ON public.seller_profiles;
DROP POLICY IF EXISTS "Admins can manage seller profiles" ON public.seller_profiles;
DROP POLICY IF EXISTS "Sellers can insert own profile" ON public.seller_profiles;
DROP POLICY IF EXISTS "Sellers can update own profile" ON public.seller_profiles;

CREATE POLICY "Seller profiles viewable by everyone"
ON public.seller_profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage seller profiles"
ON public.seller_profiles FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sellers can insert own profile"
ON public.seller_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Sellers can update own profile"
ON public.seller_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);
