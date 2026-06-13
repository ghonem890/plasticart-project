
-- Add slug column
ALTER TABLE public.products ADD COLUMN slug text;

-- Create unique index
CREATE UNIQUE INDEX idx_products_slug ON public.products (slug);

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION public.generate_product_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Generate base slug from title_en
  base_slug := lower(regexp_replace(trim(NEW.title_en), '[^a-zA-Z0-9\s-]', '', 'g'));
  base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
  base_slug := regexp_replace(base_slug, '-+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- If empty, use id
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := NEW.id::text;
  END IF;
  
  final_slug := base_slug;
  
  -- Handle uniqueness
  LOOP
    IF NOT EXISTS (SELECT 1 FROM products WHERE slug = final_slug AND id != NEW.id) THEN
      EXIT;
    END IF;
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$;

-- Trigger on insert and update of title
CREATE TRIGGER set_product_slug
BEFORE INSERT OR UPDATE OF title_en ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.generate_product_slug();

-- Backfill existing products
UPDATE public.products SET slug = NULL;
