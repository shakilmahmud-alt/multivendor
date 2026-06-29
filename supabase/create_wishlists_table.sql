CREATE TABLE public.wishlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    product_id UUID REFERENCES public.in_house_products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, product_id)
);

GRANT ALL ON public.wishlists TO anon, authenticated, service_role;
ALTER TABLE public.wishlists DISABLE ROW LEVEL SECURITY;
