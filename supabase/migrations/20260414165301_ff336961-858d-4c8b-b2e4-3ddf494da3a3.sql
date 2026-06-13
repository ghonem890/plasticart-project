DROP POLICY "Seller profiles viewable by everyone" ON public.seller_profiles;
CREATE POLICY "Seller profiles viewable by everyone" ON public.seller_profiles FOR SELECT TO public USING (true);