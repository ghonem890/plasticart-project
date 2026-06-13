
DROP POLICY IF EXISTS "Order updates" ON public.orders;

CREATE POLICY "Order updates by buyer seller admin"
ON public.orders FOR UPDATE
USING (
  auth.uid() = buyer_id
  OR has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (
    SELECT 1 FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = orders.id AND p.seller_id = auth.uid()
  )
);
