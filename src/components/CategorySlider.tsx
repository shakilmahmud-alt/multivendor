import React, { useRef } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Product } from "../types";

interface CategorySliderProps {
  title: string;
  categorySlug: string;
  products: Product[];
  onSelectProduct?: (p: Product) => void;
  indicatorColor?: string;
}

export default function CategorySlider({ title, categorySlug, products, onSelectProduct, indicatorColor }: CategorySliderProps) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Show max 10 products
  const displayProducts = products.slice(0, 10);
  
  if (displayProducts.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full bg-white py-6 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            {indicatorColor && (
              <span className={`w-1.5 h-6 ${indicatorColor} rounded-full`}></span>
            )}
            <h2 className="text-[15px] font-black uppercase tracking-wider text-[#1e293b]">
              {title}
            </h2>
          </div>
          <button 
            onClick={() => navigate(`/${categorySlug}`)}
            className="text-[12px] text-orange-500 hover:text-orange-600 font-bold flex items-center gap-0.5 transition cursor-pointer"
          >
            View All <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Manual Slider */}
        <div className="relative w-full group/slider rounded">
          {/* Left Arrow */}
          <button 
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-orange-500 hover:text-white text-slate-800 shadow-md w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-all cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Right Arrow */}
          <button 
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-orange-500 hover:text-white text-slate-800 shadow-md w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-all cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div 
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth px-1 py-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {displayProducts.map((p, idx) => {
              const discountAmount = (p.oldPrice && p.oldPrice > p.price) ? p.oldPrice - p.price : 0;
              
              return (
                <div 
                  key={`${p.id}-${idx}`} 
                  onClick={() => onSelectProduct?.(p)}
                  className="w-[180px] sm:w-[200px] flex-shrink-0 whitespace-normal bg-white cursor-pointer group"
                >
                  <div className="relative rounded overflow-hidden aspect-square mb-3 bg-white flex items-center justify-center border border-slate-100 p-2">
                    {discountAmount > 0 && (
                      <span className="absolute top-0 left-0 bg-[#f97316] text-white font-medium text-[11px] px-2 py-0.5 z-10 shadow-sm rounded-br">
                        ৳{discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} Off
                      </span>
                    )}
                    <img 
                      src={p.thumbnail} 
                      alt={p.title} 
                      className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  
                  <div className="text-left px-1">
                    <h4 className="text-[13px] font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-orange-500 transition-colors">
                      {p.title}
                    </h4>
                    
                    <div className="mt-2 flex items-center gap-2">
                      {p.oldPrice && p.oldPrice > p.price && (
                        <span className="text-[11px] text-slate-400 line-through">
                          ৳{p.oldPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      )}
                      <span className="text-[14px] font-black text-slate-900">
                        ৳{p.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              );

            })}
          </div>
        </div>
      </div>
    </div>
  );
}
