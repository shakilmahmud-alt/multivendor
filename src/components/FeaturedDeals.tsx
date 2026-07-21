import React, { useState, useEffect } from "react";
import { Clock, Star, ShoppingCart, Eye, Heart, Flame, ShieldCheck, ChevronRight } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from '../supabaseClient';
import { Product } from "../types";
import { ProductCard } from "../App";

interface FeaturedDealsProps {
  products: Product[];
  onAddToCart: (p: Product) => void;
  onAddWishlist: (p: Product) => void;
  onSelectProduct?: (p: Product) => void;
  onQuickView?: (product: Product) => void;
  wishlist?: Product[];
  layoutConfig?: any;
}

export default function FeaturedDeals({ products, onAddToCart, onAddWishlist, onSelectProduct, onQuickView, wishlist, layoutConfig }: FeaturedDealsProps) {
  const navigate = useNavigate();
  const [dbBrands, setDbBrands] = useState<any[]>([]);

  useEffect(() => {
    const fetchBrands = async () => {
      const { data } = await supabase.from('brands').select('*').eq('is_active', true);
      if (data) {
        setDbBrands(data);
      }
    };
    fetchBrands();
  }, []);

  // Filter max 10 products that have a discount applied
  const [flashProductIds, setFlashProductIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchBrands = async () => {
      const { data } = await supabase.from('brands').select('*').eq('is_active', true);
      if (data) {
        setDbBrands(data);
      }
    };
    const fetchFlashProducts = async () => {
      try {
        const { data: activeDeals } = await supabase
          .from('flash_deals')
          .select('id')
          .eq('status', 'active')
          .limit(1);

        if (activeDeals && activeDeals.length > 0) {
          const dealId = activeDeals[0].id;
          const { data: dealProds } = await supabase
            .from('flash_deal_products')
            .select('product_id')
            .eq('flash_deal_id', dealId);

          if (dealProds) {
            setFlashProductIds(dealProds.map((dp: any) => String(dp.product_id)));
          }
        }
      } catch (err) {
        console.error('Error fetching flash deals:', err);
      }
    };
    fetchBrands();
    fetchFlashProducts();
  }, []);

  // Filter products based on layoutConfig or default to flash deal
  let displayProducts = products;

  if (layoutConfig) {
    if (layoutConfig.target_type === 'category' && layoutConfig.target_category) {
      const targetCatId = layoutConfig.target_category;
      displayProducts = products.filter(p => {
        if (targetCatId.startsWith('subsub_')) {
          return String(p.sub_sub_category_id) === targetCatId.replace('subsub_', '');
        } else if (targetCatId.startsWith('sub_')) {
          return String(p.sub_category_id) === targetCatId.replace('sub_', '');
        } else if (targetCatId.startsWith('cat_')) {
          return String(p.category_id) === targetCatId.replace('cat_', '');
        } else {
          return String(p.category_id) === String(targetCatId);
        }
      });
    } else if (layoutConfig.target_type === 'product_type' && layoutConfig.target_product_type) {
      if (layoutConfig.target_product_type === 'featured') {
        displayProducts = products.filter(p => (p as any).isFeatured || (p as any).is_featured);
      } else if (layoutConfig.target_product_type === 'on_sale') {
        displayProducts = products.filter(p => p.oldPrice && p.oldPrice > p.price);
      } else if (layoutConfig.target_product_type === 'new') {
        // Assume last 30 days or just a subset, we'll just slice for now
        displayProducts = products.slice(0, 10); 
      } else {
        // 'all' or fallback
        displayProducts = products.slice(0, 10);
      }
    } else {
      displayProducts = products.slice(0, 10);
    }
  } else {
    displayProducts = products.filter(p => flashProductIds.includes(String(p.id)));
  }

  const title = layoutConfig?.title || "Flash Deals";
  const bannerImage = layoutConfig?.banner_image || "https://ik.imagekit.io/eg7u6xcn0u/Black-Friday.png";

  // Dynamic status feedback
  const [copiedSku, setCopiedSku] = useState<string | null>(null);

  const formatNumber = (num: number) => String(num).padStart(2, "0");

  return (
    <div id="quick-hurry" className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 font-sans">
      <div className="w-full">
        
        {/* Header Row */}
        <div className="flex justify-between items-center mb-4 px-1">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 bg-brand-500 rounded-full"></span>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">{title}</h3>
          </div>
          <Link to="/flash-deals" className="text-[11px] text-brand-600 hover:text-brand-700 font-bold flex items-center gap-0.5 transition cursor-pointer">
            View All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

          {/* Main Content Layout: Banner on Left, Products Scrolling on Right */}
          <div className="flex flex-col md:flex-row gap-5">
            {/* Left side: Banner Image */}
            <div className="hidden md:block w-full md:w-[260px] shrink-0">
              <div className="relative rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition duration-300 h-full min-h-[160px] md:min-h-[340px] border border-slate-200 bg-white">
                <img 
                  src={bannerImage} 
                  alt={title} 
                  className="w-full h-full object-cover hover:scale-102 transition duration-500"
                />
              </div>
            </div>

            {/* Right side: Scrolling Products (marquee scrolling under banner on mobile) */}
            <div className="flex-1 overflow-hidden min-w-0 flex items-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="relative overflow-hidden w-full group/slider rounded-xl">
                <div className="flex gap-4.5 w-max animate-marquee pause-on-hover px-1 py-1">
                  {displayProducts.length > 0 ? (
                    [...displayProducts, ...displayProducts].map((p, idx) => (
                      <div 
                        key={`${p.id}-${idx}`} 
                        className="w-[180px] sm:w-[220px] flex-shrink-0 h-full"
                      >
                        <ProductCard
                          product={p}
                          onAddToCart={onAddToCart}
                          onAddWishlist={onAddWishlist}
                          onQuickView={onQuickView!}
                          onSelectProduct={onSelectProduct}
                          wishlist={wishlist}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-400 text-xs py-12 px-6">
                      No active flash deals products found.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BRANDS / HARDWARE VENDORS LOGO ROW */}
        <div id="brands-sec" className="mt-8 bg-white border border-slate-200 rounded p-4 shadow-xs text-center">
          <div className="flex items-center justify-between pb-2 mb-4 border-b border-slate-200">
            <h3 className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
              Verified Multi-Vendor Power Hubs (Brands)
            </h3>
            <span className="text-[9px] text-slate-400 font-mono">10 Active Stores Map</span>
          </div>

          <div className="relative overflow-hidden w-full group/slider rounded">
            <div className="flex gap-2 w-max animate-marquee pause-on-hover items-center [animation-direction:reverse]">
              {[...dbBrands, ...dbBrands, ...dbBrands].map((brand, idx) => (
                <div 
                  key={`${brand.id || idx}-${idx}`} 
                  onClick={() => navigate(`/brand/${encodeURIComponent(brand.name)}`)}
                  className="w-[120px] flex-shrink-0 p-2 bg-slate-50 hover:bg-white rounded border border-slate-200 hover:border-brand-500 transition text-center shadow-xs cursor-pointer group flex flex-col items-center justify-center min-h-[64px]"
                >
                  {brand.logo_url ? (
                    <img src={brand.logo_url} alt={brand.name} className="h-6 object-contain mb-1 group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="text-[11px] font-black text-slate-700 tracking-tighter group-hover:text-brand-500 transition-colors">
                      {brand.name}
                    </div>
                  )}
                  <div className="text-[7px] uppercase tracking-widest text-[#a1a1aa] font-black mt-0.5">
                    OFFICIAL
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
  );
}
