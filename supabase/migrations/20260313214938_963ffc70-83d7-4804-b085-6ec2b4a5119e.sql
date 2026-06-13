
-- Recycling submissions table
CREATE TABLE public.recycling_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mass_kg NUMERIC(10,2) NOT NULL CHECK (mass_kg > 0),
  points_earned INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  address JSONB NOT NULL DEFAULT '{}'::jsonb,
  phone TEXT NOT NULL,
  notes TEXT,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recycling points balance table
CREATE TABLE public.recycling_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_redeemed INTEGER NOT NULL DEFAULT 0,
  balance INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Recycling redemptions table
CREATE TABLE public.recycling_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points_redeemed INTEGER NOT NULL,
  coupon_id UUID NOT NULL REFERENCES public.coupons(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.recycling_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recycling_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recycling_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS: recycling_submissions
CREATE POLICY "Users can insert own submissions"
  ON public.recycling_submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own submissions"
  ON public.recycling_submissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update submissions"
  ON public.recycling_submissions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS: recycling_points
CREATE POLICY "Users can view own points"
  ON public.recycling_points FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own points row"
  ON public.recycling_points FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update points"
  ON public.recycling_points FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- RLS: recycling_redemptions
CREATE POLICY "Users can view own redemptions"
  ON public.recycling_redemptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own redemptions"
  ON public.recycling_redemptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to approve recycling and credit points
CREATE OR REPLACE FUNCTION public.approve_recycling_submission(_submission_id UUID, _admin_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _points INTEGER;
BEGIN
  -- Get submission details
  SELECT user_id, points_earned INTO _user_id, _points
  FROM recycling_submissions
  WHERE id = _submission_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found or already processed';
  END IF;

  -- Update submission status
  UPDATE recycling_submissions
  SET status = 'approved', verified_by = _admin_id, updated_at = now()
  WHERE id = _submission_id;

  -- Upsert points balance
  INSERT INTO recycling_points (user_id, total_earned, balance)
  VALUES (_user_id, _points, _points)
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_earned = recycling_points.total_earned + _points,
    balance = recycling_points.balance + _points,
    updated_at = now();
END;
$$;

-- Function to redeem points into a coupon
CREATE OR REPLACE FUNCTION public.redeem_recycling_points(_user_id UUID, _points INTEGER)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _balance INTEGER;
  _coupon_code TEXT;
  _coupon_id UUID;
BEGIN
  IF _points < 50 THEN
    RAISE EXCEPTION 'Minimum redemption is 50 points';
  END IF;

  -- Check balance
  SELECT balance INTO _balance FROM recycling_points WHERE user_id = _user_id;
  IF _balance IS NULL OR _balance < _points THEN
    RAISE EXCEPTION 'Insufficient points balance';
  END IF;

  -- Generate unique coupon code
  _coupon_code := 'RECYCLE-' || upper(substr(md5(random()::text), 1, 6));

  -- Create coupon (1 point = 1 EGP, fixed discount, single use, 90 day expiry)
  INSERT INTO coupons (code, discount_type, discount_amount, max_uses, is_active, expires_at)
  VALUES (_coupon_code, 'fixed', _points, 1, true, now() + interval '90 days')
  RETURNING id INTO _coupon_id;

  -- Deduct points
  UPDATE recycling_points
  SET balance = balance - _points,
      total_redeemed = total_redeemed + _points,
      updated_at = now()
  WHERE user_id = _user_id;

  -- Record redemption
  INSERT INTO recycling_redemptions (user_id, points_redeemed, coupon_id)
  VALUES (_user_id, _points, _coupon_id);

  RETURN _coupon_id;
END;
$$;
