-- First, drop the old constraint linking orders to profiles
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;

-- Second, add the correct constraint linking orders to customers
ALTER TABLE public.orders ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;

-- Finally, reload the schema cache so Supabase recognizes the new relationship
NOTIFY pgrst, 'reload schema';
