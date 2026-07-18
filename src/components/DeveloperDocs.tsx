import React, { useState } from "react";
import { Copy, Check, Database, Palette, Code, Terminal, BadgeCheck } from "lucide-react";

export default function DeveloperDocs() {
  const [activeTab, setActiveTab] = useState<"design" | "nextjs" | "supabase">("design");
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopied(identifier);
    setTimeout(() => setCopied(null), 2500);
  };

  const nextJsCodeTopNav = `// components/TopNavigation.tsx
import React, { useState } from 'react';
import { Search, MapPin, Heart, ShoppingCart, User, Phone, Globe, ChevronDown, Menu } from 'lucide-react';

export default function TopNavigation() {
  return (
    <div className="w-full bg-slate-900 text-white font-sans text-xs">
      {/* Upper Utility Bar */}
      <div className="w-full mx-auto px-4 py-2 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-4 text-slate-300">
          <span className="flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-brand-500" /> +8801784905075
          </span>
          <span className="hidden md:inline bg-brand-600/20 text-brand-400 px-2 py-0.5 rounded text-[10px] font-semibold animate-pulse">
            EID OFFER DISCOUNT PRICE COMING SOON
          </span>
        </div>
        <div className="flex items-center gap-4 text-slate-300">
          <div className="flex items-center gap-1 cursor-pointer hover:text-white">
            <span>BDT ৳</span> <ChevronDown className="w-3 h-3" />
          </div>
          <div className="flex items-center gap-1 cursor-pointer hover:text-white">
            <span>English</span> <ChevronDown className="w-3 h-3" />
          </div>
          <a href="#seller-zone" className="hover:text-brand-400 font-medium text-brand-500 transition">Seller Zone</a>
        </div>
      </div>

      {/* Main Header */}
      <div className="bg-slate-950 px-4 py-4 border-b border-slate-800">
        <div className="w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="bg-brand-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-lg tracking-wider font-mono">
              HOLIDAYMART
            </div>
            <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest hidden lg:block">Multi-Vendor</span>
          </div>

          {/* Search Bar with category prefix dropdown */}
          <div className="w-full md:max-w-xl flex items-center bg-slate-800 border border-slate-700 rounded-lg overflow-hidden focus-within:border-brand-500 transition">
            <select className="bg-slate-700 text-white text-xs px-3 py-2.5 outline-none font-medium border-r border-slate-600 cursor-pointer text-ellipsis max-w-[120px]">
              <option>All Categories</option>
              <option>T-Shirt</option>
              <option>Laptop</option>
              <option>Appliances</option>
            </select>
            <input 
              type="text" 
              placeholder="Search products, brands, or multi-vendor shops..." 
              className="flex-1 bg-transparent px-4 py-2 text-sm text-white placeholder-slate-400 outline-none"
            />
            <button className="bg-brand-500 hover:bg-brand-600 text-slate-950 px-6 py-2.5 font-bold transition flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
            </button>
          </div>

          {/* Quick Stats / Account */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="relative p-2 bg-slate-850 rounded-full border border-slate-800 hover:border-slate-700">
                <Heart className="w-5 h-5 text-slate-300 group-hover:text-brand-400 transition" />
                <span className="absolute -top-1 -right-1 bg-brand-500 text-slate-950 text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">0</span>
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-[10px] text-slate-400">Wishlist</p>
                <p className="text-xs font-semibold">Favorites</p>
              </div>
            </div>

            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="p-2 bg-slate-850 rounded-full border border-slate-800 hover:border-slate-700">
                <User className="w-5 h-5 text-slate-300 group-hover:text-brand-400 transition" />
              </div>
              <div className="text-left hidden lg:block text-slate-200">
                <p className="text-[10px] text-slate-400">Account</p>
                <p className="text-xs font-semibold">Register/Login</p>
              </div>
            </div>

            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="relative p-2 bg-slate-850 rounded-full border border-slate-800 hover:border-slate-700">
                <ShoppingCart className="w-5 h-5 text-slate-300 group-hover:text-brand-400 transition" />
                <span className="absolute -top-1 -right-1 bg-brand-500 text-slate-950 text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">0</span>
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-[10px] text-slate-400">My Cart</p>
                <p className="text-xs font-semibold text-brand-400">৳0.00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`;

  const nextJsCodeProductGrid = `// components/ProductGridSection.tsx
import React from 'react';
import { Star, ShoppingCart, Eye, Heart } from 'lucide-react';

interface Product {
  id: string;
  title: string;
  thumbnail: string;
  price: number;
  oldPrice?: number;
  discountBadge?: string;
  rating: number;
  reviewCount: number;
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition duration-300 flex flex-col h-full relative">
      {/* Image Block */}
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        <img 
          src={product.thumbnail} 
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-350"
        />
        
        {/* Promos / Sale Badges */}
        {product.discountBadge && (
          <div className="absolute top-2 left-2 bg-brand-500 text-white font-bold text-[10px] px-2 py-1 rounded shadow-sm">
            {product.discountBadge}
          </div>
        )}

        {/* Quick hover widgets */}
        <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button className="p-1.5 bg-white/90 rounded-full text-slate-700 hover:bg-brand-500 hover:text-white transition shadow">
            <Heart className="w-3.5 h-3.5" />
          </button>
          <button className="p-1.5 bg-white/90 rounded-full text-slate-700 hover:bg-brand-500 hover:text-white transition shadow">
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Details Box */}
      <div className="p-3 flex flex-col flex-1">
        {/* Product Title */}
        <h3 className="text-xs font-medium text-slate-800 line-clamp-2 min-h-[32px] group-hover:text-brand-600 transition">
          {product.title}
        </h3>

        {/* Review Stars */}
        <div className="flex items-center gap-1 mt-1.5">
          <div className="flex">
            {[...Array(5)].map((_, idx) => (
              <Star 
                key={idx} 
                className={\`w-3 h-3 \${idx < Math.floor(product.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}\`} 
              />
            ))}
          </div>
          <span className="text-[10px] text-slate-450">({product.reviewCount})</span>
        </div>

        {/* Value Tag / CTA */}
        <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
          <div className="text-left">
            <p className="text-sm font-bold text-slate-900">৳{product.price.toLocaleString()}</p>
            {product.oldPrice && (
              <p className="text-[10px] text-slate-400 line-through">৳{product.oldPrice.toLocaleString()}</p>
            )}
          </div>
          <button className="p-2 bg-brand-50 hover:bg-brand-500 rounded-lg text-brand-500 hover:text-white transition shadow-sm">
            <ShoppingCart className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}`;

  const supabaseCode = `-- Create Tables for HolidayMart Multi-Vendor
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'vendor', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    is_verified BOOLEAN DEFAULT false,
    rating NUMERIC(3,2) DEFAULT 5.00
);

CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL
);

CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    sku TEXT UNIQUE,
    price NUMERIC(12,2) NOT NULL,
    old_price NUMERIC(12,2),
    images TEXT[] NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);`;

  return (
    <div id="developer-docs-panel" className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl mb-8 font-sans">
      <div className="bg-gradient-to-r from-slate-950 to-slate-900 px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-brand-500/15 p-2 rounded-xl border border-brand-500/30">
            <Terminal className="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              HOLIDAYMART CLONE SOURCE SPECS <span className="bg-brand-500/20 text-brand-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">DEV CONSOLE</span>
            </h2>
            <p className="text-xs text-slate-400">Part 1, 2, and 3 specs matching the JPEG capturing</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-905 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab("design")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === "design" ? "bg-brand-500 text-slate-950" : "text-slate-350 hover:text-white"
            }`}
          >
            <Palette className="w-3.5 h-3.5" /> Design Tokens (Part 1)
          </button>
          <button
            onClick={() => setActiveTab("nextjs")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === "nextjs" ? "bg-brand-500 text-slate-950" : "text-slate-350 hover:text-white"
            }`}
          >
            <Code className="w-3.5 h-3.5" /> Next.js 14 Code (Part 2)
          </button>
          <button
            onClick={() => setActiveTab("supabase")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
              activeTab === "supabase" ? "bg-brand-500 text-slate-950" : "text-slate-350 hover:text-white"
            }`}
          >
            <Database className="w-3.5 h-3.5" /> Supabase Schema (Part 3)
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* DESIGN TOKENS TAB */}
        {activeTab === "design" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn text-slate-300">
            {/* Color Palette Card */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-800">
                <span className="text-brand-500 font-bold">1.</span>
                <h4 className="text-white font-bold text-sm">Design Color Tokens</h4>
              </div>
              <ul className="space-y-3.5 text-xs">
                <li className="flex items-center justify-between">
                  <span>Primary Brand Color</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-200">brand-500 (Amber)</span>
                    <span className="w-4 h-4 rounded bg-brand-500 block border border-white/20"></span>
                  </div>
                </li>
                <li className="flex items-center justify-between">
                  <span>Top Utility Banner</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-200">#0D1524 (Navy Blue/Dark)</span>
                    <span className="w-4 h-4 rounded bg-[#0D1524] block border border-white/20"></span>
                  </div>
                </li>
                <li className="flex items-center justify-between">
                  <span>Primary Nav Buttons</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-200">#EA580C (Orange-600)</span>
                    <span className="w-4 h-4 rounded bg-brand-600 block border border-white/20"></span>
                  </div>
                </li>
                <li className="flex items-center justify-between">
                  <span>Card Backgrounds</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-200">#FFFFFF / #F8FAFC</span>
                    <span className="w-4 h-4 rounded bg-white block border border-slate-400"></span>
                  </div>
                </li>
                <li className="flex items-center justify-between">
                  <span>Text Slashes / Old Price</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-200">#94A3B8 (Slate)</span>
                    <span className="w-4 h-4 rounded bg-[#94A3B8] block border border-white/20"></span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Layout Grid Specifications */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-800">
                <span className="text-brand-500 font-bold">2.</span>
                <h4 className="text-white font-bold text-sm">Visual Layout Grid</h4>
              </div>
              <ul className="space-y-3.5 text-xs text-slate-300">
                <li className="flex justify-between">
                  <span className="text-slate-400 font-semibold text-[11px]">Desktop Layout</span>
                  <span className="text-slate-250">Max Container <strong>1280px (w-full w-full)</strong></span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400 font-semibold text-[11px]">Product Grid</span>
                  <span className="text-slate-250">6-Column Dense Card Slider Grid on XL sizes Desktop</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400 font-semibold text-[11px]">Side Gutters</span>
                  <span className="text-slate-250">Flexible padding <strong>px-4 (16px) left-right</strong></span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400 font-semibold text-[11px]">Item Intervallum</span>
                  <span className="text-slate-250">Grid gap <strong>gap-2 md:gap-4</strong></span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400 font-semibold text-[11px]">Trust Row</span>
                  <span className="text-slate-250">Horizontal grid <strong>sm:grid-cols-3 lg:grid-cols-6</strong></span>
                </li>
              </ul>
            </div>

            {/* Typography Strategy */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-slate-800">
                <span className="text-brand-500 font-bold">3.</span>
                <h4 className="text-white font-bold text-sm">Typography Framework</h4>
              </div>
              <ul className="space-y-3.5 text-xs text-slate-300">
                <li className="flex justify-between">
                  <span className="text-slate-400 font-semibold text-[11px]">Primary Fonts</span>
                  <span className="text-slate-250 font-mono">"Inter", sans-serif</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400 font-semibold text-[11px]">Price Text size</span>
                  <span className="text-slate-250">Bold font scale <strong>text-sm to text-base</strong></span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400 font-semibold text-[11px]">Display Headings</span>
                  <span className="text-slate-250 uppercase text-[10px] tracking-widest text-brand-500">Medium Bold Tracking-tight</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-slate-400 font-semibold text-[11px]">Section Headers</span>
                  <span className="text-slate-250 font-bold">Orange highlights, bordered row header tabs</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* NEXT.JS TSX TAB */}
        {activeTab === "nextjs" && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-xs font-semibold uppercase bg-slate-800 px-3 py-1 rounded">TopNavigation.tsx</span>
                <button
                  onClick={() => handleCopy(nextJsCodeTopNav, "topnav")}
                  className="flex items-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 text-brand-400 hover:text-brand-300 px-3 py-1.5 rounded transition"
                >
                  {copied === "topnav" ? <BadgeCheck className="w-4 h-4 text-emerald-450" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === "topnav" ? "Copied!" : "Copy TopNav Code"}
                </button>
              </div>
              <pre className="bg-slate-950 text-slate-300 text-xs p-4 rounded-lg overflow-x-auto max-h-[250px] border border-slate-800 font-mono">
                <code>{nextJsCodeTopNav}</code>
              </pre>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white text-xs font-semibold uppercase bg-slate-800 px-3 py-1 rounded">ProductGridSection.tsx</span>
                <button
                  onClick={() => handleCopy(nextJsCodeProductGrid, "prodgrid")}
                  className="flex items-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 text-brand-400 hover:text-brand-300 px-3 py-1.5 rounded transition"
                >
                  {copied === "prodgrid" ? <BadgeCheck className="w-4 h-4 text-emerald-450" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === "prodgrid" ? "Copied!" : "Copy Product Specs"}
                </button>
              </div>
              <pre className="bg-slate-950 text-slate-300 text-xs p-4 rounded-lg overflow-x-auto max-h-[250px] border border-slate-800 font-mono">
                <code>{nextJsCodeProductGrid}</code>
              </pre>
            </div>
          </div>
        )}

        {/* SUPABASE SQL TAB */}
        {activeTab === "supabase" && (
          <div className="animate-fadeIn space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400 font-sans">
                PostgreSQL SQL rules to bootstrap tables automatically directly inside your Supabase SQL editor.
              </p>
              <button
                onClick={() => handleCopy(supabaseCode, "supabasesql")}
                className="flex items-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 text-brand-400 hover:text-brand-300 px-3 py-1.5 rounded transition"
              >
                {copied === "supabasesql" ? <BadgeCheck className="w-4 h-4 text-emerald-450" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === "supabasesql" ? "Copied SQL" : "Copy Schema SQL"}
              </button>
            </div>
            <pre className="bg-slate-950 text-slate-300 text-xs p-4 rounded-lg overflow-x-auto max-h-[350px] border border-slate-800 font-mono">
              <code>{supabaseCode}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
