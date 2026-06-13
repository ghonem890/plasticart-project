-- Backfill slugs by touching title_en to fire the trigger
UPDATE public.products SET title_en = title_en;