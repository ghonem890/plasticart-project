CREATE OR REPLACE FUNCTION public.redeem_recycling_points(_user_id uuid, _points integer)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _balance INTEGER;
  _coupon_code TEXT;
  _coupon_id UUID;
BEGIN
  IF _points < 50 THEN
    RAISE EXCEPTION 'Minimum redemption is 50 points';
  END IF;

  SELECT balance INTO _balance FROM recycling_points WHERE user_id = _user_id;
  IF _balance IS NULL OR _balance < _points THEN
    RAISE EXCEPTION 'Insufficient points balance';
  END IF;

  _coupon_code := 'RECYCLE-' || upper(substr(md5(random()::text), 1, 6));

  INSERT INTO coupons (code, discount_type, discount_amount, max_uses, is_active, expires_at, created_by)
  VALUES (_coupon_code, 'fixed', _points, 1, true, now() + interval '90 days', _user_id)
  RETURNING id INTO _coupon_id;

  UPDATE recycling_points
  SET balance = balance - _points,
      total_redeemed = total_redeemed + _points,
      updated_at = now()
  WHERE user_id = _user_id;

  INSERT INTO recycling_redemptions (user_id, points_redeemed, coupon_id)
  VALUES (_user_id, _points, _coupon_id);

  RETURN _coupon_id;
END;
$function$;