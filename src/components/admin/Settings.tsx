import React, { useState, useEffect } from 'react';
import { User, Lock, Upload, Info, Store } from 'lucide-react';
import { useToast } from '../ToastContext';
import { supabase } from '../../supabaseClient';
import { uploadToCpanel } from '../../utils/mediaUpload';

export default function Settings() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'basic' | 'password' | 'shop'>('basic');
  const [user, setUser] = useState<any>(null);
  const [shopLogo, setShopLogo] = useState('');
  const [shopBanner, setShopBanner] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingProfile, setUploadingProfile] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);
      if (u.role === 'seller') {
        supabase.from('sellers').select('shop_logo_url, shop_banner_url, seller_image_url').eq('id', u.id).single().then(({data}) => {
          if(data) {
            setShopLogo(data.shop_logo_url || '');
            setShopBanner(data.shop_banner_url || '');
            setProfileImage(data.seller_image_url || '');
          }
        });
      } else if (u.role === 'admin') {
        // Admin doesn't have an image in the DB structure by default, but we can set empty
        setProfileImage('');
      }
    }
  }, []);

  const handleUpdateShopDesign = async () => {
    if (!user || user.role !== 'seller') return;
    try {
      const { error } = await supabase.from('sellers').update({
        shop_logo_url: shopLogo,
        shop_banner_url: shopBanner
      }).eq('id', user.id);
      if (error) throw error;
      showToast('Shop design updated successfully!', 'success');
    } catch (e) {
      showToast('Error updating shop design', 'error');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadingLogo(true);
      try {
        const url = await uploadToCpanel(e.target.files[0], 'vendors');
        setShopLogo(url);
        if (user && user.role === 'seller') {
          await supabase.from('sellers').update({ shop_logo_url: url }).eq('id', user.id);
        }
        showToast('Logo uploaded and saved successfully', 'success');
      } catch (err) {
        showToast('Failed to upload logo', 'error');
      } finally {
        setUploadingLogo(false);
      }
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadingBanner(true);
      try {
        const url = await uploadToCpanel(e.target.files[0], 'vendors');
        setShopBanner(url);
        if (user && user.role === 'seller') {
          await supabase.from('sellers').update({ shop_banner_url: url }).eq('id', user.id);
        }
        showToast('Banner uploaded and saved successfully', 'success');
      } catch (err) {
        showToast('Failed to upload banner', 'error');
      } finally {
        setUploadingBanner(false);
      }
    }
  };

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadingProfile(true);
      try {
        const url = await uploadToCpanel(e.target.files[0], 'vendors');
        setProfileImage(url);
        if (user && user.role === 'seller') {
          await supabase.from('sellers').update({ seller_image_url: url }).eq('id', user.id);
          
          // Also update local storage user
          const updatedUser = { ...user, image: url };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          // Dispatch custom event so Header can update
          window.dispatchEvent(new Event('user-updated'));
        }
        showToast('Profile image uploaded and saved successfully', 'success');
      } catch (err) {
        showToast('Failed to upload profile image', 'error');
      } finally {
        setUploadingProfile(false);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-2">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" /> Settings
        </h1>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Left Sidebar Menu */}
        <div className="w-full md:w-64 shrink-0 bg-white rounded-md shadow-sm border border-slate-200 p-4 sticky top-6">
          <ul className="space-y-1">
            <li>
              <button 
                onClick={() => setActiveTab('basic')}
                className={`w-full text-left px-4 py-2.5 rounded text-sm font-medium flex items-center gap-3 transition ${activeTab === 'basic' ? 'text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <User className="w-4 h-4" /> Basic Information
              </button>
            </li>
            <li>
              <button 
                onClick={() => setActiveTab('password')}
                className={`w-full text-left px-4 py-2.5 rounded text-sm font-medium flex items-center gap-3 transition ${activeTab === 'password' ? 'text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <Lock className="w-4 h-4" /> Password
              </button>
            </li>
            {user?.role === 'seller' && (
              <li>
                <button 
                  onClick={() => setActiveTab('shop')}
                  className={`w-full text-left px-4 py-2.5 rounded text-sm font-medium flex items-center gap-3 transition ${activeTab === 'shop' ? 'text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Store className="w-4 h-4" /> Shop Design
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* Right Content */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          
          {/* Cover & Profile Image block */}
          <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden">
            <div className="h-32 bg-slate-200 relative overflow-hidden">
              {/* Decorative background vectors representing a cover */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#d9e2ec] to-[#f0f4f8]"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#bcccdc] rounded-full -translate-y-32 translate-x-32 opacity-50"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#9fb3c8] rounded-full translate-y-24 -translate-x-12 opacity-30"></div>
            </div>
            <div className="px-8 pb-8 relative -mt-16 text-center">
              <div className="w-32 h-32 bg-slate-800 rounded-full border-4 border-white mx-auto shadow-md overflow-hidden flex items-center justify-center relative group">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-2xl font-bold uppercase">
                    {user?.name?.substring(0, 2) || 'US'}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white">
                  <Upload className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-bold">Update</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleProfileUpload} 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Forms */}
          {activeTab === 'basic' && (
            <div className="bg-white rounded-md shadow-sm border border-slate-200 p-6">
              <h2 className="text-sm font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">Basic Information</h2>
              
              <div className="space-y-5 max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <label className="text-sm text-slate-600 font-medium md:col-span-1 flex items-center gap-1">
                    Full Name <Info className="w-3 h-3 text-slate-400" />
                  </label>
                  <div className="md:col-span-3">
                    <input 
                      type="text" 
                      defaultValue={user?.name || ''}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <label className="text-sm text-slate-600 font-medium md:col-span-1 flex items-center gap-1">
                    Phone <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="md:col-span-3">
                    <input 
                      type="text" 
                      defaultValue="+8801711255511"
                      className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <label className="text-sm text-slate-600 font-medium md:col-span-1">Email</label>
                  <div className="md:col-span-3">
                    <input 
                      type="email" 
                      defaultValue={user?.email || ''}
                      className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                  <label className="text-sm text-slate-600 font-medium md:col-span-1 pt-2">Profile Image</label>
                  <div className="md:col-span-3">
                    <p className="text-[11px] text-cyan-500 font-bold mb-2">( Ratio 1:1 )</p>
                    <div className="flex items-center gap-3">
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={handleProfileUpload}
                        disabled={uploadingProfile}
                        className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {uploadingProfile && <span className="text-sm text-slate-500">Uploading...</span>}
                      {profileImage && !uploadingProfile && <img src={profileImage} alt="Profile" className="w-10 h-10 object-cover border border-slate-200 rounded-full" />}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    onClick={() => showToast('Basic Information Updated successfully!', 'success')}
                    className="px-6 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition shadow-sm"
                  >
                    Save changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="bg-white rounded-md shadow-sm border border-slate-200 p-6">
              <h2 className="text-sm font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">Change your password</h2>
              
              <div className="space-y-5 max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <label className="text-sm text-slate-600 font-medium md:col-span-1">New Password</label>
                  <div className="md:col-span-3">
                    <input 
                      type="password" 
                      placeholder="Enter new password"
                      className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <label className="text-sm text-slate-600 font-medium md:col-span-1">Confirm Password</label>
                  <div className="md:col-span-3">
                    <input 
                      type="password" 
                      placeholder="Confirm your new password"
                      className="w-full border border-slate-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500" 
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    onClick={() => showToast('Password updated successfully!', 'success')}
                    className="px-6 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition shadow-sm"
                  >
                    Save changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shop' && user?.role === 'seller' && (
            <div className="bg-white rounded-md shadow-sm border border-slate-200 p-6">
              <h2 className="text-sm font-bold text-slate-800 mb-6 border-b border-slate-100 pb-3">Shop Design</h2>
              
              <div className="space-y-6 max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                  <label className="text-sm text-slate-600 font-medium md:col-span-1 pt-2">Shop Logo</label>
                  <div className="md:col-span-3">
                    <p className="text-[11px] text-cyan-500 font-bold mb-2">( Recommended Ratio 1:1, Max size 2MB )</p>
                    <div className="flex items-center gap-3">
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={uploadingLogo}
                        className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {uploadingLogo && <span className="text-sm text-slate-500">Uploading...</span>}
                      {shopLogo && !uploadingLogo && <img src={shopLogo} alt="Logo" className="w-10 h-10 object-contain border border-slate-200 rounded" />}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
                  <label className="text-sm text-slate-600 font-medium md:col-span-1 pt-2">Shop Banner</label>
                  <div className="md:col-span-3">
                    <p className="text-[11px] text-cyan-500 font-bold mb-2">( Landscape Wide, Recommended 1200x300 )</p>
                    <div className="flex items-center gap-3">
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={handleBannerUpload}
                        disabled={uploadingBanner}
                        className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {uploadingBanner && <span className="text-sm text-slate-500">Uploading...</span>}
                      {shopBanner && !uploadingBanner && <img src={shopBanner} alt="Banner" className="h-10 w-auto object-cover border border-slate-200 rounded" />}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button 
                    onClick={handleUpdateShopDesign}
                    className="px-6 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition shadow-sm"
                  >
                    Save changes
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
