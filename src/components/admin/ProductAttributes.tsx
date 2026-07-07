import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Box, Search, Edit, Trash2 } from 'lucide-react';
import { useToast } from '../ToastContext';

export default function ProductAttributes() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [attributes, setAttributes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [activeTab, setActiveTab] = useState<'en' | 'bd'>('en');
  const [name, setName] = useState('');

  useEffect(() => {
    fetchAttributes();
  }, []);

  const fetchAttributes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_attributes')
        .select('*')
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      setAttributes(data || []);
    } catch (err) {
      console.error('Error fetching attributes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Attribute name is required', 'error');
      return;
    }
    
    setSubmitting(true);
    try {
      // Create new
      const { data, error } = await supabase
        .from('product_attributes')
        .insert([{ name }])
        .select()
        .single();
        
      if (error) throw error;
      if (data) {
        setAttributes([...attributes, data]);
      }
      showToast('Attribute added successfully!');
      
      handleReset();
    } catch (err) {
      console.error('Error saving attribute:', err);
      showToast('Failed to save attribute', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (attribute: any) => {
    navigate(`/admin/product-attributes/edit/${attribute.id}`);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this attribute?')) return;
    
    try {
      const { error } = await supabase
        .from('product_attributes')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      setAttributes(attributes.filter(a => a.id !== id));
      showToast('Attribute deleted successfully!');
    } catch (err) {
      console.error('Error deleting attribute:', err);
      showToast('Failed to delete attribute', 'error');
    }
  };

  const handleReset = () => {
    setName('');
  };

  const filteredAttributes = attributes.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-2">
        <Box className="w-5 h-5 text-brand-500" />
        <h1 className="text-lg font-bold text-slate-800">Attribute Setup</h1>
      </div>

      {/* Setup Form */}
      <div className="bg-white rounded-md shadow-sm border border-slate-200">
        <div className="p-6">

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm text-slate-600 mb-2">
                Attribute Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Attribute Name"
                className="w-full px-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 text-sm"
                required
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded hover:bg-slate-200 transition"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* List Section */}
      <div className="bg-white rounded-md shadow-sm border border-slate-200 mt-8">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800">Attribute list</h2>
            <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs font-bold">
              {attributes.length}
            </span>
          </div>

          <div className="flex border border-slate-200 rounded-md overflow-hidden bg-white w-full sm:max-w-xs">
            <div className="px-3 flex items-center justify-center text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input 
              type="text" 
              placeholder="Search by Attribute Name" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 px-2 text-sm outline-none"
            />
            <button className="bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 transition">
              Search
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-600 bg-slate-50 border-b border-slate-200 uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">SL</th>
                <th className="px-6 py-4 text-center">Attribute Name</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-slate-500">Loading...</td>
                </tr>
              ) : filteredAttributes.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-slate-500">No attributes found</td>
                </tr>
              ) : (
                filteredAttributes.map((attr, index) => (
                  <tr key={attr.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-6 py-4">{index + 1}</td>
                    <td className="px-6 py-4 text-center font-medium text-slate-700">{attr.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleEdit(attr)}
                          className="w-8 h-8 rounded border border-cyan-200 text-cyan-500 hover:bg-cyan-50 flex items-center justify-center transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(attr.id)}
                          className="w-8 h-8 rounded border border-red-200 text-red-500 hover:bg-red-50 flex items-center justify-center transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
