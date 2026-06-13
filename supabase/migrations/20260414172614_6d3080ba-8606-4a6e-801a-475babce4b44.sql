CREATE TABLE public.seller_intended_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_profile_id uuid NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_intended_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers insert intended products" ON public.seller_intended_products
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM seller_profiles WHERE id = seller_profile_id AND user_id = auth.uid()
  ));

CREATE POLICY "Intended products viewable" ON public.seller_intended_products
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins manage intended products" ON public.seller_intended_products
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'));