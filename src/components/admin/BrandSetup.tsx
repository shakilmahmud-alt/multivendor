import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Tag, Image as ImageIcon, X } from 'lucide-react';
import { useToast } from '../ToastContext';
import { uploadToCpanel } from '../../utils/mediaUpload';

export default function BrandSetup() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();
  const isEditMode = !!id;

  const [activeTab, setActiveTab] = useState<'en' | 'bd'>('en');
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      fetchBrand();
    }
  }, [id]);

  const fetchBrand = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      if (data) {
        setName(data.name);
        setLogoUrl(data.logo_url || '');
      }
    } catch (err) {
      console.error('Error fetching brand:', err);
      showToast('Failed to load brand details', 'error');
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const url = await uploadToCpanel(file, 'categories');
        setLogoUrl(url);
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
    if (!name.trim()) {
      showToast('Brand name is required', 'error');
      return;
    }
    
    setLoading(true);
    try {
      if (isEditMode) {
        const { error } = await supabase
          .from('brands')
          .update({ name, logo_url: logoUrl })
          .eq('id', id);
        if (error) throw error;
        showToast('Brand updated successfully!');
      } else {
        const { error } = await supabase
          .from('brands')
          .insert([{ name, logo_url: logoUrl, total_product: 0, total_order: 0, is_active: true }]);
        if (error) throw error;
        showToast('Brand added successfully!');
      }
      navigate('/admin/brands/list');
    } catch (err) {
      console.error('Error saving brand:', err);
      showToast('Failed to save brand', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (isEditMode) {
      fetchBrand();
    } else {
      setName('');
      setLogoUrl('');
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-6">
        <Tag className="w-5 h-5 text-orange-500" />
        <h1 className="text-lg font-bold text-slate-800">Brand Setup</h1>
      </div>

      <div className="bg-white rounded-md shadow-sm border border-slate-200">
        <div className="p-6">


          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-slate-600 mb-2">
                    Brand Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex : LUX"
                    className="w-full px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-600 mb-2">
                    Brand Logo <span className="text-red-500">*</span> <span className="text-cyan-500 text-xs">Ratio 1:1 (500 x 500 px)</span>
                  </label>
                  <div className="flex border border-slate-200 rounded-md overflow-hidden">
                    <div className="flex-1 px-4 py-2 text-sm text-slate-500 bg-white">
                      {logoUrl ? 'File selected' : 'Choose File'}
                    </div>
                    <label className="px-4 py-2 bg-slate-50 border-l border-slate-200 text-sm text-slate-700 hover:bg-slate-100 cursor-pointer transition">
                      Browse
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleLogoUpload}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column - Image Preview */}
              <div className="flex justify-center items-center">
                <div className="w-48 h-48 border border-slate-200 rounded-md bg-slate-50 flex items-center justify-center overflow-hidden">
                  {isUploading ? (
                    <div className="text-slate-400 text-sm animate-pulse">Uploading...</div>
                  ) : logoUrl ? (
                  <div className="relative w-full h-full group">
                    <img src={logoUrl} alt="Brand preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  ) : (
                    <ImageIcon className="w-12 h-12 text-slate-300" />
                  )}
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-4 mt-8">
                <button 
                  type="button" 
                  onClick={handleReset}
                  disabled={loading || isUploading}
                  className="px-6 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded hover:bg-slate-200 transition"
                >
                  Reset
                </button>
                <button 
                  type="submit" 
                  disabled={loading || isUploading}
                  className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition disabled:opacity-50"
                >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
