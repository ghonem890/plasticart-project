-- Fix: Re-grant execute on get_seller_order_ids to authenticated
-- This was revoked in migration 20260613132305 but is still used by order RLS policies
GRANT EXECUTE ON FUNCTION public.get_seller_order_ids(uuid) TO authenticated;
