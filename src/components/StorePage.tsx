import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { MessageSquare, Star, Search, Filter, X, Eye } from 'lucide-react';
import { useToast } from './ToastContext';
import { Product } from '../types';
import { generateSlug } from '../utils/slugs';
import { getColorStyle } from '../utils/color';

interface StorePageProps {
  allProducts: Product[];
  onSelectProduct: (p: Product) => void;
  onQuickView?: (p: Product) => void;
}

export default function StorePage({ allProducts, onSelectProduct, onQuickView }: StorePageProps) {
  const { id: shopSlug } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const navigate = useNavigate();
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [user, setUser] = useState<any>(null);

  // URL derived states
  const searchQuery = searchParams.get('q') || '';
  const minPrice = searchParams.has('minPrice') ? Number(searchParams.get('minPrice')) : 0;
  const maxPrice = searchParams.has('maxPrice') ? Number(searchParams.get('maxPrice')) : 500000;
  const selectedBrands = searchParams.getAll('brand');
  const selectedCategories = searchParams.getAll('category');
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

  const setSearchQuery = (val: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (!val) newParams.delete('q');
    else newParams.set('q', val);
    setSearchParams(newParams);
  };

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

  const [showMobileFilters, setShowMobileFilters] = useState<boolean>(false);

  // Temporary mobile modal states
  const [tempMinPrice, setTempMinPrice] = useState<number | "">(minPrice);
  const [tempMaxPrice, setTempMaxPrice] = useState<number | "">(maxPrice);
  const [tempSelectedBrands, setTempSelectedBrands] = useState<string[]>(selectedBrands);
  const [tempSelectedCategories, setTempSelectedCategories] = useState<string[]>(selectedCategories);
  const [tempSelectedAttributes, setTempSelectedAttributes] = useState<Record<string, string[]>>(selectedAttributes);

  const openMobileFilters = () => {
    setTempMinPrice(minPrice);
    setTempMaxPrice(maxPrice);
    setTempSelectedBrands(selectedBrands);
    setTempSelectedCategories(selectedCategories);
    setTempSelectedAttributes(selectedAttributes);
    setShowMobileFilters(true);
  };

  const applyMobileFilters = () => {
    const newParams = new URLSearchParams(searchParams);
    if (tempMinPrice !== "" && tempMinPrice !== 0) newParams.set('minPrice', String(tempMinPrice));
    else newParams.delete('minPrice');

    if (tempMaxPrice !== "" && tempMaxPrice !== 500000) newParams.set('maxPrice', String(tempMaxPrice));
    else newParams.delete('maxPrice');

    newParams.delete('brand');
    tempSelectedBrands.forEach(b => newParams.append('brand', b));

    newParams.delete('category');
    tempSelectedCategories.forEach(c => newParams.append('category', c));

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

  useEffect(() => {
    const session = localStorage.getItem('user');
    if (session) {
      setUser(JSON.parse(session));
    }
  }, []);

  const generateSlug = (name: string) => {
    if (!name) return '';
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    setMinPrice(0);
    setMaxPrice(500000);
    setSelectedBrands([]);
    setSelectedCategories([]);
    setSortOrder('default');
    setSearchQuery('');
    const fetchSeller = async () => {
      try {
        if (shopSlug === 'in-house-store' || shopSlug === 'admin') {
          setSeller({
            id: 'admin',
            shop_name: 'In-House Store',
            shop_logo_url: 'https://via.placeholder.com/150?text=In-House',
            shop_banner_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=300&fit=crop',
          });
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('sellers')
          .select('*');

        if (error) throw error;
        
        const foundSeller = data.find(s => generateSlug(s.shop_name) === shopSlug);
        setSeller(foundSeller || null);
      } catch (err) {
        console.error('Error fetching seller:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSeller();
  }, [shopSlug]);

  const storeProducts = seller ? allProducts.filter(p => p.storeId === seller.id) : [];

  const filteredCategoryProducts = useMemo(() => {
    if (selectedCategories.length === 0) return storeProducts;
    return storeProducts.filter(p => p.category && selectedCategories.includes(p.category));
  }, [storeProducts, selectedCategories]);

  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    filteredCategoryProducts.forEach(p => {
      if (p.brand) brands.add(p.brand);
      else {
        brands.add('Unbranded');
      }
    });
    return Array.from(brands).sort((a, b) => a.toString().localeCompare(b.toString(), undefined, { numeric: true, sensitivity: 'base' }));
  }, [filteredCategoryProducts]);

  const availableAttributes = useMemo(() => {
    const attrMap: Record<string, Set<string>> = {};
    filteredCategoryProducts.forEach(p => {
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
  }, [filteredCategoryProducts]);

  const filteredProducts = useMemo(() => {
    let result = filteredCategoryProducts.filter(p => p.price >= minPrice && p.price <= maxPrice);
    
    if (searchQuery.trim()) {
      const lower = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(lower) || 
        (p.category && p.category.toLowerCase().includes(lower))
      );
    }

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
  }, [filteredCategoryProducts, minPrice, maxPrice, selectedBrands, selectedAttributes, sortOrder, searchQuery]);

  const handleCategoryToggle = (category: string) => {
    const newParams = new URLSearchParams(searchParams);
    const categories = newParams.getAll('category');
    newParams.delete('category');
    
    if (categories.includes(category)) {
      categories.filter(c => c !== category).forEach(c => newParams.append('category', c));
    } else {
      [...categories, category].forEach(c => newParams.append('category', c));
    }
    setSearchParams(newParams);
  };

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

  const handleChatClick = () => {
    if (!user || user.role !== 'customer') {
      navigate('/login');
    } else {
      setShowChatModal(true);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) {
      showToast('Please type a message', 'error');
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase
        .from('support_messages')
        .insert([{
          seller_id: seller?.id === 'admin' ? null : seller?.id,
          customer_name: user.name || (user.first_name ? `${user.first_name} ${user.last_name}` : 'Customer'),
          customer_phone: user.phone || 'N/A',
          message: chatMessage
        }]);

      if (error) throw error;
      showToast('Message sent to vendor successfully!', 'success');
      setShowChatModal(false);
      setChatMessage('');
    } catch (err) {
      console.error(err);
      showToast('Failed to send message', 'error');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="min-h-[50vh] flex items-center justify-center">Loading Store...</div>;
  if (!seller) return <div className="min-h-[50vh] flex items-center justify-center text-red-500">Store not found</div>;

  return (
    <div className="bg-[#f5f5f5] min-h-screen pb-16">
      {/* Banner & Store Info Box */}
      <div className="relative mb-12">
        <div className="h-48 md:h-64 w-full bg-slate-200 overflow-hidden">
          <img 
            src={seller.shop_banner_url || 'https://images.unsplash.com/photo-1558769132-cb1fac0840ff?w=1200&h=300&fit=crop'} 
            alt="Store Banner" 
            className="w-full h-full object-cover" 
          />
        </div>
        <div className="w-full mx-auto px-0 sm:px-6 lg:px-8 relative -mt-16">
          <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="shrink-0">
              <img 
                src={seller.shop_logo_url || 'https://via.placeholder.com/150?text=Logo'} 
                alt={seller.shop_name} 
                className="w-20 h-20 sm:w-24 sm:h-24 rounded border border-slate-200 object-contain bg-white" 
              />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800">{seller.shop_name}</h1>
              <p className="text-xs font-bold text-brand-500 mt-1 tracking-wide">
                0 Reviews <span className="text-slate-300 mx-1">|</span> {storeProducts.length} Products
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-1 mt-2 text-slate-300">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5" />)}
                <span className="text-xs text-slate-500 ml-1">(0)</span>
              </div>
            </div>
            <div className="shrink-0 w-full sm:w-auto mt-4 sm:mt-0">
              <button 
                onClick={handleChatClick} 
                className="w-full sm:w-auto bg-brand-500 hover:bg-brand-600 text-white px-5 py-2.5 rounded text-sm font-bold flex items-center justify-center gap-2 transition shadow-sm"
              >
                <MessageSquare className="w-4 h-4" /> Chat With Vendor
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full mx-auto px-0 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Sidebar */}
          <div className="w-full lg:w-64 shrink-0 space-y-4">
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
            
            {/* Categories Filter */}
            <div className="bg-white p-5 rounded border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Categories</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {Array.from(new Set(storeProducts.map(p => p.category))).map(cat => (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={selectedCategories.includes(cat)}
                      onChange={() => handleCategoryToggle(cat)}
                      className="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-slate-600 group-hover:text-brand-500 transition">{cat}</span>
                    <span className="text-xs text-slate-400 ml-auto font-medium">({storeProducts.filter(p => p.category === cat).length})</span>
                  </label>
                ))}
                {storeProducts.length === 0 && (
                  <p className="text-sm text-slate-500">No categories</p>
                )}
              </div>
            </div>

            {/* Price Filter */}
            <div className="bg-white p-5 rounded border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Price Range</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    value={minPrice} 
                    onChange={e => setMinPrice(Number(e.target.value))}
                    className="w-full px-2 py-1 border border-slate-300 rounded text-sm outline-none focus:border-brand-500"
                    placeholder="Min"
                  />
                  <span className="text-slate-400">-</span>
                  <input 
                    type="number" 
                    value={maxPrice} 
                    onChange={e => setMaxPrice(Number(e.target.value))}
                    className="w-full px-2 py-1 border border-slate-300 rounded text-sm outline-none focus:border-brand-500"
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
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
                />
              </div>
            </div>

            {/* Brands Filter */}
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

          {/* Right Content - Product Grid */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-row justify-between items-center mb-6 gap-2 sm:gap-4">
              <div className="flex items-center gap-1.5 shrink-0">
                <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
                <span className="text-xs sm:text-sm font-medium text-slate-600 hidden sm:inline">Sort by:</span>
                <select 
                  value={sortOrder}
                  onChange={e => setSortOrder(e.target.value)}
                  className="border border-slate-200 rounded px-1.5 py-1.5 text-xs sm:text-sm sm:px-2 bg-white focus:outline-none focus:border-brand-500 cursor-pointer"
                >
                  <option value="default">Latest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
              <div className="relative flex-1 sm:flex-none sm:w-64">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..." 
                  className="w-full pl-2.5 pr-8 py-1.5 sm:pl-3 sm:pr-10 sm:py-2 border border-slate-200 rounded text-xs sm:text-sm focus:outline-none focus:border-brand-500"
                />
                <button className="absolute right-0 top-0 h-full px-2 sm:px-3 bg-brand-500 text-white rounded-r hover:bg-brand-600 transition flex items-center justify-center">
                  <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-500">
                {searchQuery ? "No products found matching your search." : "No products found in this store."}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map(p => (
                  <Link 
                    key={p.id} 
                    to={`/product/${p.slug}`}
                    onClick={() => onSelectProduct(p)}
                    className="group bg-white border border-slate-100/80 rounded-lg p-3 flex flex-col hover:border-brand-500/30 hover:shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] transition duration-200"
                  >
                    <div className="w-full flex justify-start mb-1.5 min-h-[20px]">
                      {p.oldPrice > p.price && (
                        <span className="bg-brand-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-sm tracking-wide">
                          +{(p.oldPrice - p.price).toLocaleString()}.00 Off
                        </span>
                      )}
                    </div>
                    <div className="w-full h-32 sm:h-40 mb-4 flex items-center justify-center p-2 relative">
                      <img src={p.thumbnail} alt={p.title} className="max-w-full max-h-full object-contain mix-blend-multiply" />
                      {/* Hover activation utilities */}
                      <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onQuickView?.(p);
                          }}
                          className="p-1.5 bg-white/90 rounded-full text-slate-800 hover:bg-brand-500 hover:text-white transition shadow cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col items-center text-center mt-auto">
                      <h4 className="text-[12px] font-bold text-slate-800 leading-snug line-clamp-2 min-h-[34px] mb-2 px-1">
                        {p.title}
                      </h4>
                      <div className="flex items-center justify-center gap-1.5 pb-1">
                        <span className="text-[11px] text-slate-400 line-through">৳{p.oldPrice.toLocaleString()}.00</span>
                        <span className="text-[14px] font-bold text-brand-500">৳{p.price.toLocaleString()}.00</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Modal - Image 1 Design */}
      {showChatModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#f0f4f8] rounded shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">
                Send Message to vendor
              </h3>
              <button onClick={() => setShowChatModal(false)} className="text-slate-400 hover:text-slate-600 transition text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSendMessage} className="p-6">
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-6">
                <textarea 
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                  className="w-full px-4 py-3 text-sm focus:outline-none resize-none"
                  placeholder="Write here..."
                  rows={4}
                  required
                ></textarea>
              </div>
              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowChatModal(false);
                    navigate('/my-account?tab=inbox');
                  }}
                  className="px-4 py-2 bg-[#e8f0fe] hover:bg-[#d2e3fc] text-[#1967d2] rounded text-sm font-medium transition"
                >
                  Go to chatbox
                </button>
                <button 
                  type="submit" 
                  disabled={sending}
                  className="px-6 py-2 bg-[#ff8c00] hover:bg-[#e67e00] text-white rounded text-sm font-semibold transition disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
          {/* Categories Checklist */}
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-150">
            <h4 className="font-bold text-slate-800 text-xs uppercase mb-3 select-none">Categories</h4>
            <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
              {Array.from(new Set(storeProducts.map(p => p.category))).map(cat => (
                <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={tempSelectedCategories.includes(cat)}
                    onChange={() => {
                      setTempSelectedCategories(prev => 
                        prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
                      );
                    }}
                    className="w-4 h-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-600 group-hover:text-brand-500 transition">{cat}</span>
                  <span className="text-xs text-slate-400 ml-auto font-medium">({storeProducts.filter(p => p.category === cat).length})</span>
                </label>
              ))}
              {storeProducts.length === 0 && (
                <p className="text-xs text-slate-500">No categories</p>
              )}
            </div>
          </div>

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
                min="0" 
                max="500000" 
                step="1000"
                value={tempMaxPrice === "" ? 500000 : tempMaxPrice}
                onChange={e => setTempMaxPrice(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
            </div>
          </div>

          {/* Brands Checklist */}
          {availableBrands.length > 0 && (
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-150">
              <h4 className="font-bold text-slate-800 text-xs uppercase mb-3 select-none">Brands</h4>
              <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1 custom-scrollbar">
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
              setTempMinPrice(0);
              setTempMaxPrice(500000);
              setTempSelectedBrands([]);
              setTempSelectedCategories([]);
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
