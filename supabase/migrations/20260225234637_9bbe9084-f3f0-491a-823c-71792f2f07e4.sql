
-- Create security definer function to get seller's order IDs without triggering RLS
CREATE OR REPLACE FUNCTION public.get_seller_order_ids(_seller_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT oi.order_id
  FROM order_items oi
  JOIN products p ON p.id = oi.product_id
  WHERE p.seller_id = _seller_id;
$$;

REVOKE EXECUTE ON FUNCTION public.get_seller_order_ids FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_seller_order_ids TO authenticated;

-- Replace the recursive orders SELECT policy
DROP POLICY IF EXISTS "Orders viewable by buyer seller admin" ON public.orders;

CREATE POLICY "Orders viewable by buyer seller admin"
ON public.orders FOR SELECT
USING (
  auth.uid() = buyer_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR id IN (SELECT public.get_seller_order_ids(auth.uid()))
);

-- Replace the recursive orders UPDATE policy
DROP POLICY IF EXISTS "Order updates by buyer seller admin" ON public.orders;

CREATE POLICY "Order updates by buyer seller admin"
ON public.orders FOR UPDATE
USING (
  auth.uid() = buyer_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR id IN (SELECT public.get_seller_order_ids(auth.uid()))
);
