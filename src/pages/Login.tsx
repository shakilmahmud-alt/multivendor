import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useToast } from '../components/ToastContext';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'customer' | 'seller'>('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    identifier: '', // Email or Phone
    password: '',
    rememberMe: false
  });

  // Sync tab state with URL parameter if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'seller') {
      setActiveTab('seller');
    } else {
      setActiveTab('customer');
    }
  }, [location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTabSwitch = (tab: 'customer' | 'seller') => {
    setActiveTab(tab);
    navigate(`/login?tab=${tab}`, { replace: true });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let user = null;
      let role = activeTab;

      // Check for Admin (from admins table)
      const { data: adminData } = await supabase
        .from('admins')
        .select('*')
        .eq('email', formData.identifier)
        .eq('password', formData.password)
        .single();

      if (adminData) {
        user = { id: adminData.id, name: 'Admin', email: adminData.email };
        role = 'admin';
      } else {
        const table = activeTab === 'customer' ? 'customers' : 'sellers';
        
        // Since it could be email or phone, we need to query both
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .or(`email.eq.${formData.identifier},phone.eq.${formData.identifier}`)
          .eq('password', formData.password)
          .single();

        if (error || !data) {
          throw new Error('Invalid credentials');
        }
        user = data;
      }

      // Save session
      localStorage.setItem('user', JSON.stringify({ ...user, role }));

      // Fetch user's wishlist from Supabase
      if (role === 'customer' || role === 'seller') {
        const { data: wlData } = await supabase
          .from('wishlists')
          .select('product_id')
          .eq('user_id', user.id);
          
        if (wlData && wlData.length > 0) {
          const productIds = wlData.map(w => w.product_id);
          const { data: prodData } = await supabase
            .from('in_house_products')
            .select('*, brand:brands(name)')
            .in('id', productIds);
            
          if (prodData) {
            const transformedWishlist = prodData.map(p => {
              const unitPrice = parseFloat(p.unit_price) || 0;
              const discountAmt = parseFloat(p.discount_amount) || 0;
              const discountType = p.discount_type || 'Flat';
              let actualPrice = unitPrice;
              let discountBadgeValue = undefined;
              if (discountAmt > 0) {
                if (discountType === 'Percent') {
                  actualPrice = Math.round(unitPrice - (unitPrice * (discountAmt / 100)));
                  discountBadgeValue = `-${discountAmt}%`;
                } else {
                  actualPrice = Math.round(unitPrice - discountAmt);
                  discountBadgeValue = `-${discountAmt}`;
                }
              }
              return {
                id: p.id,
                title: p.name_en,
                price: actualPrice,
                oldPrice: unitPrice,
                rating: 0,
                reviewCount: 0,
                thumbnail: p.thumbnail_url || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
                category: p.category_id ? String(p.category_id) : 'Category',
                brand: p.brand?.name || '',
                discountBadge: discountBadgeValue,
                storeName: p.attributes?.shop_name || 'Store',
                storeId: p.attributes?.seller_id || 'admin',
                productCode: p.sku,
                slug: p.slug
              };
            });
            localStorage.setItem('wishlist', JSON.stringify(transformedWishlist));
          }
        }
      }

      showToast(`Successfully logged in as ${role}!`, 'success');
      
      // Redirect based on role
      if (role === 'admin') {
        window.location.href = '/admin';
      } else if (role === 'seller') {
        window.location.href = '/seller';
      } else {
        window.location.href = '/my-account';
      }
      
    } catch (err) {
      console.error('Login error:', err);
      showToast('Invalid Email/Phone or Password. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-10 px-4 font-sans">
      
      <div className="bg-white w-full max-w-xl rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button 
            onClick={() => handleTabSwitch('customer')}
            className={`flex-1 py-4 text-sm font-bold transition ${activeTab === 'customer' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            Customer Login
          </button>
          <button 
            onClick={() => handleTabSwitch('seller')}
            className={`flex-1 py-4 text-sm font-bold transition ${activeTab === 'seller' ? 'text-orange-500 border-b-2 border-orange-500' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            Seller Login
          </button>
        </div>

        <div className="p-8 md:p-12">
          <h1 className="text-2xl font-bold text-center text-slate-800 mb-8">Login</h1>

          <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
            
            {/* Email / Phone */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email / Phone</label>
              <input 
                type="text" 
                name="identifier"
                required
                value={formData.identifier}
                onChange={handleChange}
                placeholder="Enter email address or phone number" 
                className="w-full px-4 py-3 rounded border border-slate-300 focus:outline-none focus:border-orange-500 text-sm"
              />
            </div>
            
            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password must be 7+ Character" 
                  className="w-full px-4 py-3 rounded border border-slate-300 focus:outline-none focus:border-orange-500 text-sm pr-10"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="rememberMe" 
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 cursor-pointer"
                />
                <label htmlFor="rememberMe" className="text-sm text-slate-600 cursor-pointer">
                  Remember me
                </label>
              </div>
              <a href="#" className="text-sm font-medium text-orange-500 hover:text-orange-600 transition">
                Forgot password?
              </a>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 px-4 rounded transition shadow-sm"
              >
                {loading ? "Logging in..." : "Log in"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
