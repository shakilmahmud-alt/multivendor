import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useToast } from '../ToastContext';
import { LayoutDashboard, Plus, Trash2, GripVertical, Image as ImageIcon } from 'lucide-react';
import { uploadToCpanel } from '../../utils/mediaUpload';

interface HomeLayout {
  id: string;
  section_type: string;
  is_active: boolean;
  priority: number;
  settings: any;
}

export default function HomeLayoutSetup() {
  const [layouts, setLayouts] = useState<HomeLayout[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [subSubCategories, setSubSubCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);

  useEffect(() => {
    fetchLayouts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const [catRes, subRes, subSubRes, brandRes] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('sub_categories').select('*').order('name'),
      supabase.from('sub_sub_categories').select('*').order('name'),
      supabase.from('brands').select('*').order('name')
    ]);
    setCategories(catRes.data || []);
    setSubCategories(subRes.data || []);
    setSubSubCategories(subSubRes.data || []);
    setBrands(brandRes.data || []);
  };

  const renderCategoryOptions = () => {
    let options: JSX.Element[] = [];
    categories.forEach(cat => {
      options.push(<option key={`cat_${cat.id}`} value={`cat_${cat.id}`}>{cat.name}</option>);
      
      const subs = subCategories.filter(s => String(s.category_id) === String(cat.id));
      subs.forEach(sub => {
        options.push(<option key={`sub_${sub.id}`} value={`sub_${sub.id}`}>-- {sub.name}</option>);
        
        const subSubs = subSubCategories.filter(ss => String(ss.sub_category_id) === String(sub.id));
        subSubs.forEach(ss => {
          options.push(<option key={`subsub_${ss.id}`} value={`subsub_${ss.id}`}>---- {ss.name}</option>);
        });
      });
    });
    return options;
  };

  const fetchLayouts = async () => {
    try {
      const { data, error } = await supabase
        .from('home_layouts')
        .select('*')
        .order('priority', { ascending: true });
        
      if (error) throw error;
      setLayouts(data || []);
    } catch (err: any) {
      console.error('Error fetching home layouts', err);
      if (err.message?.includes('does not exist')) {
        showToast('Table home_layouts does not exist. Please run the SQL script.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddSection = async (type: string) => {
    const newLayout: Partial<HomeLayout> = {
      section_type: type,
      is_active: true,
      priority: layouts.length,
      settings: type === 'category_slider' ? { type: 'slider', title: 'New Category Slider' } : {}
    };

    try {
      const { data, error } = await supabase.from('home_layouts').insert([newLayout]).select().single();
      if (error) throw error;
      setLayouts([...layouts, data]);
      showToast('Section added', 'success');
    } catch (err) {
      showToast('Failed to add section', 'error');
    }
  };

  const handleUpdateSection = async (id: string, updates: Partial<HomeLayout>) => {
    try {
      setLayouts(layouts.map(l => l.id === id ? { ...l, ...updates } : l));
      const { error } = await supabase.from('home_layouts').update(updates).eq('id', id);
      if (error) throw error;
    } catch (err) {
      showToast('Failed to update section', 'error');
      fetchLayouts();
    }
  };

  const handleUpdateSettings = async (id: string, currentSettings: any, newSettingsPart: any) => {
    const newSettings = { ...currentSettings, ...newSettingsPart };
    await handleUpdateSection(id, { settings: newSettings });
  };

  const handleDeleteSection = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this section?')) return;
    try {
      setLayouts(layouts.filter(l => l.id !== id));
      const { error } = await supabase.from('home_layouts').delete().eq('id', id);
      if (error) throw error;
      showToast('Section deleted', 'success');
    } catch (err) {
      showToast('Failed to delete section', 'error');
      fetchLayouts();
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, layoutId: string, currentSettings: any) => {
    if (e.target.files && e.target.files[0]) {
      try {
        showToast('Uploading image...', 'info');
        const url = await uploadToCpanel(e.target.files[0], 'banners');
        await handleUpdateSettings(layoutId, currentSettings, { banner_url: url });
        showToast('Banner updated', 'success');
      } catch (err) {
        showToast('Failed to upload image', 'error');
      }
    }
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;
    const newLayouts = [...layouts];
    const temp = newLayouts[index];
    newLayouts[index] = newLayouts[index - 1];
    newLayouts[index - 1] = temp;
    
    newLayouts.forEach((l, i) => l.priority = i);
    setLayouts(newLayouts);
    
    for (const l of newLayouts) {
      await supabase.from('home_layouts').update({ priority: l.priority }).eq('id', l.id);
    }
  };

  const moveDown = async (index: number) => {
    if (index === layouts.length - 1) return;
    const newLayouts = [...layouts];
    const temp = newLayouts[index];
    newLayouts[index] = newLayouts[index + 1];
    newLayouts[index + 1] = temp;
    
    newLayouts.forEach((l, i) => l.priority = i);
    setLayouts(newLayouts);
    
    for (const l of newLayouts) {
      await supabase.from('home_layouts').update({ priority: l.priority }).eq('id', l.id);
    }
  };

  if (loading) return <div className="p-4">Loading layouts...</div>;

  return (
    <div className="w-full mx-auto py-2">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-blue-600" /> Home Layout Configuration
        </h1>
        <div className="flex gap-2">
          <button onClick={() => handleAddSection('flash_deals')} className="bg-brand-500 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-brand-600 flex items-center gap-1">
            <Plus className="w-4 h-4" /> Flash Deals
          </button>
          <button onClick={() => handleAddSection('category_slider')} className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-blue-700 flex items-center gap-1">
            <Plus className="w-4 h-4" /> Category Section
          </button>
          {!layouts.some(l => l.section_type === 'vendors') && (
            <button onClick={() => handleAddSection('vendors')} className="bg-green-600 text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-green-700 flex items-center gap-1">
              <Plus className="w-4 h-4" /> Vendors Section
            </button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {layouts.map((layout, index) => (
          <div key={layout.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <button onClick={() => moveUp(index)} disabled={index === 0} className="text-slate-400 hover:text-slate-600 disabled:opacity-30">▲</button>
                  <button onClick={() => moveDown(index)} disabled={index === layouts.length - 1} className="text-slate-400 hover:text-slate-600 disabled:opacity-30">▼</button>
                </div>
                <h3 className="font-bold text-slate-800 capitalize flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-slate-300" />
                  {layout.section_type.replace('_', ' ')}
                </h3>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={layout.is_active}
                    onChange={(e) => handleUpdateSection(layout.id, { is_active: e.target.checked })}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  Active
                </label>
                <button onClick={() => handleDeleteSection(layout.id)} className="text-red-500 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {layout.section_type === 'flash_deals' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Banner Image</label>
                  <div className="flex items-center gap-4">
                    {layout.settings.banner_url && (
                      <img src={layout.settings.banner_url} alt="Banner" className="h-16 w-32 object-cover rounded border" />
                    )}
                    <label className="cursor-pointer bg-slate-100 px-4 py-2 rounded border border-slate-200 text-sm hover:bg-slate-200 flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" /> Upload Banner
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadImage(e, layout.id, layout.settings)} />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Product Type</label>
                  <select
                    value={layout.settings.target_type === 'category' ? 'category' : (layout.settings.target_product_type || 'all')}
                    onChange={(e) => {
                      if (e.target.value === 'category') {
                        handleUpdateSettings(layout.id, layout.settings, { target_type: 'category', target_product_type: null });
                      } else {
                        handleUpdateSettings(layout.id, layout.settings, { target_type: 'product_type', target_product_type: e.target.value, target_category: null });
                      }
                    }}
                    className={`w-full rounded-md border border-slate-300 px-3 py-2 text-sm ${layout.settings.target_type === 'category' ? 'mb-2' : ''}`}
                  >
                    <option value="all">All Products</option>
                    <option value="on_sale">On Sale</option>
                    <option value="category">Specific Category</option>
                  </select>

                  {layout.settings.target_type === 'category' && (
                    <select
                      value={layout.settings.target_category || ''}
                      onChange={(e) => handleUpdateSettings(layout.id, layout.settings, { target_category: e.target.value })}
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    >
                      <option value="">Select Category</option>
                      {renderCategoryOptions()}
                    </select>
                  )}
                </div>
              </div>
            )}

            {layout.section_type === 'category_slider' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Section Title</label>
                  <input
                    type="text"
                    value={layout.settings.title || ''}
                    onChange={(e) => handleUpdateSettings(layout.id, layout.settings, { title: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    placeholder="e.g. Smart Phones"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Layout Type</label>
                  <select
                    value={layout.settings.type || 'slider'}
                    onChange={(e) => handleUpdateSettings(layout.id, layout.settings, { type: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="slider">Slider (1 Row)</option>
                    <option value="grid_with_banner">Grid (2 Rows + Banner)</option>
                    <option value="grid_no_banner">Grid (2 Rows, No Banner)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Category</label>
                  <select
                    value={layout.settings.target_category || ''}
                    onChange={(e) => handleUpdateSettings(layout.id, layout.settings, { target_category: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">Select Category</option>
                    {renderCategoryOptions()}
                  </select>
                </div>
                {(layout.settings.type === 'grid_with_banner') && (
                  <div className="col-span-1 md:col-span-3 border-t border-slate-100 pt-3 mt-1">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Side Banner Image</label>
                    <div className="flex items-center gap-4">
                      {layout.settings.banner_url && (
                        <img src={layout.settings.banner_url} alt="Banner" className="h-16 w-16 object-cover rounded border" />
                      )}
                      <label className="cursor-pointer bg-slate-100 px-4 py-2 rounded border border-slate-200 text-sm hover:bg-slate-200 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" /> Upload Banner
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUploadImage(e, layout.id, layout.settings)} />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            )}

            {layout.section_type === 'vendors' && (
              <div className="text-sm text-slate-500">
                This section automatically shows Verified Shop Partners. Toggle Active to show or hide it.
              </div>
            )}
          </div>
        ))}
        {layouts.length === 0 && (
          <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
            No layout sections configured.
          </div>
        )}
      </div>
    </div>
  );
}
