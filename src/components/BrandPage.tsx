import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ProductCard } from '../App';
import { ChevronRight, Filter } from 'lucide-react';
import { Product } from '../types';

interface BrandPageProps {
  allProducts: Product[];
  onAddToCart: (product: Product) => void;
  onAddWishlist: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  wishlist?: Product[];
}

export default function BrandPage({ allProducts, onAddToCart, onAddWishlist, onSelectProduct, onQuickView, wishlist }: BrandPageProps) {
  const { brandName } = useParams<{ brandName: string }>();
  const decodedBrandName = brandName ? decodeURIComponent(brandName) : '';
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Basic states from URL
  const minPrice = searchParams.has('minPrice') ? Number(searchParams.get('minPrice')) : 0;
  const maxPrice = searchParams.has('maxPrice') ? Number(searchParams.get('maxPrice')) : 500000;
  const sortOrder = searchParams.get('sort') || 'default';

  const setMinPrice = (val: number) => {
    const newParams = new URLSearchParams(searchParams);
    if (val === 0) newParams.delete('minPrice');
    else newParams.set('minPrice', String(val));
    setSearchParams(newParams);
  };

  const setMaxPrice = (val: number) => {
    const newParams = new URLSearchParams(searchParams);
    if (val === 500000) newParams.delete('maxPrice');
    else newParams.set('maxPrice', String(val));
    setSearchParams(newParams);
  };

  const setSortOrder = (val: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (val === 'default') newParams.delete('sort');
    else newParams.set('sort', val);
    setSearchParams(newParams);
  };

  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [brandName]);

  // Filter products by brand
  const brandProducts = useMemo(() => {
    if (!decodedBrandName) return [];
    
    return allProducts.filter(p => {
      const productBrand = p.brand || 'Unbranded';
      return productBrand.toLowerCase() === decodedBrandName.toLowerCase();
    });
  }, [allProducts, decodedBrandName]);

  // Apply filters
  const filteredProducts = useMemo(() => {
    let result = brandProducts.filter(p => p.price >= minPrice && p.price <= maxPrice);

    if (sortOrder === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [brandProducts, minPrice, maxPrice, sortOrder]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-slate-200 py-3 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link to="/" className="hover:text-orange-500 transition cursor-pointer">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-orange-500">{decodedBrandName}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Left Sidebar */}
          <div className="w-full lg:w-64 flex-shrink-0 space-y-6">
            
            {/* Price Filter */}
            <div className="bg-white p-5 rounded border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Price Range</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={minPrice} 
                    onChange={e => setMinPrice(Number(e.target.value))}
                    className="w-full px-2 py-1 border border-slate-300 rounded text-sm outline-none focus:border-orange-500"
                    placeholder="Min"
                  />
                  <span className="text-slate-400">-</span>
                  <input 
                    type="number" 
                    value={maxPrice} 
                    onChange={e => setMaxPrice(Number(e.target.value))}
                    className="w-full px-2 py-1 border border-slate-300 rounded text-sm outline-none focus:border-orange-500"
                    placeholder="Max"
                  />
                </div>
                {/* Range Slider */}
                <input 
                  type="range" 
                  min="0" 
                  max="500000" 
                  step="1000"
                  value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            
            {/* Top Bar */}
            <div className="bg-white p-4 rounded border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-xl font-bold text-slate-800">{decodedBrandName}</h1>
                <p className="text-sm text-slate-500 mt-0.5">{filteredProducts.length} items found</p>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-slate-600">Sort By:</label>
                <select 
                  value={sortOrder} 
                  onChange={e => setSortOrder(e.target.value)}
                  className="px-3 py-1.5 border border-slate-300 rounded text-sm font-semibold text-slate-700 outline-none focus:border-orange-500 bg-white"
                >
                  <option value="default">Default</option>
                  <option value="price_asc">Price (Low {'>'} High)</option>
                  <option value="price_desc">Price (High {'>'} Low)</option>
                </select>
              </div>
            </div>

            {/* Product Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProducts.map(product => (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAddToCart={(p) => onAddToCart(p)} 
                    onAddWishlist={(p) => onAddWishlist(p)}
                    onQuickView={onQuickView || (() => {})}
                    onSelectProduct={onSelectProduct}
                    wishlist={wishlist}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white p-12 rounded border border-slate-200 text-center flex flex-col items-center justify-center">
                <Filter className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-800">No products found for this brand</h3>
                <p className="text-sm text-slate-500 mt-2">Try adjusting your filters to see more results.</p>
                <button 
                  onClick={() => { setMinPrice(0); setMaxPrice(500000); }}
                  className="mt-6 bg-slate-900 text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-slate-800 transition shadow-sm"
                >
                  Clear Filters
                </button>
              </div>
            )}
            
          </div>

        </div>
      </div>
    </div>
  );
}
