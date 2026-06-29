-- Create Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.in_house_products(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE, -- NULL if sold by admin directly, but can be UUID
    rating INT CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    status TEXT DEFAULT 'Published' CHECK (status IN ('Published', 'Hidden')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL ON public.reviews TO anon, authenticated, service_role;
ALTER TABLE public.reviews DISABLE ROW LEVEL SECURITY;
