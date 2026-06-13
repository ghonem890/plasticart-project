
-- Returns display_name + phone for a list of users — admins only
CREATE OR REPLACE FUNCTION public.admin_get_user_contacts(_user_ids uuid[])
RETURNS TABLE(user_id uuid, display_name text, phone text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.display_name, p.phone
  FROM public.profiles p
  WHERE p.user_id = ANY(_user_ids)
    AND public.has_role(auth.uid(), 'admin');
$$;
REVOKE EXECUTE ON FUNCTION public.admin_get_user_contacts(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_get_user_contacts(uuid[]) TO authenticated;

-- Returns the buyer's display_name+phone for an order, allowed if caller is:
-- the buyer themselves, an admin, or a seller of any product in the order.
CREATE OR REPLACE FUNCTION public.get_order_buyer_contact(_order_id uuid)
RETURNS TABLE(display_name text, phone text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.display_name, p.phone
  FROM public.orders o
  JOIN public.profiles p ON p.user_id = o.buyer_id
  WHERE o.id = _order_id
    AND (
      o.buyer_id = auth.uid()
      OR public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1 FROM public.order_items oi
        JOIN public.products pr ON pr.id = oi.product_id
        WHERE oi.order_id = o.id AND pr.seller_id = auth.uid()
      )
    );
$$;
REVOKE EXECUTE ON FUNCTION public.get_order_buyer_contact(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_order_buyer_contact(uuid) TO authenticated;
