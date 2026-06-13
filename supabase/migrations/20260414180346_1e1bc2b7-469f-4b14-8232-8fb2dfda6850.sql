
-- Add slug column to seller_profiles
ALTER TABLE public.seller_profiles ADD COLUMN slug text UNIQUE;

-- Create function to generate seller slug from business_name
CREATE OR REPLACE FUNCTION public.generate_seller_slug()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  base_slug := lower(regexp_replace(trim(NEW.business_name), '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);

  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := NEW.id::text;
  END IF;

  final_slug := base_slug;

  LOOP
    IF NOT EXISTS (SELECT 1 FROM seller_profiles WHERE slug = final_slug AND id != NEW.id) THEN
      EXIT;
    END IF;
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;

-- Create trigger for new inserts and business_name updates
CREATE TRIGGER set_seller_slug
BEFORE INSERT OR UPDATE OF business_name ON public.seller_profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_seller_slug();

-- Backfill existing rows by touching business_name
UPDATE public.seller_profiles SET business_name = business_name;
