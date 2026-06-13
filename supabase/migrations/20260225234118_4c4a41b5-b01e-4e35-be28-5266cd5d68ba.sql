
DROP POLICY IF EXISTS "Buyers view own orders" ON public.orders;

CREATE POLICY "Orders viewable by buyer seller admin"
ON public.orders FOR SELECT
USING (
  auth.uid() = buyer_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = orders.id AND p.seller_id = auth.uid()
  )
);
