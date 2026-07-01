import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Phone, Search, Heart, User, ShoppingCart, Menu, ChevronDown, 
  LogIn, ExternalLink, X, ShieldAlert,
  LayoutDashboard, LogOut, Settings, ChevronRight
} from "lucide-react";
import { Product, CartItem } from "../types";
import { supabase } from "../supabaseClient";
import { useToast } from "./ToastContext";
import { generateSlug } from "../utils/slugs";

interface HeaderProps {
  cart: CartItem[];
  wishlist: Product[];
  onSearch: (query: string) => void;
  onSelectCategory: (categoryName: string, preventNav?: boolean) => void;
  activeCategory: string;
  onRemoveFromCart: (id: string) => void;
  onClearCart: () => void;
  onAddProductClick: () => void; // Developer cheat trigger
  allProducts?: Product[];
}

export default function Header({ 
  cart, 
  wishlist, 
  onSearch, 
  onSelectCategory, 
  activeCategory, 
  onRemoveFromCart,
  onClearCart,
  onAddProductClick,
  allProducts = []
}: HeaderProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [liveResults, setLiveResults] = useState<Product[]>([]);
  const [selectedDropdownCat, setSelectedDropdownCat] = useState("All Categories");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);

  const [user, setUser] = useState<{ id: string; role: string; name: string } | null>(null);
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbSubCategories, setDbSubCategories] = useState<any[]>([]);
  const [dbSubSubCategories, setDbSubSubCategories] = useState<any[]>([]);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredSubCategory, setHoveredSubCategory] = useState<string | null>(null);
  const [expandedMobileCat, setExpandedMobileCat] = useState<string | null>(null);
  const [expandedMobileSubCat, setExpandedMobileSubCat] = useState<string | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const session = localStorage.getItem('user');
    if (session) {
      setUser(JSON.parse(session));
    }
    
    const fetchCats = async () => {
      try {
        const [catRes, subRes, subSubRes] = await Promise.all([
          supabase.from('categories').select('*').order('priority', { ascending: true }),
          supabase.from('sub_categories').select('*').order('priority', { ascending: true }),
          supabase.from('sub_sub_categories').select('*').order('priority', { ascending: true })
        ]);
        
        if (!catRes.error && catRes.data) setDbCategories(catRes.data);
        if (!subRes.error && subRes.data) setDbSubCategories(subRes.data);
        if (!subSubRes.error && subSubRes.data) setDbSubSubCategories(subSubRes.data);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    fetchCats();
  }, []);

  // Handle click outside to close category menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isCategoryMenuOpen) {
        const target = e.target as HTMLElement;
        if (!target.closest('.category-dropdown-container')) {
          setIsCategoryMenuOpen(false);
        }
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isCategoryMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('wishlist');
    setUser(null);
    setIsAccountOpen(false);
    window.location.href = '/login';
  };

  // Live Search Effect
  useEffect(() => {
    if (searchTerm.trim().length > 1) {
      const lowerTerm = searchTerm.toLowerCase();
      const results = allProducts.filter(p => 
        p.title.toLowerCase().includes(lowerTerm) || 
        (p.category && p.category.toLowerCase().includes(lowerTerm))
      ).slice(0, 5); // top 5 results
      setLiveResults(results);
    } else {
      setLiveResults([]);
    }
  }, [searchTerm, allProducts]);

  const cartTotal = cart.reduce((acc, item) => acc + ((item.selectedVariation?.price || item.product.price) * item.quantity), 0);
  const cartQuantity = cart.reduce((acc, item) => acc + item.quantity, 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchTerm("");
      setLiveResults([]);
      navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const executeCategorySelect = (catName: string) => {
    setSelectedDropdownCat(catName);
    onSelectCategory(catName === "All Categories" ? "" : catName);
  };

  const handleSellerZoneClick = () => {
    if (user && user.role === 'seller') {
      navigate('/seller');
    } else {
      showToast('Please login to your Seller account to access the Seller Zone.', 'error');
      navigate('/login?tab=seller');
    }
  };

  return (
    <header className="w-full bg-white sticky top-0 z-50 font-sans border-b border-slate-200">


      {/* Main Header Row */}
      <div className="w-full bg-white text-slate-900 py-3 px-6 border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Branding & Logo and Mobile Actions */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-2">
              {/* Mobile hamburger menu trigger */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCategoryMenuOpen(!isCategoryMenuOpen);
                }}
                className="md:hidden p-1 text-slate-700 hover:text-orange-500 transition cursor-pointer category-dropdown-container"
                aria-label="Open menu"
              >
                <Menu className="w-5.5 h-5.5" />
              </button>

              <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => { onSelectCategory(""); navigate("/"); }}>
                <div className="flex items-center">
                  <img src="https://ik.imagekit.io/eg7u6xcn0u/HolidayMart-logo-wide.png" alt="HolidayMart" className="h-[40px] md:h-[54px] w-auto object-contain" />
                </div>
              </div>
            </div>

            {/* Mobile Actions Container (visible only on mobile) */}
            <div className="flex items-center gap-3.5 md:hidden">
              {/* Wishlist */}
              <div 
                onClick={() => navigate('/my-account?tab=wishlist')}
                className="relative cursor-pointer p-1"
              >
                <Heart className="w-5 h-5 text-slate-700 hover:text-orange-500 transition" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-0.5 -right-1.5 bg-rose-500 text-white text-[8px] font-bold rounded-full h-3.5 min-w-[14px] px-0.5 flex items-center justify-center shadow-xs">
                    {wishlist.length}
                  </span>
                )}
              </div>

              {/* Account Dropdown */}
              <div className="relative">
                <div 
                  onClick={() => setIsAccountOpen(!isAccountOpen)}
                  className="cursor-pointer p-1"
                >
                  <User className="w-5 h-5 text-slate-700 hover:text-orange-500 transition" />
                </div>
                {isAccountOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-md shadow-lg border border-slate-200 py-2.5 text-slate-800 animate-fadeIn z-50 text-left">
                    {user ? (
                      <>
                        <div className="px-4 py-1.5 border-b border-slate-100 text-slate-750">
                          <p className="text-[10px] text-slate-400">Logged in as <span className="capitalize">{user.role}</span></p>
                          <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                        </div>
                        <div className="p-1.5 space-y-0.5">
                          <button 
                            onClick={() => { setIsAccountOpen(false); navigate(user.role === 'customer' ? '/my-account' : (user.role === 'seller' ? '/seller/settings' : '/admin/settings')); }}
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 rounded flex items-center gap-2 font-medium text-slate-700"
                          >
                            <Settings className="w-3.5 h-3.5 text-orange-500" /> {user.role === 'customer' ? 'My Account' : 'Settings'}
                          </button>
                          <button 
                            onClick={handleLogout}
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-rose-50 text-rose-600 rounded flex items-center gap-2 font-medium"
                          >
                            <LogOut className="w-3.5 h-3.5" /> Logout
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="px-4 py-1.5 border-b border-slate-100 text-slate-750">
                          <p className="text-[10px] text-slate-400">Welcome Buyer/Seller</p>
                          <p className="text-xs font-bold text-slate-800">Your HolidayMart Account</p>
                        </div>
                        <div className="px-4 py-2 border-b border-slate-100">
                          <p className="text-xs font-bold text-slate-800 mb-1">Register</p>
                          <div className="space-y-0.5">
                            <Link to="/customer-signup" onClick={() => setIsAccountOpen(false)} className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-50 rounded flex items-center gap-2 font-medium text-slate-600 block"><User className="w-3.5 h-3.5 text-blue-500" /> Customer Account</Link>
                            <Link to="/seller-signup" onClick={() => setIsAccountOpen(false)} className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-50 rounded flex items-center gap-2 font-medium text-slate-600 block"><ExternalLink className="w-3.5 h-3.5 text-emerald-500" /> Seller Account</Link>
                          </div>
                        </div>
                        <div className="px-4 py-2">
                          <p className="text-xs font-bold text-slate-800 mb-1">Login</p>
                          <div className="space-y-0.5">
                            <Link to="/login" onClick={() => setIsAccountOpen(false)} className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-50 rounded flex items-center gap-2 font-medium text-slate-600 block"><LogIn className="w-3.5 h-3.5 text-orange-500" /> Customer Login</Link>
                            <Link to="/login?tab=seller" onClick={() => setIsAccountOpen(false)} className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-50 rounded flex items-center gap-2 font-medium text-slate-600 block"><LogIn className="w-3.5 h-3.5 text-purple-500" /> Seller Login</Link>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Shopping Cart Trigger */}
              <div className="relative">
                <div 
                  onClick={() => setIsCartOpen(!isCartOpen)}
                  className="cursor-pointer p-1"
                >
                  <ShoppingCart className="w-5 h-5 text-slate-700 hover:text-orange-500 transition" />
                  {cartQuantity > 0 && (
                    <span className="absolute -top-0.5 -right-1.5 bg-orange-500 text-white text-[8px] font-bold rounded-full h-3.5 min-w-[14px] px-0.5 flex items-center justify-center shadow-xs">
                      {cartQuantity}
                    </span>
                  )}
                </div>
                {isCartOpen && (
                  <div className="absolute right-0 mt-2 w-76 bg-white rounded-md shadow-lg border border-slate-200 p-3.5 text-slate-800 animate-fadeIn z-50 text-left">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                      <h3 className="text-xs font-bold text-slate-800">Your Cart ({cartQuantity})</h3>
                      <button onClick={() => setIsCartOpen(false)} className="text-slate-400 hover:text-red-500 transition"><X className="w-3.5 h-3.5" /></button>
                    </div>
                    {cart.length === 0 ? (
                      <div className="text-center py-5">
                        <p className="text-xs text-slate-450 mb-2">Your Shopping Cart is empty</p>
                        <button onClick={() => setIsCartOpen(false)} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-1 rounded text-[11px] transition">Start Shopping</button>
                      </div>
                    ) : (
                      <div>
                        <div className="max-h-52 overflow-y-auto space-y-2.5 mb-3 scrollbar-thin">
                          {cart.map(item => (
                            <div key={item.cartItemId} className="flex gap-2 items-start justify-between text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                              <img src={item.selectedVariation?.image || item.product.thumbnail} alt={item.product.title} className="w-8 h-8 object-cover rounded border border-slate-200 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-800 truncate" title={item.product.title}>{item.product.title}</p>
                                {item.selectedVariation?.attributes && (
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {Object.entries(item.selectedVariation.attributes).map(([k, v]) => {
                                      let displayVal = String(v);
                                      if (k.toLowerCase() === 'color' && displayVal.includes(' - ')) {
                                        displayVal = displayVal.split(' - ')[0];
                                      }
                                      return (
                                        <span key={k} className="text-[9px] text-slate-500 bg-slate-100 px-1 py-0.5 rounded leading-none border border-slate-200">
                                          {displayVal}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}
                                <p className="text-[10px] text-slate-455 mt-0.5 font-medium">
                                  ৳{(item.selectedVariation?.price || item.product.price).toLocaleString()} <span className="text-slate-400">x {item.quantity}</span>
                                </p>
                              </div>
                              <button onClick={() => onRemoveFromCart(item.cartItemId)} className="text-red-500 hover:text-red-700 font-bold p-1 rounded hover:bg-slate-50 shrink-0 mt-0.5">✕</button>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-slate-100 pt-2 mb-2 text-xs">
                          <div className="flex justify-between items-center text-slate-450 mb-0.5">
                            <span>Subtotal</span>
                            <span className="font-bold text-slate-800">৳{cartTotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center font-bold text-slate-800 text-[13px]">
                            <span>Est. Total</span>
                            <span className="text-orange-500">৳{cartTotal.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <button onClick={onClearCart} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1.5 rounded transition text-center">Clear</button>
                          <Link to="/checkout" onClick={() => setIsCartOpen(false)} className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-1.5 rounded transition text-center select-none block">Checkout</Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Massive Search Block */}
          <form 
            onSubmit={handleSearchSubmit}
            className="relative w-full md:max-w-xl flex items-center bg-white border border-slate-200 rounded-md overflow-visible focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500/10 shadow-xs transition-all text-slate-900 h-[38px]"
          >
            {/* Preset Category Dropdown Selector inside Search */}
            <div className="relative hidden sm:block h-full border-r border-slate-200">
              <select 
                value={selectedDropdownCat}
                onChange={(e) => executeCategorySelect(e.target.value)}
                className="bg-slate-50 text-slate-650 text-[11px] font-bold px-3 pr-7 h-full outline-none cursor-pointer hover:bg-slate-100 transition text-ellipsis max-w-[140px] appearance-none"
              >
                <option value="All Categories">All Categories</option>
                {dbCategories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              <div className="absolute top-1/2 right-2 -translate-y-1/2 pointer-events-none">
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </div>
            </div>

            {/* Main input search field */}
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products, hardware, T-shirts, or vendor stores..."
              className="flex-1 px-3 text-xs text-slate-800 outline-none placeholder-slate-400 h-full bg-white"
            />

            {/* Clickable Search trigger */}
            <button 
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 h-full transition-colors flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider text-[11px]"
            >
              <Search className="w-3.5 h-3.5 text-white" />
              <span className="hidden sm:inline">Search</span>
            </button>

            {/* Live Search Dropdown */}
            {liveResults.length > 0 && (
              <div className="absolute top-[calc(100%+4px)] left-0 w-full bg-white border border-slate-200 shadow-xl rounded-md z-[200] overflow-hidden">
                {liveResults.map(p => (
                  <Link 
                    key={p.id} 
                    to={`/product/${p.slug}`}
                    onClick={() => { setSearchTerm(""); setLiveResults([]); }}
                    className="flex items-center gap-3 p-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition"
                  >
                    <img src={p.thumbnail} alt="" className="w-10 h-10 object-cover rounded border border-slate-200" />
                    <div>
                      <p className="text-xs font-bold text-slate-800 line-clamp-1">{p.title}</p>
                      <p className="text-[10px] text-orange-500 font-bold mt-0.5">৳{p.price.toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </form>

          {/* User Operations / Badges (Cart, Wislist, Account) */}
          <div className="hidden md:flex items-center gap-4">
            
            {/* Wishlist Icon with Dynamic Badge */}
            <div 
              onClick={() => navigate('/my-account?tab=wishlist')}
              className="flex items-center gap-1.5 cursor-pointer group relative"
            >
              <div className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition group-hover:border-orange-400">
                <Heart className="w-4 h-4 text-slate-600 group-hover:text-orange-500 transition" />
                {wishlist.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center shadow-xs">
                    {wishlist.length}
                  </span>
                )}
              </div>
              <div className="text-left hidden lg:block select-none">
                <span className="text-[9px] text-slate-400 block font-medium leading-none">Wishlist</span>
                <span className="text-[11px] font-bold text-slate-700 leading-none mt-1 block">Favorites</span>
              </div>
            </div>

            {/* My Account Profile Dropdown */}
            <div className="relative">
              <div 
                onClick={() => setIsAccountOpen(!isAccountOpen)}
                className="flex items-center gap-1.5 cursor-pointer group"
              >
                <div className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition group-hover:border-orange-400">
                  <User className="w-4 h-4 text-slate-600 group-hover:text-orange-500 transition" />
                </div>
                <div className="text-left hidden lg:block select-none">
                  <span className="text-[9px] text-slate-400 block font-medium leading-none">Account</span>
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-0.5 leading-none mt-1 block whitespace-nowrap">
                    {user ? user.name : 'Register/Login'} <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                  </span>
                </div>
              </div>

              {/* Account Dropdown Menu */}
              {isAccountOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-md shadow-lg border border-slate-200 py-2.5 text-slate-800 animate-fadeIn z-50">
                  {user ? (
                    <>
                      <div className="px-4 py-1.5 border-b border-slate-100 text-slate-750">
                        <p className="text-[10px] text-slate-400">Logged in as <span className="capitalize">{user.role}</span></p>
                        <p className="text-xs font-bold text-slate-800 truncate">{user.name}</p>
                      </div>
                      <div className="p-1.5 space-y-0.5">
                        <button 
                          onClick={() => { setIsAccountOpen(false); navigate(user.role === 'customer' ? '/my-account' : (user.role === 'seller' ? '/seller/settings' : '/admin/settings')); }}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 rounded flex items-center gap-2 font-medium text-slate-700"
                        >
                          <Settings className="w-3.5 h-3.5 text-orange-500" /> {user.role === 'customer' ? 'My Account' : 'Settings'}
                        </button>
                        <button 
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-1.5 text-xs hover:bg-rose-50 text-rose-600 rounded flex items-center gap-2 font-medium"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Logout
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-1.5 border-b border-slate-100 text-slate-750">
                        <p className="text-[10px] text-slate-400">Welcome Buyer/Seller</p>
                        <p className="text-xs font-bold text-slate-800">Your HolidayMart Account</p>
                      </div>
                      
                      {/* Register Menu */}
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-800 mb-1">Register</p>
                        <div className="space-y-0.5">
                          <Link 
                            to="/customer-signup"
                            onClick={() => setIsAccountOpen(false)}
                            className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-50 rounded flex items-center gap-2 font-medium text-slate-600 block"
                          >
                            <User className="w-3.5 h-3.5 text-blue-500" /> Customer Account
                          </Link>
                          <Link 
                            to="/seller-signup"
                            onClick={() => setIsAccountOpen(false)}
                            className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-50 rounded flex items-center gap-2 font-medium text-slate-600 block"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-emerald-500" /> Seller Account
                          </Link>
                        </div>
                      </div>

                      {/* Login Menu */}
                      <div className="px-4 py-2">
                        <p className="text-xs font-bold text-slate-800 mb-1">Login</p>
                        <div className="space-y-0.5">
                          <Link 
                            to="/login"
                            onClick={() => setIsAccountOpen(false)}
                            className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-50 rounded flex items-center gap-2 font-medium text-slate-600 block"
                          >
                            <LogIn className="w-3.5 h-3.5 text-orange-500" /> Customer Login
                          </Link>
                          <Link 
                            to="/login?tab=seller"
                            onClick={() => setIsAccountOpen(false)}
                            className="w-full text-left px-2 py-1.5 text-xs hover:bg-slate-50 rounded flex items-center gap-2 font-medium text-slate-600 block"
                          >
                            <LogIn className="w-3.5 h-3.5 text-purple-500" /> Seller Login
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Shopping Cart Trigger icon */}
            <div className="relative">
              <div 
                onClick={() => setIsCartOpen(!isCartOpen)}
                className="flex items-center gap-1.5 cursor-pointer group"
              >
                <div className="relative p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md transition group-hover:border-orange-400">
                  <ShoppingCart className="w-4 h-4 text-slate-600 group-hover:text-orange-500 transition" />
                  {cartQuantity > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-550 bg-orange-500 text-white text-[9px] font-bold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center shadow-xs">
                      {cartQuantity}
                    </span>
                  )}
                </div>
                <div className="text-left hidden lg:block select-none">
                  <span className="text-[9px] text-slate-400 block font-medium leading-none">My Cart</span>
                  <span className="text-[11px] font-bold text-orange-500 leading-none mt-1 block">৳{cartTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Expanded Cart Side Modal Block */}
              {isCartOpen && (
                <div className="absolute right-0 mt-2 w-76 bg-white rounded-md shadow-lg border border-slate-200 p-3.5 text-slate-800 animate-fadeIn z-50">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <h3 className="text-xs font-bold text-slate-800">Your Cart ({cartQuantity})</h3>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="text-slate-400 hover:text-red-500 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {cart.length === 0 ? (
                    <div className="text-center py-5">
                      <p className="text-xs text-slate-405 text-slate-450 mb-2">Your Shopping Cart is empty</p>
                      <button 
                        onClick={() => setIsCartOpen(false)}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-3 py-1 rounded text-[11px] transition"
                      >
                        Start Shopping
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="max-h-52 overflow-y-auto space-y-2.5 mb-3 scrollbar-thin">
                        {cart.map(item => (
                          <div key={item.cartItemId} className="flex gap-2 items-center justify-between text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                            <img 
                              src={item.selectedVariation?.image || item.product.thumbnail} 
                              alt={item.product.title} 
                              className="w-8 h-8 object-cover rounded border border-slate-250 shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-800 truncate" title={item.product.title}>{item.product.title}</p>
                              {item.selectedVariation?.attributes && (
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {Object.entries(item.selectedVariation.attributes).map(([k, v]) => {
                                    let displayVal = String(v);
                                    if (k.toLowerCase() === 'color' && displayVal.includes(' - ')) {
                                      displayVal = displayVal.split(' - ')[0];
                                    }
                                    return (
                                      <span key={k} className="text-[9px] text-slate-500 bg-slate-100 px-1 py-0.5 rounded leading-none border border-slate-200">
                                        {displayVal}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                              <p className="text-[10px] text-slate-455 mt-0.5">৳{(item.selectedVariation?.price || item.product.price).toLocaleString()} x {item.quantity}</p>
                            </div>
                            <button 
                              onClick={() => onRemoveFromCart(item.cartItemId)}
                              className="text-red-500 hover:text-red-700 font-bold p-1 rounded hover:bg-slate-50"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-slate-100 pt-2 mb-2 text-xs">
                        <div className="flex justify-between items-center text-slate-450 mb-0.5">
                          <span>Subtotal</span>
                          <span className="font-bold text-slate-800">৳{cartTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center font-bold text-slate-800 text-[13px]">
                          <span>Est. Total</span>
                          <span className="text-orange-500">৳{cartTotal.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <button 
                          onClick={onClearCart}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1.5 rounded transition text-center"
                        >
                          Clear
                        </button>
                        <Link 
                          to="/checkout"
                          onClick={() => setIsCartOpen(false)}
                          className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-1.5 rounded transition text-center select-none block"
                        >
                          Checkout
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* FULL WIDTH CATEGORY MENU (Desktop Only) */}
      <div className="hidden lg:block w-full bg-[#002d5b] border-t border-[#002d5b]">
        <div className="max-w-7xl mx-auto flex w-full text-white relative z-40 flex-wrap justify-between px-2">
          {dbCategories.map((cat) => {
            const subCats = dbSubCategories.filter(s => s.category_id === cat.id);
            const hasSubCats = subCats.length > 0;
            const isActive = activeCategory === cat.name;

            return (
              <div 
                key={cat.id}
                className="relative group flex-1 text-center"
                onMouseEnter={() => {
                  setHoveredCategory(cat.id);
                  setHoveredSubCategory(null);
                }}
                onMouseLeave={() => {
                  setHoveredCategory(null);
                  setHoveredSubCategory(null);
                }}
              >
                <button
                  onClick={() => {
                    navigate(`/${cat.slug || generateSlug(cat.name)}`);
                    onSelectCategory(cat.name);
                  }}
                  className={`w-full py-3 px-1 text-[11px] xl:text-[13px] font-bold transition cursor-pointer truncate ${
                    isActive ? "bg-orange-500 text-white" : "hover:bg-orange-500/80"
                  }`}
                >
                  {cat.name}
                </button>

                {/* Sub-Category Dropdown */}
                {hoveredCategory === cat.id && hasSubCats && (
                  <div className="absolute left-0 top-full w-56 bg-white border border-slate-200 shadow-2xl rounded-b z-[60] text-left">
                    <div className="w-full py-2 custom-scrollbar">
                      {subCats.map(sub => {
                        const subSubCats = dbSubSubCategories.filter(ss => ss.sub_category_id === sub.id);
                        const hasSubSubCats = subSubCats.length > 0;

                        return (
                          <div 
                            key={sub.id}
                            className="relative"
                            onMouseEnter={() => setHoveredSubCategory(sub.id)}
                          >
                            <button
                              onClick={() => {
                                navigate(`/${cat.slug || generateSlug(cat.name)}/${sub.slug || generateSlug(sub.name)}`);
                                onSelectCategory(cat.name, true);
                              }}
                              className={`w-full text-left px-4 py-2 text-[12px] flex items-center justify-between transition cursor-pointer ${
                                hoveredSubCategory === sub.id
                                  ? "bg-orange-50 text-orange-600 font-bold" 
                                  : "text-slate-700 hover:bg-slate-50 hover:text-orange-600 font-medium"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 truncate">
                                {sub.image_url ? (
                                  <img src={sub.image_url} alt="" className="w-4 h-4 object-contain" />
                                ) : (
                                  <div className="w-1 h-1 bg-slate-300 rounded-full flex-shrink-0" />
                                )}
                                <span className="truncate">{sub.name}</span>
                              </div>
                              {hasSubSubCats && (
                                <ChevronRight className={`w-3.5 h-3.5 ${hoveredSubCategory === sub.id ? "text-orange-500" : "text-slate-300"}`} />
                              )}
                            </button>

                            {/* Sub-Sub-Category Flyout */}
                            {hoveredSubCategory === sub.id && hasSubSubCats && (
                              <div className="absolute left-full top-0 w-56 bg-white border border-slate-200 shadow-2xl rounded z-[70] py-2">
                                {subSubCats.map(subSub => {
                                  const url = `/${cat.slug || generateSlug(cat.name)}/${sub.slug || generateSlug(sub.name)}/${subSub.slug || generateSlug(subSub.name)}`;
                                  return (
                                    <button
                                      key={subSub.id}
                                      onClick={() => {
                                        navigate(url);
                                        onSelectCategory(cat.name, true);
                                      }}
                                      className="w-full text-left px-4 py-2 text-[12px] flex items-center gap-2.5 transition cursor-pointer text-slate-700 hover:bg-slate-50 hover:text-orange-600 font-medium"
                                    >
                                      {subSub.image_url ? (
                                        <img src={subSub.image_url} alt="" className="w-4 h-4 object-contain" />
                                      ) : (
                                        <div className="w-1.5 h-1.5 border border-slate-300 rounded-[1px] flex-shrink-0" />
                                      )}
                                      <span className="truncate">{subSub.name}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL: SELLER ZONE REGISTRATION POPUP - REMOVED */}

      {/* MOBILE CATEGORY NAVIGATION DRAWER */}
      {isCategoryMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-[100] md:hidden animate-fadeIn" 
          onClick={() => setIsCategoryMenuOpen(false)} 
        />
      )}
      
      <div className={`fixed top-0 left-0 h-full w-72 bg-white z-[101] md:hidden shadow-2xl transition-transform duration-300 transform ${isCategoryMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col category-dropdown-container`}>
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-slate-800">
          <span className="text-sm font-bold uppercase tracking-wide">Categories</span>
          <button onClick={() => setIsCategoryMenuOpen(false)} className="text-slate-400 hover:text-slate-650 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Drawer Categories List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {dbCategories.map((cat) => {
            const subCats = dbSubCategories.filter(s => s.category_id === cat.id);
            const hasSub = subCats.length > 0;
            return (
              <div key={cat.id} className="border-b border-slate-50 last:border-0 pb-1">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setIsCategoryMenuOpen(false);
                      navigate(`/${cat.slug || generateSlug(cat.name)}`);
                    }}
                    className="flex-1 text-left py-2.5 px-3 text-[13px] font-bold text-slate-700 hover:text-orange-500 transition-colors capitalize"
                  >
                    {cat.name}
                  </button>
                  {hasSub && (
                    <button 
                      onClick={() => setExpandedMobileCat(expandedMobileCat === cat.id ? null : cat.id)}
                      className="p-2.5 text-slate-450 hover:text-orange-500 transition-colors"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expandedMobileCat === cat.id ? 'rotate-180 text-orange-500' : ''}`} />
                    </button>
                  )}
                </div>

                {/* Mobile Subcategories Accordion */}
                {expandedMobileCat === cat.id && hasSub && (
                  <div className="pl-6 bg-slate-50 rounded-lg py-1.5 space-y-1 mt-0.5 border-l-2 border-orange-500/20">
                    {subCats.map(sub => {
                      const subSubCats = dbSubSubCategories.filter(ss => ss.sub_category_id === sub.id);
                      const hasSubSub = subSubCats.length > 0;

                      if (hasSubSub) {
                        return (
                          <div key={sub.id} className="w-full">
                            <div className="flex items-center justify-between">
                              <button
                                onClick={() => {
                                  setIsCategoryMenuOpen(false);
                                  navigate(`/${cat.slug || generateSlug(cat.name)}/${sub.slug || generateSlug(sub.name)}`);
                                }}
                                className="flex-1 text-left py-2 px-3 text-[12px] text-slate-650 hover:text-orange-500 font-medium block truncate capitalize"
                              >
                                {sub.name}
                              </button>
                              <button 
                                onClick={() => setExpandedMobileSubCat(expandedMobileSubCat === sub.id ? null : sub.id)}
                                className="p-2 text-slate-450 hover:text-orange-500 transition-colors"
                              >
                                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${expandedMobileSubCat === sub.id ? 'rotate-180 text-orange-500' : ''}`} />
                              </button>
                            </div>

                            {/* Mobile Sub-Subcategories Accordion */}
                            {expandedMobileSubCat === sub.id && (
                              <div className="pl-4 bg-slate-100/60 rounded-md py-1 space-y-0.5 mt-0.5 border-l border-slate-350 border-slate-200">
                                {subSubCats.map(subSub => {
                                  const url = `/${cat.slug || generateSlug(cat.name)}/${sub.slug || generateSlug(sub.name)}/${subSub.slug || generateSlug(subSub.name)}`;
                                  return (
                                    <button
                                      key={subSub.id}
                                      onClick={() => {
                                        setIsCategoryMenuOpen(false);
                                        navigate(url);
                                      }}
                                      className="w-full text-left py-1.5 px-3 text-[11px] text-slate-500 hover:text-orange-500 font-normal block truncate capitalize"
                                    >
                                      {subSub.name}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setIsCategoryMenuOpen(false);
                            navigate(`/${cat.slug || generateSlug(cat.name)}/${sub.slug || generateSlug(sub.name)}`);
                          }}
                          className="w-full text-left py-2 px-3 text-[12px] text-slate-650 hover:text-orange-500 font-medium block truncate capitalize"
                        >
                          {sub.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Drawer Footer with Seller Zone & Track Order */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2 text-xs">
          <button 
            onClick={() => {
              setIsCategoryMenuOpen(false);
              handleSellerZoneClick();
            }}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Seller Zone
          </button>
          <Link 
            to="/track-order"
            onClick={() => setIsCategoryMenuOpen(false)}
            className="w-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition text-center block"
          >
            Track Order
          </Link>
        </div>
      </div>
    </header>
  );
}
