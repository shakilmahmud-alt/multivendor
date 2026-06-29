import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { UploadCloud, User, Lock, Store, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { uploadToCpanel } from '../utils/mediaUpload';

export default function SellerSignUp() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    shop_name: '',
    shop_address: ''
  });

  // Mock file states
  const [sellerImage, setSellerImage] = useState<File | null>(null);
  const [shopLogo, setShopLogo] = useState<File | null>(null);
  const [shopBanner, setShopBanner] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files.length > 0) {
      setter(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // Check if shop name already exists
      const { data: existingShop } = await supabase
        .from('sellers')
        .select('id')
        .ilike('shop_name', formData.shop_name);

      if (existingShop && existingShop.length > 0) {
        alert(`The shop name "${formData.shop_name}" is already taken. Please choose a different name (e.g. ${formData.shop_name} 2)`);
        setLoading(false);
        return;
      }

      // In a real app, we would upload files to storage here and get their public URLs.
      let finalImageUrl = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop';
      let finalLogoUrl = 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=100&h=100&fit=crop';
      let finalBannerUrl = 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1000&h=250&fit=crop';

      try {
        if (sellerImage) finalImageUrl = await uploadToCpanel(sellerImage, 'vendors');
        if (shopLogo) finalLogoUrl = await uploadToCpanel(shopLogo, 'vendors');
        if (shopBanner) finalBannerUrl = await uploadToCpanel(shopBanner, 'vendors');
      } catch (uploadError) {
        console.error('cPanel upload error:', uploadError);
        alert('Failed to upload one or more images. Please try again.');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.from('sellers').insert([{
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        password: formData.password, // plain text for mockup only
        shop_name: formData.shop_name,
        shop_address: formData.shop_address,
        seller_image_url: finalImageUrl,
        shop_logo_url: finalLogoUrl,
        shop_banner_url: finalBannerUrl,
        status: 'Inactive'
      }]);

      if (error) throw error;

      // Notify admin about new seller request
      await supabase.from('notifications').insert([{
        target_role: 'admin',
        title: 'New Seller Request',
        message: `Seller "${formData.shop_name}" submitted a new seller account request.`,
        link: '/admin/sellers',
        is_read: false
      }]);

      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (err: any) {
      console.error('Error signing up seller:', err);
      alert('Error creating account. Email may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="flex-1 flex justify-center items-start py-10 px-4">
        <div className="bg-white max-w-3xl w-full rounded-lg shadow-lg border border-slate-200 overflow-hidden">
          
          <div className="bg-slate-900 p-6 text-center text-white">
            <h1 className="text-2xl font-black mb-2">Register as a Verified Store</h1>
            <p className="text-sm text-slate-300">Reach millions of buyers by registering your multi-vendor shop in HolidayMart.</p>
          </div>

          {success ? (
            <div className="p-16 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Your seller account request is submitted successfully.</h2>
              <p className="text-slate-500 mb-6">Our administration team will review your details and activate your account shortly. You will be redirected to the homepage.</p>
              <button onClick={() => navigate('/')} className="bg-orange-500 text-white px-6 py-2 rounded font-bold hover:bg-orange-600">Return to Home</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
              
              {/* SECTION 1: Seller Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                  <User className="w-4 h-4 text-orange-500" /> Seller Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Full Name</label>
                    <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-orange-500" placeholder="e.g. John Doe" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Phone Number</label>
                    <input type="text" name="phone" required value={formData.phone} onChange={handleChange} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-orange-500" placeholder="e.g. +880 1712 345678" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1">Seller Profile Image</label>
                    <div className="flex items-center gap-4">
                      {sellerImage ? (
                        <div className="w-12 h-12 rounded bg-slate-100 overflow-hidden shrink-0 border border-slate-300">
                          <img src={URL.createObjectURL(sellerImage)} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded bg-slate-50 flex items-center justify-center shrink-0 border border-dashed border-slate-300 text-slate-400">
                          <User className="w-5 h-5" />
                        </div>
                      )}
                      <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, setSellerImage)} className="text-xs text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Account Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Lock className="w-4 h-4 text-emerald-500" /> Account Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 mb-1">Email Address</label>
                    <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-orange-500" placeholder="e.g. seller@example.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Password</label>
                    <input type="password" name="password" required value={formData.password} onChange={handleChange} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-orange-500" placeholder="••••••••" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Confirm Password</label>
                    <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-orange-500" placeholder="••••••••" />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Shop Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Store className="w-4 h-4 text-blue-500" /> Shop Information
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Shop Name</label>
                    <input type="text" name="shop_name" required value={formData.shop_name} onChange={handleChange} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-orange-500" placeholder="e.g. Dhaka Express Logistics" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Shop Address</label>
                    <textarea name="shop_address" required value={formData.shop_address} onChange={handleChange} rows={2} className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-orange-500 resize-none" placeholder="Enter full shop address"></textarea>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* Logo Upload */}
                    <div className="border border-slate-200 rounded p-4 flex flex-col items-center justify-center text-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 border-2 border-dashed border-slate-300 rounded flex items-center justify-center shrink-0 overflow-hidden">
                        {shopLogo ? (
                          <img src={URL.createObjectURL(shopLogo)} alt="Logo Preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">Shop Logo</p>
                        <p className="text-[10px] text-slate-400 mb-2">Ratio 1:1</p>
                        <input type="file" id="shop-logo" accept="image/*" onChange={(e) => handleFileChange(e, setShopLogo)} className="hidden" />
                        <label htmlFor="shop-logo" className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1.5 px-3 rounded cursor-pointer transition">Choose File</label>
                      </div>
                    </div>

                    {/* Banner Upload */}
                    <div className="border border-slate-200 rounded p-4 flex flex-col items-center justify-center text-center gap-3">
                      <div className="w-full h-16 bg-slate-50 border-2 border-dashed border-slate-300 rounded flex items-center justify-center shrink-0 overflow-hidden">
                        {shopBanner ? (
                          <img src={URL.createObjectURL(shopBanner)} alt="Banner Preview" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">Shop Banner</p>
                        <p className="text-[10px] text-slate-400 mb-2">Ratio 4:1 (2000 x 500 px)</p>
                        <input type="file" id="shop-banner" accept="image/*" onChange={(e) => handleFileChange(e, setShopBanner)} className="hidden" />
                        <label htmlFor="shop-banner" className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1.5 px-3 rounded cursor-pointer transition">Choose File</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-4 rounded transition flex justify-center items-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>Submit Vendor Application <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}
