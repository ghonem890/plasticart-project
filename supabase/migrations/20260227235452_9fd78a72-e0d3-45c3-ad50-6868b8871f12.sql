
-- Drop existing restrictive SELECT policies on orders and order_items
DROP POLICY IF EXISTS "Orders viewable by buyer seller admin" ON public.orders;
DROP POLICY IF EXISTS "Order items viewable" ON public.order_items;

-- Recreate as PERMISSIVE SELECT policies
CREATE POLICY "Orders viewable by buyer seller admin"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    (auth.uid() = buyer_id)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR (id IN (SELECT get_seller_order_ids(auth.uid())))
  );

CREATE POLICY "Order items viewable"
  ON public.order_items FOR SELECT
  TO authenticated
  USING (
    (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.buyer_id = auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
    OR (EXISTS (SELECT 1 FROM products WHERE products.id = order_items.product_id AND products.seller_id = auth.uid()))
  );

-- Also make payments viewable by sellers related to the order
DROP POLICY IF EXISTS "Payment viewable" ON public.payments;

CREATE POLICY "Payment viewable"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    (EXISTS (SELECT 1 FROM orders WHERE orders.id = payments.order_id AND orders.buyer_id = auth.uid()))
    OR has_role(auth.uid(), 'admin'::app_role)
    OR (EXISTS (SELECT 1 FROM orders WHERE orders.id = payments.order_id AND orders.id IN (SELECT get_seller_order_ids(auth.uid()))))
  );
