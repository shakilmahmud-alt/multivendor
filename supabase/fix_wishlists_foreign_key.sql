-- Drop the old incorrect constraint linking wishlists to public.products table
ALTER TABLE public.wishlists DROP CONSTRAINT IF EXISTS wishlists_product_id_fkey;

-- Add the correct constraint linking wishlists to public.in_house_products table
ALTER TABLE public.wishlists ADD CONSTRAINT wishlists_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.in_house_products(id) ON DELETE CASCADE;

-- Reload the schema cache for Supabase REST API
NOTIFY pgrst, 'reload schema';
