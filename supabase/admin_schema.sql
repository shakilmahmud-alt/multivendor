-- Admin Dashboard Tracking & Extension Tables

-- Create foundational Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'vendor', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL ON public.profiles TO anon, authenticated, service_role;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Table to track overall system statistics (Admin Wallet & Analytics)
CREATE TABLE public.admin_wallet (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_sales NUMERIC(12,2) DEFAULT 0,
    total_stores INT DEFAULT 0,
    total_products INT DEFAULT 0,
    total_customers INT DEFAULT 0,
    
    in_house_earning NUMERIC(12,2) DEFAULT 0,
    commission_earned NUMERIC(12,2) DEFAULT 0,
    delivery_charge_earned NUMERIC(12,2) DEFAULT 0,
    total_tax_collected NUMERIC(12,2) DEFAULT 0,
    pending_amount NUMERIC(12,2) DEFAULT 0,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table for Orders
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'packaging', 'out_for_delivery', 'delivered', 'canceled', 'returned', 'failed');

CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    status order_status DEFAULT 'pending',
    payment_status TEXT DEFAULT 'unpaid',
    payment_method TEXT DEFAULT 'cash',
    source TEXT DEFAULT 'website',
    items JSONB DEFAULT '[]'::jsonb,
    delivery_type TEXT,
    delivery_man_id UUID REFERENCES public.delivery_men(id) ON DELETE SET NULL,
    deliveryman_fee NUMERIC(12,2) DEFAULT 0,
    expected_delivery_date DATE,
    third_party_courier TEXT,
    tracking_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL ON public.orders TO anon, authenticated, service_role;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- Table for Delivery Men
CREATE TABLE public.delivery_men (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    total_delivered INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

GRANT ALL ON public.delivery_men TO anon, authenticated, service_role;
ALTER TABLE public.delivery_men DISABLE ROW LEVEL SECURITY;

-- Table for Refund Requests
CREATE TABLE public.refund_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'refunded', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL ON public.refund_requests TO anon, authenticated, service_role;
ALTER TABLE public.refund_requests DISABLE ROW LEVEL SECURITY;

-- Categories Tables
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    priority INT CHECK (priority >= 1 AND priority <= 10),
    image_url TEXT,
    is_home_category BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.sub_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    priority INT CHECK (priority >= 1 AND priority <= 10),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.sub_sub_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sub_category_id UUID REFERENCES public.sub_categories(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    priority INT CHECK (priority >= 1 AND priority <= 10),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL ON public.categories TO anon, authenticated, service_role;
GRANT ALL ON public.sub_categories TO anon, authenticated, service_role;
GRANT ALL ON public.sub_sub_categories TO anon, authenticated, service_role;

ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_sub_categories DISABLE ROW LEVEL SECURITY;

-- Table for Monthly Earning Statistics
CREATE TABLE public.earning_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month_year TEXT NOT NULL UNIQUE, -- e.g. "2026-06"
    in_house_earning NUMERIC(12,2) DEFAULT 0,
    vendor_earning NUMERIC(12,2) DEFAULT 0,
    commission_earning NUMERIC(12,2) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table for Suppliers
CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL ON public.suppliers TO anon, authenticated, service_role;

-- Disable RLS for ease of use in prototype, or create permissive policies
ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY;

-- If RLS is strictly required, you can run these instead:
-- CREATE POLICY "Allow public read" ON public.suppliers FOR SELECT USING (true);
-- CREATE POLICY "Allow public insert" ON public.suppliers FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow public update" ON public.suppliers FOR UPDATE USING (true);
-- CREATE POLICY "Allow public delete" ON public.suppliers FOR DELETE USING (true);

-- Table for Purchases
DROP TABLE IF EXISTS public.purchases CASCADE;

CREATE TABLE public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Received', 'Pending', 'Ordered')),
    purchase_date DATE NOT NULL,
    reference_no TEXT,
    product_name TEXT,
    qty INTEGER DEFAULT 1,
    unit_price NUMERIC(12,2) DEFAULT 0,
    payment_amount NUMERIC(12,2) NOT NULL,
    payment_type TEXT DEFAULT 'Cash' CHECK (payment_type IN ('Cash', 'Bank')),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL ON public.purchases TO anon, authenticated, service_role;

ALTER TABLE public.purchases DISABLE ROW LEVEL SECURITY;

-- Brands Table
CREATE TABLE public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    total_product INT DEFAULT 0,
    total_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL ON public.brands TO anon, authenticated, service_role;
ALTER TABLE public.brands DISABLE ROW LEVEL SECURITY;

-- Product Attributes Table
CREATE TABLE public.product_attributes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL ON public.product_attributes TO anon, authenticated, service_role;
ALTER TABLE public.product_attributes DISABLE ROW LEVEL SECURITY;

-- In-House Products Table
CREATE TABLE public.in_house_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en TEXT NOT NULL,
    name_bd TEXT,
    desc_en TEXT,
    desc_bd TEXT,
    short_desc_en TEXT,
    short_desc_bd TEXT,
    category_id UUID,
    sub_category_id UUID,
    sub_sub_category_id UUID,
    brand_id UUID REFERENCES public.brands(id) ON DELETE SET NULL,
    product_type TEXT DEFAULT 'Physical',
    sku TEXT,
    unit TEXT,
    search_tags TEXT,
    purchase_price NUMERIC(12,2) DEFAULT 0,
    unit_price NUMERIC(12,2) DEFAULT 0,
    minimum_order_qty INT DEFAULT 1,
    current_stock_qty INT DEFAULT 0,
    discount_type TEXT DEFAULT 'Flat',
    discount_amount NUMERIC(12,2) DEFAULT 0,
    tax_amount NUMERIC(12,2) DEFAULT 0,
    tax_calculation TEXT DEFAULT 'Include with product',
    shipping_cost NUMERIC(12,2) DEFAULT 0,
    shipping_multiply BOOLEAN DEFAULT false,
    colors TEXT,
    attributes JSONB,
    thumbnail_url TEXT,
    additional_images JSONB,
    video_link TEXT,
    meta_title TEXT,
    meta_description TEXT,
    meta_image TEXT,
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    slug TEXT UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL ON public.in_house_products TO anon, authenticated, service_role;
ALTER TABLE public.in_house_products DISABLE ROW LEVEL SECURITY;

-- Table for Vendors / Sellers
CREATE TABLE public.sellers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    seller_image_url TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    shop_name TEXT NOT NULL,
    shop_address TEXT NOT NULL,
    shop_logo_url TEXT,
    shop_banner_url TEXT,
    status TEXT DEFAULT 'Inactive' CHECK (status IN ('Active', 'Inactive', 'Pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL ON public.sellers TO anon, authenticated, service_role;
ALTER TABLE public.sellers DISABLE ROW LEVEL SECURITY;

-- Table for Customers
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    password TEXT NOT NULL,
    refer_code TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL ON public.customers TO anon, authenticated, service_role;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;

-- Table for Super Admins
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL ON public.admins TO anon, authenticated, service_role;
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;

-- Insert default Super Admin
INSERT INTO public.admins (email, password) 
VALUES ('msmraqeeb@gmail.com', 'msm039raqeeb')
ON CONFLICT (email) DO NOTHING;

-- Table for Products (for dynamic dashboard stats)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL ON public.products TO anon, authenticated, service_role;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

-- Table for Orders (for dynamic dashboard stats)
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE,
    total_amount DECIMAL(10, 2) NOT NULL,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processing', 'Completed', 'Cancelled', 'Refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL ON public.orders TO anon, authenticated, service_role;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- Notifications Table (for Admin and Sellers)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_role TEXT NOT NULL CHECK (target_role IN ('admin', 'seller')),
    target_user_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE, -- Nullable if it's for all admins
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    link TEXT, -- Optional link to redirect user when clicked
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL ON public.notifications TO anon, authenticated, service_role;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;

-- Support Messages Table
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    message TEXT NOT NULL,
    reply TEXT,
    seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL ON public.support_messages TO anon, authenticated, service_role;
ALTER TABLE public.support_messages DISABLE ROW LEVEL SECURITY;

-- Support Tickets Table
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT NOT NULL,
    type TEXT NOT NULL,
    priority TEXT NOT NULL,
    description TEXT NOT NULL,
    attachments JSONB,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Closed')),
    reply TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

GRANT ALL ON public.support_tickets TO anon, authenticated, service_role;
ALTER TABLE public.support_tickets DISABLE ROW LEVEL SECURITY;