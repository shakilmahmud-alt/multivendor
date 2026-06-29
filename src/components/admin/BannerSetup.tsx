import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { uploadToCpanel } from '../../utils/mediaUpload';
import { useToast } from '../ToastContext';
import { Edit, Trash2, Image as ImageIcon, Plus } from 'lucide-react';

export default function BannerSetup() {
  const { showToast } = useToast();
  const [banners, setBanners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);

  // Form states
  const [bannerType, setBannerType] = useState('Main Banner');
  const [targetUrl, setTargetUrl] = useState('');
  const [resourceType, setResourceType] = useState('Product');
  const [resourceId, setResourceId] = useState('');
  const [placementCategoryId, setPlacementCategoryId] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchBanners();
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('banners').select('*').order('created_at', { ascending: false });
    if (!error && data) {
      setBanners(data);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name').order('priority', { ascending: true });
    if (data) setCategories(data);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('id, title').eq('status', 'Published');
    if (data) setProducts(data);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const url = await uploadToCpanel(file, 'banners');
        setImagePreview(url);
        showToast('Image uploaded successfully!');
      } catch (err) {
        showToast('Failed to upload image', 'error');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePreview) {
      showToast('Please upload a banner image.', 'error');
      return;
    }

    setSaving(true);
    try {
      if (editingBannerId) {
        const { error } = await supabase.from('banners').update({
          banner_type: bannerType,
          target_url: targetUrl,
          resource_type: resourceType,
          resource_id: resourceId || null,
          placement_category_id: (bannerType === 'Section Banner (Full Width)' || bannerType === 'Section Banner (Half Width)') ? placementCategoryId : null,
          image_url: imagePreview
        }).eq('id', editingBannerId);

        if (error) throw error;
        showToast('Banner updated successfully!');
      } else {
        const { error } = await supabase.from('banners').insert([{
          banner_type: bannerType,
          target_url: targetUrl,
          resource_type: resourceType,
          resource_id: resourceId || null,
          placement_category_id: (bannerType === 'Section Banner (Full Width)' || bannerType === 'Section Banner (Half Width)') ? placementCategoryId : null,
          image_url: imagePreview,
          published: true
        }]);

        if (error) throw error;
        showToast('Banner added successfully!');
      }
      resetForm();
      fetchBanners();
    } catch (err: any) {
      showToast(err.message || 'Error saving banner', 'error');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (banner: any) => {
    setEditingBannerId(banner.id);
    setBannerType(banner.banner_type);
    setTargetUrl(banner.target_url || '');
    setResourceType(banner.resource_type || 'Product');
    setResourceId(banner.resource_id || '');
    setPlacementCategoryId(banner.placement_category_id || '');
    setImagePreview(banner.image_url);
    setIsFormOpen(true);
  };

  const togglePublishedStatus = async (id: string, currentStatus: boolean) => {
    try {
      await supabase.from('banners').update({ published: !currentStatus }).eq('id', id);
      fetchBanners();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteBanner = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    try {
      const { error } = await supabase.from('banners').delete().eq('id', id);
      if (error) throw error;
      fetchBanners();
      showToast('Banner deleted.');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Error deleting banner', 'error');
    }
  };

  const resetForm = () => {
    setEditingBannerId(null);
    setBannerType('Main Banner');
    setTargetUrl('');
    setResourceType('Product');
    setResourceId('');
    setPlacementCategoryId('');
    setImagePreview(null);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center gap-2 mb-6 text-[#1e293b]">
        <ImageIcon className="w-5 h-5 text-orange-500" />
        <h1 className="text-lg font-bold text-slate-800">Banner Setup (Default)</h1>
      </div>

      {/* Banner Form Toggle */}
      {isFormOpen && (
        <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden mb-6 animate-fadeIn">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h2 className="font-bold text-slate-800 text-sm">{editingBannerId ? 'Edit Banner' : 'Banner Form'}</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Left side inputs */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Banner Type</label>
                    <select 
                      value={bannerType}
                      onChange={(e) => setBannerType(e.target.value)}
                      className="w-full border border-slate-300 rounded p-2 text-[13px] outline-none focus:border-blue-500"
                    >
                      <option value="Main Banner">Main Banner</option>
                      <option value="Popup Banner">Popup Banner</option>
                      <option value="Section Banner (Full Width)">Section Banner (Full Width)</option>
                      <option value="Section Banner (Half Width)">Section Banner (Half Width)</option>
                      <option value="Footer Banner">Footer Banner</option>
                    </select>
                  </div>

                  {(bannerType === 'Section Banner (Full Width)' || bannerType === 'Section Banner (Half Width)') && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Placement (After Category)</label>
                      <select 
                        value={placementCategoryId}
                        onChange={(e) => setPlacementCategoryId(e.target.value)}
                        className="w-full border border-slate-300 rounded p-2 text-[13px] outline-none focus:border-blue-500"
                      >
                        <option value="">Select a Category Block</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Banner URL</label>
                    <input 
                      type="text" 
                      placeholder="Enter url"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      className="w-full border border-slate-300 rounded p-2 text-[13px] outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Resource Type</label>
                    <select 
                      value={resourceType}
                      onChange={(e) => setResourceType(e.target.value)}
                      className="w-full border border-slate-300 rounded p-2 text-[13px] outline-none focus:border-blue-500"
                    >
                      <option value="Product">Product</option>
                      <option value="Category">Category</option>
                      <option value="Brand">Brand</option>
                      <option value="External">External</option>
                    </select>
                  </div>

                  {(resourceType === 'Product' || resourceType === 'Category') && (
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">{resourceType}</label>
                      <select 
                        value={resourceId}
                        onChange={(e) => setResourceId(e.target.value)}
                        className="w-full border border-slate-300 rounded p-2 text-[13px] outline-none focus:border-blue-500"
                      >
                        <option value="">Select {resourceType}</option>
                        {resourceType === 'Product' ? (
                          products.map(p => (
                            <option key={p.id} value={p.id}>{p.title}</option>
                          ))
                        ) : (
                          categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))
                        )}
                      </select>
                    </div>
                  )}
                </div>

                {/* Right side upload */}
                <div>
                  <div className={`w-full h-40 border-2 border-dashed ${imagePreview ? 'border-slate-300' : 'border-[#0070c0]'} rounded-lg flex flex-col items-center justify-center p-4 relative overflow-hidden group hover:bg-slate-50 transition cursor-pointer`}>
                    {isUploading ? (
                      <div className="text-[#0070c0] text-sm animate-pulse font-medium">Uploading...</div>
                    ) : imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-center">
                        <p className="text-[#0070c0] text-[13px] font-medium">Drag and drop file or Browse file</p>
                      </div>
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={handleFileChange} />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">
                    Banner Image Ratio 3:1<br/>
                    Banner Image ratio is not same for all sections in website. Please review the ratio before upload
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={resetForm} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[13px] font-medium transition">
                  Reset
                </button>
                 <button type="submit" disabled={saving || isUploading} className="px-6 py-2 bg-[#0070c0] hover:bg-[#005a9c] text-white rounded text-[13px] font-medium transition disabled:opacity-50">
                  {saving ? 'Saving...' : (editingBannerId ? 'Update' : 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Banner List Table */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-800 text-sm">Banner Table</h2>
            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{banners.length}</span>
          </div>
          
          <div className="flex items-center gap-3">
            <select className="border border-slate-300 rounded p-1.5 text-[13px] outline-none min-w-[150px] focus:border-[#0070c0]">
              <option value="All">All</option>
              <option value="Main Banner">Main Banner</option>
              <option value="Popup Banner">Popup Banner</option>
            </select>
            <button className="bg-[#0070c0] hover:bg-[#005a9c] text-white px-4 py-1.5 rounded font-medium text-[13px] transition">
              Filter
            </button>
            <button 
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="bg-[#0070c0] hover:bg-[#005a9c] text-white px-4 py-1.5 rounded font-medium text-[13px] transition flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Banner
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] whitespace-nowrap">
            <thead className="text-slate-600 font-bold border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="p-4 w-16">SL</th>
                <th className="p-4">Image</th>
                <th className="p-4">Banner Type</th>
                <th className="p-4">Published</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {banners.map((banner, idx) => (
                <tr key={banner.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 text-slate-600">{idx + 1}</td>
                  <td className="p-4">
                    <img src={banner.image_url} alt="Banner" className="h-8 object-contain rounded border border-slate-200" />
                  </td>
                  <td className="p-4 font-medium text-slate-800">
                    {banner.banner_type}
                    {banner.placement_category_id && (
                      <span className="block text-[10px] text-slate-500 font-normal mt-0.5">After: {banner.placement_category_id}</span>
                    )}
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => togglePublishedStatus(banner.id, banner.published)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${banner.published ? 'bg-[#0070c0]' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${banner.published ? 'translate-x-5' : ''}`}></div>
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => startEdit(banner)}
                        className="w-7 h-7 flex items-center justify-center text-[#0070c0] border border-blue-200 rounded hover:bg-blue-50 transition"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => deleteBanner(banner.id)}
                        className="w-7 h-7 flex items-center justify-center text-red-500 border border-red-200 rounded hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
