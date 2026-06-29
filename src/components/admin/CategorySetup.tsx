import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { uploadToCpanel } from '../../utils/mediaUpload';
import { useToast } from '../ToastContext';
import { generateSlug } from '../../utils/slugs';

export default function CategorySetup() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [priority, setPriority] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // For multi-language tabs (visual only)
  const [activeTab, setActiveTab] = useState('en');

  useEffect(() => {
    fetchCategories();
    if (isEditMode) {
      fetchCategory();
    }
  }, [id]);

  const fetchCategory = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*').eq('id', id).single();
      if (error) throw error;
      if (data) {
        setName(data.name);
        setPriority(data.priority?.toString() || '');
        setImagePreview(data.image_url);
      }
    } catch (err) {
      console.error('Error fetching category:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('priority', { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const url = await uploadToCpanel(file, 'categories');
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
    if (!name) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    setSaving(true);
    try {


      if (isEditMode) {
        const { error } = await supabase.from('categories').update({
          name,
          priority: priority ? parseInt(priority) : null,
          image_url: imagePreview || 'https://via.placeholder.com/500',
        }).eq('id', id);
        if (error) throw error;
        showToast('Category updated successfully!');
        navigate('/admin/categories');
      } else {
        const { error } = await supabase.from('categories').insert([{
          name,
          priority: priority ? parseInt(priority) : null,
          image_url: imagePreview || 'https://via.placeholder.com/500',
          is_home_category: true
        }]);
        if (error) throw error;
        showToast('Category added successfully!');
        setName('');
        setPriority('');
        setImagePreview(null);
        fetchCategories();
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving category', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleHomeStatus = async (id: string, currentStatus: boolean) => {
    try {
      await supabase.from('categories').update({ is_home_category: !currentStatus }).eq('id', id);
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await supabase.from('categories').delete().eq('id', id);
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-lg font-bold text-slate-800">{isEditMode ? 'Edit Category' : 'Category Setup'}</h1>
      </div>

      {/* Setup Form */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">


        <form onSubmit={handleSubmit}>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1 space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Category Name *
                </label>
                <input 
                  type="text" 
                  placeholder="New Category"
                  className="w-full border border-slate-300 rounded p-2 text-[13px] outline-none focus:border-blue-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Priority <span className="text-slate-400">ⓘ</span>
                </label>
                <select 
                  className="w-full border border-slate-300 rounded p-2 text-[13px] text-slate-700 outline-none focus:border-blue-500"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="">Set Priority</option>
                  {[...Array(10)].map((_, i) => (
                    <option key={i+1} value={i+1}>{i+1}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Category Logo * <span className="text-teal-500">Ratio 1:1 (500 x 500 px)</span>
                </label>
                <div className="flex items-center border border-slate-300 rounded overflow-hidden">
                  <span className="flex-1 px-3 py-2 text-[13px] text-slate-500">Choose File</span>
                  <label className="bg-slate-100 border-l border-slate-300 px-4 py-2 text-[13px] font-medium text-slate-700 cursor-pointer hover:bg-slate-200">
                    Browse
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-64 flex flex-col items-center justify-center">
              <div className="w-40 h-40 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden">
                {isUploading ? (
                  <div className="text-slate-400 text-sm animate-pulse">Uploading...</div>
                ) : imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-12 h-12 text-slate-300" />
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button type="button" onClick={() => {
              if (isEditMode) navigate('/admin/categories');
              else { setName(''); setPriority(''); setImagePreview(null); }
            }} disabled={saving || isUploading} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[13px] font-medium transition">
              {isEditMode ? 'Cancel' : 'Reset'}
            </button>
            <button type="submit" disabled={saving || isUploading} className="px-6 py-2 bg-[#0070c0] hover:bg-[#005a9c] text-white rounded text-[13px] font-medium transition disabled:opacity-50">
              {saving ? 'Submitting...' : (isEditMode ? 'Update' : 'Submit')}
            </button>
          </div>
        </form>
      </div>

      {/* Category List */}
      {!isEditMode && (
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-slate-800 text-sm">Category List</h2>
            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{categories.length}</span>
          </div>
          <div className="flex w-64">
            <input 
              type="text" 
              placeholder="Search here" 
              className="w-full border border-slate-300 rounded-l p-1.5 text-[13px] outline-none focus:border-[#0070c0]"
            />
            <button className="bg-[#0070c0] hover:bg-[#005a9c] text-white px-3 rounded-r font-medium text-[13px] transition">
              Search
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] whitespace-nowrap">
            <thead className="text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4 w-16">ID</th>
                <th className="p-4 text-center">Category Image</th>
                <th className="p-4">Name</th>
                <th className="p-4 text-center">Priority</th>
                <th className="p-4 text-center">Home Category Status</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((cat, idx) => (
                <tr key={cat.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 text-slate-600">{idx + 1}</td>
                  <td className="p-4 text-center">
                    <img src={cat.image_url} alt={cat.name} className="w-10 h-10 object-cover mx-auto rounded border border-slate-200" />
                  </td>
                  <td className="p-4 font-medium text-slate-800">{cat.name}</td>
                  <td className="p-4 text-center text-slate-600">{cat.priority}</td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => toggleHomeStatus(cat.id, cat.is_home_category)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${cat.is_home_category ? 'bg-blue-500' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${cat.is_home_category ? 'translate-x-5' : ''}`}></div>
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Link to={`/admin/categories/edit/${cat.id}`} className="w-7 h-7 flex items-center justify-center text-teal-500 border border-teal-200 rounded hover:bg-teal-50 transition">
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                      <button 
                        onClick={() => deleteCategory(cat.id)}
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
      )}
    </div>
  );
}
