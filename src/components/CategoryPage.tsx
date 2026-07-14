import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { ProductCard } from '../App';
import { ChevronRight, Filter, X } from 'lucide-react';
import { Product } from '../types';
import { generateSlug } from '../utils/slugs';
import { getColorStyle } from '../utils/color';

interface CategoryPageProps {
  allProducts: Product[];
  onAddToCart: (product: Product) => void;
  onAddWishlist: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  wishlist?: Product[];
  categories?: any[];
  subCategories?: any[];
  subSubCategories?: any[];
}

export default function CategoryPage({ allProducts, onAddToCart, onAddWishlist, onSelectProduct, onQuickView, wishlist, categories = [], subCategories = [], subSubCategories = [] }: CategoryPageProps) {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const pathParts = location.pathname.split('/').filter(Boolean);
  const urlSegments = pathParts.map(p => decodeURIComponent(p)); // Get segments

  const toSlug = generateSlug;
  
  // Filter products by hierarchical url segments
  const categoryProducts = useMemo(() => {
    if (urlSegments.length === 0) return [];
    
    return allProducts.filter(p => {
      const pCatSlug = p.categorySlug || '';
      const pSubSlug = p.subCategorySlug || '';
      const pSubSubSlug = p.subSubCategorySlug || '';

      if (urlSegments.length === 3) {
        return pCatSlug === urlSegments[0].toLowerCase() && pSubSlug === urlSegments[1].toLowerCase() && pSubSubSlug === urlSegments[2].toLowerCase();
      } else if (urlSegments.length === 2) {
        return pCatSlug === urlSegments[0].toLowerCase() && pSubSlug === urlSegments[1].toLowerCase();
      } else if (urlSegments.length === 1) {
        return pCatSlug === urlSegments[0].toLowerCase();
      }
      return false;
    });
  }, [allProducts, location.pathname]);

  const priceBounds = useMemo(() => {
    if (categoryProducts.length === 0) return { min: 0, max: 0 };
    let min = categoryProducts[0].price;
    let max = categoryProducts[0].price;
    for (const p of categoryProducts) {
      if (p.price < min) min = p.price;
      if (p.price > max) max = p.price;
    }
    return { min, max };
  }, [categoryProducts]);

  // Basic states derived from URL
  const minPrice = searchParams.has('minPrice') ? Number(searchParams.get('minPrice')) : priceBounds.min;
  const maxPrice = searchParams.has('maxPrice') ? Number(searchParams.get('maxPrice')) : priceBounds.max;
  const selectedBrands = searchParams.getAll('brand');
  const sortOrder = searchParams.get('sort') || 'default';

  const selectedAttributes = useMemo(() => {
    const attrs: Record<string, string[]> = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith('attr_')) {
        const attrName = key.replace('attr_', '');
        if (!attrs[attrName]) attrs[attrName] = [];
        attrs[attrName].push(value);
      }
    });
    return attrs;
  }, [searchParams]);

  const setMinPrice = (val: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (val === "" || val === String(priceBounds.min)) newParams.delete('minPrice');
    else newParams.set('minPrice', val);
    setSearchParams(newParams);
  };

  const setMaxPrice = (val: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (val === "" || val === String(priceBounds.max)) newParams.delete('maxPrice');
    else newParams.set('maxPrice', val);
    setSearchParams(newParams);
  };

  const setSortOrder = (val: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (val === 'default') newParams.delete('sort');
    else newParams.set('sort', val);
    setSearchParams(newParams);
  };

  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  
  const handlePageChange = (pageAction: number | ((prev: number) => number)) => {
    const newPage = typeof pageAction === 'function' ? pageAction(currentPage) : pageAction;
    const newParams = new URLSearchParams(searchParams);
    if (newPage > 1) {
      newParams.set('page', newPage.toString());
    } else {
      newParams.delete('page');
    }
    setSearchParams(newParams);
  };
  const productsPerPage = 20;

  // Temporary mobile modal states
  const [tempMinPrice, setTempMinPrice] = useState<number | "">(minPrice);
  const [tempMaxPrice, setTempMaxPrice] = useState<number | "">(maxPrice);
  const [tempSelectedBrands, setTempSelectedBrands] = useState<string[]>(selectedBrands);
  const [tempSelectedAttributes, setTempSelectedAttributes] = useState<Record<string, string[]>>(selectedAttributes);

  const openMobileFilters = () => {
    setTempMinPrice(minPrice);
    setTempMaxPrice(maxPrice);
    setTempSelectedBrands(selectedBrands);
    setTempSelectedAttributes(selectedAttributes);
    setShowMobileFilters(true);
  };

  const applyMobileFilters = () => {
    const newParams = new URLSearchParams(searchParams);
    if (tempMinPrice !== "" && tempMinPrice > priceBounds.min) newParams.set('minPrice', String(tempMinPrice));
    else newParams.delete('minPrice');

    if (tempMaxPrice !== "" && tempMaxPrice < priceBounds.max) newParams.set('maxPrice', String(tempMaxPrice));
    else newParams.delete('maxPrice');

    newParams.delete('brand');
    tempSelectedBrands.forEach(b => newParams.append('brand', b));

    const keysToDelete: string[] = [];
    newParams.forEach((_, key) => {
      if (key.startsWith('attr_')) keysToDelete.push(key);
    });
    keysToDelete.forEach(k => newParams.delete(k));

    Object.entries(tempSelectedAttributes).forEach(([attrName, values]) => {
      values.forEach(v => newParams.append(`attr_${attrName}`, v));
    });

    setSearchParams(newParams);
    setShowMobileFilters(false);
  };

  // Breadcrumb name derived from the actual category name
  const categoryName = useMemo(() => {
    if (urlSegments.length === 0) return 'Category';
    const targetSlug = urlSegments[urlSegments.length - 1].toLowerCase();
    
    // 1. Try to find the exact name from database categories using slug
    if (urlSegments.length === 3) {
      const dbMatch = subSubCategories.find(c => (c.slug || generateSlug(c.name)) === targetSlug);
      if (dbMatch) return dbMatch.name;
    } else if (urlSegments.length === 2) {
      const dbMatch = subCategories.find(c => (c.slug || generateSlug(c.name)) === targetSlug);
      if (dbMatch) return dbMatch.name;
    } else if (urlSegments.length === 1) {
      const dbMatch = categories.find(c => (c.slug || generateSlug(c.name)) === targetSlug);
      if (dbMatch) return dbMatch.name;
    }

    // 2. Fallback to product matching
    const matchingProduct = allProducts.find(p => {
      if (urlSegments.length === 3) return p.subSubCategorySlug === targetSlug;
      if (urlSegments.length === 2) return p.subCategorySlug === targetSlug;
      if (urlSegments.length === 1) return p.categorySlug === targetSlug;
      return false;
    });

    if (matchingProduct) {
      if (urlSegments.length === 3 && matchingProduct.subSubCategory) return matchingProduct.subSubCategory;
      if (urlSegments.length === 2 && matchingProduct.subCategory) return matchingProduct.subCategory;
      if (urlSegments.length === 1 && matchingProduct.category) return matchingProduct.category;
    }

    // 3. Last resort fallback
    return targetSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }, [allProducts, urlSegments, categories, subCategories, subSubCategories]);

  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Extract available brands for this category
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    categoryProducts.forEach(p => {
      if (p.brand) brands.add(p.brand);
      // Fallback if brand isn't explicitly set
      else {
        brands.add('Unbranded');
      }
    });
    return Array.from(brands).sort((a, b) => a.toString().localeCompare(b.toString(), undefined, { numeric: true, sensitivity: 'base' }));
  }, [categoryProducts]);

  // Extract available attributes for this category
  const availableAttributes = useMemo(() => {
    const attrMap: Record<string, Set<string>> = {};
    categoryProducts.forEach(p => {
      if (p.attributes) {
        Object.entries(p.attributes).forEach(([attrName, values]) => {
          if (!attrMap[attrName]) attrMap[attrName] = new Set();
          if (Array.isArray(values)) {
            values.forEach(v => attrMap[attrName].add(v));
          }
        });
      }
    });
    const result: Record<string, string[]> = {};
    Object.keys(attrMap).forEach(key => {
      result[key] = Array.from(attrMap[key]).sort((a, b) => a.toString().localeCompare(b.toString(), undefined, { numeric: true, sensitivity: 'base' }));
    });
    return result;
  }, [categoryProducts]);

  // Apply filters
  const filteredProducts = useMemo(() => {
    let result = categoryProducts.filter(p => p.price >= minPrice && p.price <= maxPrice);
    
    if (selectedBrands.length > 0) {
      result = result.filter(p => {
        const brand = p.brand || 'Unbranded';
        return selectedBrands.includes(brand);
      });
    }

    if (Object.keys(selectedAttributes).length > 0) {
      result = result.filter(p => {
        return Object.entries(selectedAttributes).every(([attrName, selectedValues]) => {
          if (!selectedValues || selectedValues.length === 0) return true;
          const productAttrValues = p.attributes?.[attrName];
          if (!productAttrValues || !Array.isArray(productAttrValues)) return false;
          return selectedValues.some(v => productAttrValues.includes(v));
        });
      });
    }

    if (sortOrder === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [categoryProducts, minPrice, maxPrice, selectedBrands, selectedAttributes, sortOrder]);

  const handleBrandToggle = (brand: string) => {
    const newParams = new URLSearchParams(searchParams);
    const brands = newParams.getAll('brand');
    newParams.delete('brand');
    
    if (brands.includes(brand)) {
      brands.filter(b => b !== brand).forEach(b => newParams.append('brand', b));
    } else {
      [...brands, brand].forEach(b => newParams.append('brand', b));
    }
    setSearchParams(newParams);
  };

  const handleAttributeToggle = (attrName: string, value: string, isTemp = false) => {
    if (isTemp) {
      setTempSelectedAttributes(prev => {
        const prevValues = prev[attrName] || [];
        const newValues = prevValues.includes(value) 
          ? prevValues.filter(v => v !== value) 
          : [...prevValues, value];
        
        if (newValues.length === 0) {
          const newState = { ...prev };
          delete newState[attrName];
          return newState;
        }
        return { ...prev, [attrName]: newValues };
      });
      return;
    }

    const newParams = new URLSearchParams(searchParams);
    const paramKey = `attr_${attrName}`;
    const values = newParams.getAll(paramKey);
    newParams.delete(paramKey);

    if (values.includes(value)) {
      values.filter(v => v !== value).forEach(v => newParams.append(paramKey, v));
    } else {
      [...values, value].forEach(v => newParams.append(paramKey, v));
    }
    setSearchParams(newParams);
  };

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const currentProducts = filteredProducts.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage);
  
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      handlePageChange(1);
    }
  }, [totalPages, currentPage]);
  
  

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-12">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-slate-200 py-3 px-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link to="/" className="hover:text-brand-500 transition cursor-pointer">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-brand-500">{categoryName}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Left Sidebar */}
          <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
            {/* Mobile Filter Toggle Button */}
            <button 
              onClick={openMobileFilters}
              className="w-full lg:hidden bg-white border border-slate-200 text-slate-700 py-2.5 px-4 rounded flex items-center justify-center gap-2 font-bold text-xs shadow-xs hover:bg-slate-50 transition cursor-pointer"
            >
              <Filter className="w-4 h-4 text-brand-500" />
              Show Filters
            </button>

            {/* Sidebar content wrapper (Desktop Only) */}
            <div className="hidden lg:block space-y-6">
            
            {/* Price Filter */}
            <div className="bg-white p-5 rounded border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Price Range</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={searchParams.has('minPrice') ? searchParams.get('minPrice')! : ""} 
                    onChange={e => setMinPrice(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-300 rounded text-sm outline-none focus:border-brand-500"
                    placeholder={String(priceBounds.min)}
                  />
                  <span className="text-slate-400">-</span>
                  <input 
                    type="number" 
                    value={searchParams.has('maxPrice') ? searchParams.get('maxPrice')! : ""} 
                    onChange={e => setMaxPrice(e.target.value)}
                    className="w-full px-2 py-1 border border-slate-300 rounded text-sm outline-none focus:border-brand-500"
                    placeholder={String(priceBounds.max)}
                  />
                </div>
                {/* Range Slider */}
                <input 
                  type="range" 
                  min={priceBounds.min} 
                  max={priceBounds.max} 
                  step={(priceBounds.max - priceBounds.min) / 100 > 10 ? Math.floor((priceBounds.max - priceBounds.min) / 100) : 10}
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
              </div>
            </div>

            {availableBrands.length > 0 && (
              <div className="bg-white p-5 rounded border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Brands</h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {availableBrands.map(brand => (
                    <label key={brand} className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={selectedBrands.includes(brand)}
                        onChange={() => handleBrandToggle(brand)}
                        className="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
                      />
                      <span className="text-sm font-semibold text-slate-600 group-hover:text-brand-500 transition">{brand}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Attribute Filters */}
            {Object.keys(availableAttributes).length > 0 && Object.entries(availableAttributes).map(([attrName, values]) => (
              <div key={attrName} className="bg-white p-5 rounded border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">{attrName}</h3>
                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                  {values.map(value => {
                    const isColor = attrName.toLowerCase() === 'color';
                    let colorName = value;
                    let codes: string[] = [];
                    if (isColor && value.includes(' - ')) {
                      const parts = value.split(' - ');
                      colorName = parts[0];
                      if (parts[1] && parts[1].includes('#')) {
                        codes = parts[1].split(',');
                      }
                    }

                    return (
                      <label key={value} className="flex items-center gap-2 cursor-pointer group">
                        <input 
                          type="checkbox" 
                          checked={selectedAttributes[attrName]?.includes(value) || false}
                          onChange={() => handleAttributeToggle(attrName, value)}
                          className="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
                        />
                        {isColor && codes.length > 0 && (
                          <span className="w-4 h-4 rounded-full border border-slate-300 block shrink-0 shadow-inner" style={getColorStyle(codes)} />
                        )}
                        <span className="text-sm font-semibold text-slate-600 group-hover:text-brand-500 transition">{colorName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

          {/* Main Content Area */}
          <div className="flex-1">
            
            {/* Top Bar */}
            <div className="bg-white p-3.5 sm:p-4 rounded border border-slate-200 shadow-sm flex flex-row items-center justify-between gap-4 mb-6">
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl font-bold text-slate-800 truncate leading-tight">{categoryName}</h1>
                <p className="text-[11px] sm:text-sm text-slate-500 mt-0.5">{filteredProducts.length} items found</p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <label className="text-[11px] sm:text-sm font-semibold text-slate-500 whitespace-nowrap">Sort By:</label>
                <select 
                  value={sortOrder} 
                  onChange={e => setSortOrder(e.target.value)}
                  className="px-2 py-1.5 sm:px-3 sm:py-1.5 border border-slate-300 rounded text-[11px] sm:text-sm font-semibold text-slate-700 outline-none focus:border-brand-500 bg-white cursor-pointer"
                >
                  <option value="default">Default</option>
                  <option value="price_asc">Price (Low {'>'} High)</option>
                  <option value="price_desc">Price (High {'>'} Low)</option>
                </select>
              </div>
            </div>

            {/* Product Grid */}
            {filteredProducts.length > 0 ? (
              <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                {currentProducts.map(product => (
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
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button 
                  onClick={() => handlePageChange(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:bg-brand-500 enabled:hover:text-white enabled:hover:border-brand-500 transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => handlePageChange(i + 1)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${
                        currentPage === i + 1 
                          ? 'bg-brand-500 text-white' 
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => handlePageChange(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:bg-brand-500 enabled:hover:text-white enabled:hover:border-brand-500 transition-colors"
                >
                  Next
                </button>
              </div>
            )}
            </>
            ) : (
              <div className="bg-white p-12 rounded border border-slate-200 text-center flex flex-col items-center justify-center">
                <Filter className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-800">No products found</h3>
                <p className="text-sm text-slate-500 mt-2">Try adjusting your filters to see more results.</p>
                <button 
                  onClick={() => { setMinPrice(0); setMaxPrice(500000); setSelectedBrands([]); setSelectedAttributes({}); }}
                  className="mt-6 bg-slate-900 text-white px-6 py-2 rounded-full font-bold text-sm hover:bg-slate-800 transition shadow-sm"
                >
                  Clear Filters
                </button>
              </div>
            )}
            
          </div>

        </div>
      </div>

      {/* Mobile Filters Popup Modal */}
      {showMobileFilters && (
        <div 
          className="fixed inset-0 bg-black/60 z-[200] lg:hidden animate-fadeIn" 
          onClick={() => setShowMobileFilters(false)} 
        />
      )}
      
      <div className={`fixed top-0 right-0 h-full w-full max-w-xs bg-white z-[201] lg:hidden shadow-2xl transition-transform duration-300 transform ${showMobileFilters ? 'translate-x-0' : 'translate-x-full'} flex flex-col`}>
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-slate-800">
          <span className="text-sm font-bold uppercase tracking-wide">Filters</span>
          <button onClick={() => setShowMobileFilters(false)} className="text-slate-400 hover:text-slate-650 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Scrollable Filters Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Price Range */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-150">
            <h4 className="font-bold text-slate-800 text-xs uppercase mb-3 select-none">Price Range</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  value={tempMinPrice} 
                  onChange={e => setTempMinPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs outline-none focus:border-brand-500 text-slate-800"
                  placeholder="Min"
                />
                <span className="text-slate-400 text-xs">-</span>
                <input 
                  type="number" 
                  value={tempMaxPrice} 
                  onChange={e => setTempMaxPrice(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs outline-none focus:border-brand-500 text-slate-800"
                  placeholder="Max"
                />
              </div>
              <input 
                type="range" 
                min={priceBounds.min} 
                max={priceBounds.max} 
                step={(priceBounds.max - priceBounds.min) / 100 > 10 ? Math.floor((priceBounds.max - priceBounds.min) / 100) : 10}
                value={tempMaxPrice === "" ? priceBounds.max : tempMaxPrice}
                onChange={e => setTempMaxPrice(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
            </div>
          </div>

          {/* Brands Checklist */}
          {availableBrands.length > 0 && (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-150">
              <h4 className="font-bold text-slate-800 text-xs uppercase mb-3 select-none">Brands</h4>
              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                {availableBrands.map(brand => (
                  <label key={brand} className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={tempSelectedBrands.includes(brand)}
                      onChange={() => {
                        setTempSelectedBrands(prev => 
                          prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
                        );
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-slate-600 group-hover:text-brand-500 transition">{brand}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Dynamic Attribute Filters */}
          {Object.keys(availableAttributes).length > 0 && Object.entries(availableAttributes).map(([attrName, values]) => (
            <div key={attrName} className="bg-slate-50 p-4 rounded-lg border border-slate-150">
              <h4 className="font-bold text-slate-800 text-xs uppercase mb-3 select-none">{attrName}</h4>
              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                {values.map(value => {
                  const isColor = attrName.toLowerCase() === 'color';
                  let colorName = value;
                  let codes: string[] = [];
                  if (isColor && value.includes(' - ')) {
                    const parts = value.split(' - ');
                    colorName = parts[0];
                    if (parts[1] && parts[1].includes('#')) {
                      codes = parts[1].split(',');
                    }
                  }

                  return (
                    <label key={value} className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={tempSelectedAttributes[attrName]?.includes(value) || false}
                        onChange={() => handleAttributeToggle(attrName, value, true)}
                        className="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
                      />
                      {isColor && codes.length > 0 && (
                        <span className="w-4 h-4 rounded-full border border-slate-300 block shrink-0 shadow-inner" style={getColorStyle(codes)} />
                      )}
                      <span className="text-xs font-semibold text-slate-600 group-hover:text-brand-500 transition">{colorName}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        
        {/* Sticky Footer Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
          <button 
            onClick={() => {
              setTempMinPrice(priceBounds.min);
              setTempMaxPrice(priceBounds.max);
              setTempSelectedBrands([]);
              setTempSelectedAttributes({});
            }}
            className="flex-1 border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold py-2 rounded-lg text-xs transition cursor-pointer"
          >
            Reset
          </button>
          <button 
            onClick={applyMobileFilters}
            className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-bold py-2 rounded-lg text-xs transition cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
