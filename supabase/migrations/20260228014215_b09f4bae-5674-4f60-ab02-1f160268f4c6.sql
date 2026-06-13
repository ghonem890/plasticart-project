-- Add foreign key from reviews.buyer_id to profiles.user_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'reviews_buyer_id_profiles_fkey'
  ) THEN
    ALTER TABLE public.reviews 
    ADD CONSTRAINT reviews_buyer_id_profiles_fkey 
    FOREIGN KEY (buyer_id) REFERENCES public.profiles(user_id);
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';