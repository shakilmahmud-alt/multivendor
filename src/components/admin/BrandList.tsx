import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Tag, Search, Download, Edit, Trash2 } from 'lucide-react';
import { useToast } from '../ToastContext';

export default function BrandList() {
  const { showToast } = useToast();
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setBrands(data || []);
    } catch (err) {
      console.error('Error fetching brands:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this brand?')) return;
    
    try {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      setBrands(brands.filter(b => b.id !== id));
      showToast('Brand deleted successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete brand', 'error');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('brands')
        .update({ is_active: !currentStatus })
        .eq('id', id);
        
      if (error) throw error;
      setBrands(brands.map(b => b.id === id ? { ...b, is_active: !currentStatus } : b));
      showToast('Brand status updated successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to update status', 'error');
    }
  };

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-6">
        <Tag className="w-5 h-5 text-orange-500" />
        <h1 className="text-lg font-bold text-slate-800">Brand List</h1>
        <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs font-bold">
          {brands.length}
        </span>
      </div>

      <div className="bg-white rounded-md shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Search */}
          <div className="flex border border-slate-200 rounded-md overflow-hidden bg-white w-full sm:max-w-md">
            <div className="px-3 flex items-center justify-center text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input 
              type="text" 
              placeholder="Search by name" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2 px-2 text-sm outline-none"
            />
            <button className="bg-blue-600 text-white px-6 py-2 text-sm font-medium hover:bg-blue-700 transition">
              Search
            </button>
          </div>

          {/* Export */}
          <button className="flex items-center gap-2 border border-blue-200 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 transition text-sm font-medium">
            <Download className="w-4 h-4" /> Export <span className="text-xs">▼</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-600 bg-slate-50 border-b border-slate-200 uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">SL</th>
                <th className="px-6 py-4">Brand Logo</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4 text-center">Total Product</th>
                <th className="px-6 py-4 text-center">Total Order</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-slate-500">Loading...</td>
                </tr>
              ) : filteredBrands.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-slate-500">No brands found</td>
                </tr>
              ) : (
                filteredBrands.map((brand, index) => (
                  <tr key={brand.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="px-6 py-4">{index + 1}</td>
                    <td className="px-6 py-4">
                      {brand.logo_url ? (
                        <img src={brand.logo_url} alt={brand.name} className="w-12 h-12 object-contain bg-white border border-slate-100 rounded" />
                      ) : (
                        <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center text-slate-400 text-xs border border-slate-200">
                          No Logo
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{brand.name}</td>
                    <td className="px-6 py-4 text-center">{brand.total_product}</td>
                    <td className="px-6 py-4 text-center">{brand.total_order}</td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleToggleStatus(brand.id, brand.is_active)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${brand.is_active ? 'bg-blue-500' : 'bg-slate-300'}`}
                      >
                        <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${brand.is_active ? 'left-[22px]' : 'left-0.5'}`}></div>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link 
                          to={`/admin/brands/edit/${brand.id}`}
                          className="w-8 h-8 rounded border border-cyan-200 text-cyan-500 hover:bg-cyan-50 flex items-center justify-center transition"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(brand.id)}
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
