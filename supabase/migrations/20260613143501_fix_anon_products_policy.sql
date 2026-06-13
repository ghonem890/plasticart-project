-- Fix: The products RLS policy calls has_role() which was revoked from anon,
-- causing "permission denied" for anonymous users even when viewing active products.
-- Solution: Split into two policies - one for anon (active only) and one for authenticated.

DROP POLICY IF EXISTS "Active products viewable" ON public.products;

-- Anon users can only see active products (no has_role call)
CREATE POLICY "Active products viewable by anyone"
ON public.products FOR SELECT
TO anon
USING (status = 'active');

-- Authenticated users can see active + their own + admin sees all
CREATE POLICY "Products viewable by authenticated"
ON public.products FOR SELECT
TO authenticated
USING (
  status = 'active'
  OR auth.uid() = seller_id
  OR public.has_role(auth.uid(), 'admin')
);
