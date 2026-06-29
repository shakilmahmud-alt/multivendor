-- ============================================================================
-- SUPABASE / POSTGRESQL MULTI-VENDOR E-COMMERCE DATABASE MIGRATION SCRIPT
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
-- Handles authentication-linked roles (customer, vendor, administrator)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'customer'::text CHECK (role IN ('customer', 'vendor', 'admin')),
    phone TEXT,
    billing_address TEXT,
    shipping_address TEXT
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. STORES / VENDORS TABLE
-- Linked to a vendor profile. Contains public metadata of their digital shop
CREATE TABLE public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    banner_url TEXT,
    description TEXT,
    rating NUMERIC(3,2) DEFAULT 5.00 CHECK (rating >= 0 AND rating <= 5),
    is_verified BOOLEAN DEFAULT false,
    meta_title TEXT,
    meta_description TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- 3. CATEGORIES TABLE
-- Supports hierarchical navigation/nested lists (parent-child self-reference)
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT, -- Lucide icon string fallback
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 4. PRODUCTS TABLE
-- Linked to corresponding store_id and category_id
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    old_price NUMERIC(12,2) CHECK (old_price >= price),
    discount_badge TEXT, -- e.g. '10% Off' or '৳250.00 Off'
    images TEXT[] NOT NULL DEFAULT '{}', -- Array of image URLs
    stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
    sku TEXT UNIQUE,
    is_new BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    rating NUMERIC(3,2) DEFAULT 5.00 CHECK (rating >= 0 AND rating <= 5),
    reviews_count INT DEFAULT 0,
    specifications JSONB DEFAULT '{}'::jsonb, -- Key-value pairs for technical specs
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 5. RLS POLICIES & FUNCTIONS

-- Trigger to automatically handle updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_stores_modtime BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_products_modtime BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Standard select policies accessible to everyone
CREATE POLICY "Allow public select profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public select stores" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Allow public select categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Allow public select products" ON public.products FOR SELECT USING (true);

-- Vendor/Admin modification rules
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Vendors can update their stores" ON public.stores FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Vendors can manage their products" ON public.products FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.stores 
        WHERE stores.id = products.store_id AND stores.owner_id = auth.uid()
    )
);
