import React, { useState, useEffect } from "react";
import { Clock, Star, ShoppingCart, Eye, Heart, Flame, ShieldCheck, ChevronRight } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from '../supabaseClient';
import { Product } from "../types";

interface FeaturedDealsProps {
  products: Product[];
  onAddToCart: (p: Product) => void;
  onAddWishlist: (p: Product) => void;
  onSelectProduct?: (p: Product) => void;
  onQuickView?: (product: Product) => void;
  wishlist?: Product[];
}

export default function FeaturedDeals({ products, onAddToCart, onAddWishlist, onSelectProduct, onQuickView, wishlist }: FeaturedDealsProps) {
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

  // Filter products that belong to the active flash deal only
  const flashProducts = products.filter(p => flashProductIds.includes(String(p.id)));

  // Dynamic status feedback
  const [copiedSku, setCopiedSku] = useState<string | null>(null);

  const formatNumber = (num: number) => String(num).padStart(2, "0");

  return (
    <div id="quick-hurry" className="w-full max-w-7xl mx-auto px-4 py-4 font-sans">
      <div className="w-full">
        
        {/* Header Row */}
        <div className="flex justify-between items-center mb-4 px-1">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-5 bg-orange-500 rounded-full"></span>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Flash Deals</h3>
          </div>
          <Link to="/flash-deals" className="text-[11px] text-orange-600 hover:text-orange-700 font-bold flex items-center gap-0.5 transition cursor-pointer">
            View All <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

          {/* Main Content Layout: Banner on Left, Products Scrolling on Right */}
          <div className="flex flex-col md:flex-row gap-5">
            {/* Left side: Banner Image */}
            <div className="hidden md:block w-full md:w-[260px] shrink-0">
              <div className="relative rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition duration-300 h-full min-h-[160px] md:min-h-[340px] border border-slate-200 bg-white">
                <img 
                  src="https://ik.imagekit.io/eg7u6xcn0u/Black-Friday.png" 
                  alt="Black Friday Flash Deal" 
                  className="w-full h-full object-cover hover:scale-102 transition duration-500"
                />
              </div>
            </div>

            {/* Right side: Scrolling Products (marquee scrolling under banner on mobile) */}
            <div className="flex-1 overflow-hidden min-w-0 flex items-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="relative overflow-hidden w-full group/slider rounded-xl">
                <div className="flex gap-4.5 w-max animate-marquee pause-on-hover px-1 py-1">
                  {flashProducts.length > 0 ? (
                    [...flashProducts, ...flashProducts].map((p, idx) => (
                      <div 
                        key={`${p.id}-${idx}`} 
                        className="w-[180px] sm:w-[220px] flex-shrink-0 whitespace-normal group bg-white flex flex-col justify-between relative cursor-pointer"
                      >
                        {/* Card Promo badges */}
                        <div className="absolute top-2.5 left-2.5 z-10">
                          <span className="bg-orange-500 text-white font-mono font-black text-[9px] px-2 py-0.5 rounded shadow-sm">
                            {p.discountBadge || "Flash"}
                          </span>
                        </div>

                        {/* Thumbnail */}
                        <div 
                          onClick={() => onSelectProduct?.(p)}
                          className="relative aspect-square rounded overflow-hidden mb-3 bg-white flex items-center justify-center border border-slate-100 p-2 cursor-pointer"
                        >
                          <img 
                            src={p.thumbnail} 
                            alt={p.title} 
                            className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                          />
                          {/* Hover widgets */}
                          <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddWishlist(p);
                              }}
                              className={`p-1.5 rounded-full border transition shadow-xs cursor-pointer ${
                                wishlist?.some(item => item.id === p.id)
                                  ? "bg-[#ff6a00] border-[#ff6a00] text-white"
                                  : "bg-white/95 border-slate-200 text-slate-700 hover:text-orange-500 hover:border-orange-500"
                              }`}
                            >
                              <Heart className={`w-3 h-3 ${wishlist?.some(item => item.id === p.id) ? "fill-white" : ""}`} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onQuickView?.(p);
                              }}
                              className="p-1.5 bg-white/95 border border-slate-200 rounded-full text-slate-700 hover:text-orange-500 hover:border-orange-500 transition shadow-xs cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Info Metadata */}
                        <div className="flex-1 flex flex-col justify-between px-1">
                          <div>
                            <span className="text-[8px] text-slate-400 font-extrabold block uppercase font-mono tracking-wider">{p.category}</span>
                            <h4 
                              onClick={() => onSelectProduct?.(p)}
                              className="text-[11px] font-black text-slate-800 line-clamp-2 mt-1 hover:text-orange-600 transition min-h-[30px] leading-tight cursor-pointer"
                            >
                              {p.title}
                            </h4>
                            {/* review count info */}
                            {p.reviewCount > 0 && (
                              <div className="flex items-center gap-1 mt-1.5">
                                <div className="flex">
                                  {[...Array(5)].map((_, idx) => (
                                    <Star 
                                      key={idx} 
                                      className={`w-2.5 h-2.5 ${idx < Math.round(p.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} 
                                    />
                                  ))}
                                </div>
                                <span className="text-[9px] text-slate-400">({p.reviewCount})</span>
                              </div>
                            )}
                          </div>

                          <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                            <div className="text-left">
                              <p className="text-sm font-black text-slate-900 leading-none">৳{p.price.toLocaleString()}</p>
                              {p.oldPrice && (
                                <p className="text-[10px] text-slate-400 line-through mt-0.5">৳{p.oldPrice.toLocaleString()}</p>
                              )}
                            </div>
                            <button 
                              onClick={() => onAddToCart(p)}
                              className="p-1.5 bg-orange-50 hover:bg-orange-500 border border-orange-200 hover:border-orange-500 rounded-lg text-orange-500 hover:text-white transition cursor-pointer shadow-xs"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
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
              <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
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
                  className="w-[120px] flex-shrink-0 p-2 bg-slate-50 hover:bg-white rounded border border-slate-200 hover:border-orange-500 transition text-center shadow-xs cursor-pointer group flex flex-col items-center justify-center min-h-[64px]"
                >
                  {brand.logo_url ? (
                    <img src={brand.logo_url} alt={brand.name} className="h-6 object-contain mb-1 group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="text-[11px] font-black text-slate-700 tracking-tighter group-hover:text-orange-500 transition-colors">
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
