import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Box, Search, Download, Edit, Trash2, Globe, Eye, Barcode as BarcodeIcon, Plus, AlertCircle, XCircle } from 'lucide-react';
import { useToast } from '../ToastContext';

export default function InHouseProductList() {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [selectedDenyReason, setSelectedDenyReason] = useState('');
  
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subCategoryFilter, setSubCategoryFilter] = useState('');
  const [subSubCategoryFilter, setSubSubCategoryFilter] = useState('');

  // Dependency Data
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [subCategoriesList, setSubCategoriesList] = useState<any[]>([]);
  const [subSubCategoriesList, setSubSubCategoriesList] = useState<any[]>([]);
  const [brandsList, setBrandsList] = useState<any[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchDependencies();
  }, []);

  const fetchDependencies = async () => {
    try {
      const [catRes, subRes, subSubRes, brandRes] = await Promise.all([
        supabase.from('categories').select('*').order('priority'),
        supabase.from('sub_categories').select('*').order('priority'),
        supabase.from('sub_sub_categories').select('*').order('priority'),
        supabase.from('brands').select('*')
      ]);

      if (catRes.data) setCategoriesList(catRes.data);
      if (subRes.data) setSubCategoriesList(subRes.data);
      if (subSubRes.data) setSubSubCategoriesList(subSubRes.data);
      if (brandRes.data) setBrandsList(brandRes.data);
    } catch (err) {
      console.error('Error fetching dependencies:', err);
    }
  };

  const filteredSubCategories = useMemo(() => {
    if (!categoryFilter) return [];
    return subCategoriesList.filter(s => s.category_id === categoryFilter);
  }, [categoryFilter, subCategoriesList]);

  const filteredSubSubCategories = useMemo(() => {
    if (!subCategoryFilter) return [];
    return subSubCategoriesList.filter(ss => ss.sub_category_id === subCategoryFilter);
  }, [subCategoryFilter, subSubCategoriesList]);

  // Reset dependent fields when parent changes
  useEffect(() => {
    setSubCategoryFilter('');
    setSubSubCategoryFilter('');
  }, [categoryFilter]);

  useEffect(() => {
    setSubSubCategoryFilter('');
  }, [subCategoryFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('in_house_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (user?.role === 'seller') {
        query = query.contains('attributes', { seller_id: user.id });
      }

      const { data, error } = await query;
        
      if (error) throw error;
      
      // If admin, filter out products that belong to sellers
      if (user?.role === 'admin') {
        const adminProducts = (data || []).filter(p => p.attributes?.added_by_admin || !p.attributes?.seller_id);
        setProducts(adminProducts);
      } else {
        setProducts(data || []);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('in_house_products')
        .update({ is_featured: !currentStatus })
        .eq('id', id);
        
      if (error) throw error;
      setProducts(products.map(p => p.id === id ? { ...p, is_featured: !currentStatus } : p));
      showToast('Featured status updated!');
    } catch (err) {
      console.error(err);
      showToast('Failed to update status', 'error');
    }
  };

  const handleToggleActive = async (product: any) => {
    if (user?.role === 'seller' && product.attributes?.request_status && product.attributes?.request_status !== 'approved') {
      showToast('Product must be approved by Admin first', 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('in_house_products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id);
        
      if (error) throw error;
      setProducts(products.map(p => p.id === product.id ? { ...p, is_active: !product.is_active } : p));
      showToast('Active status updated!');
    } catch (err) {
      console.error(err);
      showToast('Failed to update status', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const { error } = await supabase
        .from('in_house_products')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      setProducts(products.filter(p => p.id !== id));
      showToast('Product deleted successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete product', 'error');
    }
  };

  // Safe formatting for currency
  const formatCurrency = (amount: number) => {
    return '৳' + Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.name_en?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                          (p.sku?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesBrand = brandFilter ? p.brand_id === brandFilter : true;
    const matchesCategory = categoryFilter ? p.category_id === categoryFilter : true;
    const matchesSubCategory = subCategoryFilter ? p.sub_category_id === subCategoryFilter : true;
    const matchesSubSubCategory = subSubCategoryFilter ? p.sub_sub_category_id === subSubCategoryFilter : true;
    
    return matchesSearch && matchesBrand && matchesCategory && matchesSubCategory && matchesSubSubCategory;
  });

  const handleResetFilters = () => {
    setSearchQuery('');
    setBrandFilter('');
    setCategoryFilter('');
    setSubCategoryFilter('');
    setSubSubCategoryFilter('');
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-6">
        <Box className="w-6 h-6 text-orange-500" />
        <h1 className="text-xl font-bold text-slate-800">
          {user?.role === 'seller' ? 'Product List' : 'In House Product List'}
        </h1>
        <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-full">
          {products.length}
        </span>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-md shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Filter Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Brand</label>
            <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500 bg-white">
              <option value="">All Brands</option>
              {brandsList.map(brand => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Category</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500 bg-white">
              <option value="">All Categories</option>
              {categoriesList.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Sub Category</label>
            <select value={subCategoryFilter} onChange={(e) => setSubCategoryFilter(e.target.value)} disabled={!categoryFilter} className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500 bg-white disabled:bg-slate-50">
              <option value="">All Sub Categories</option>
              {filteredSubCategories.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Sub Sub Category</label>
            <select value={subSubCategoryFilter} onChange={(e) => setSubSubCategoryFilter(e.target.value)} disabled={!subCategoryFilter} className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500 bg-white disabled:bg-slate-50">
              <option value="">All Sub Sub Categories</option>
              {filteredSubSubCategories.map(subSub => (
                <option key={subSub.id} value={subSub.id}>{subSub.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={handleResetFilters} className="px-6 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded hover:bg-slate-200 transition">
            Reset
          </button>
          {/* Note: Filtering is handled dynamically as inputs change, but keeping button for UI consistency */}
          <button className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition">
            Show data
          </button>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="bg-white rounded-md shadow-sm border border-slate-200">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Product Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-l-md focus:outline-none focus:border-blue-500 text-sm"
              />
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-r-md hover:bg-blue-700 transition">
              Search
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-md hover:bg-slate-50 transition">
              <Download className="w-4 h-4" /> Export
            </button>
            <button className="px-4 py-2 bg-cyan-500 text-white text-sm font-medium rounded-md hover:bg-cyan-600 transition">
              Limited Stocks
            </button>
            <Link to="/admin/in-house-products/add" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition">
              <Plus className="w-4 h-4" /> Add new product
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">SL</th>
                <th className="px-4 py-3 font-semibold">Product Name</th>
                <th className="px-4 py-3 font-semibold text-center">Product Type</th>
                <th className="px-4 py-3 font-semibold text-right">Selling Price</th>
                <th className="px-4 py-3 font-semibold text-center">Show As Featured</th>
                <th className="px-4 py-3 font-semibold text-center">Active Status</th>
                <th className="px-4 py-3 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">Loading...</td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">No products found.</td>
                </tr>
              ) : (
                filteredProducts.map((product, index) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded border border-slate-200 bg-white overflow-hidden flex items-center justify-center shrink-0">
                          {product.thumbnail_url ? (
                            <img src={product.thumbnail_url} alt={product.name_en} className="w-full h-full object-cover" />
                          ) : (
                            <Box className="w-5 h-5 text-slate-300" />
                          )}
                        </div>
                        <span className="font-medium text-slate-700 line-clamp-1" title={product.name_en}>
                          {product.name_en}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">
                        {product.product_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">
                      {formatCurrency(product.unit_price)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div 
                        className={`w-10 h-5 rounded-full relative cursor-pointer mx-auto ${product.is_featured ? 'bg-blue-500' : 'bg-slate-300'}`}
                        onClick={() => handleToggleFeatured(product.id, product.is_featured)}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${product.is_featured ? 'left-5' : 'left-0.5'}`}></div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div 
                        className={`w-10 h-5 rounded-full relative mx-auto transition-all ${
                          user?.role === 'seller' && product.attributes?.request_status && product.attributes?.request_status !== 'approved' 
                          ? 'bg-slate-200 cursor-not-allowed opacity-60' 
                          : product.is_active ? 'bg-blue-500 cursor-pointer' : 'bg-slate-300 cursor-pointer'
                        }`}
                        onClick={() => handleToggleActive(product)}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${product.is_active ? 'left-5' : 'left-0.5'}`}></div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {user?.role === 'seller' && product.attributes?.request_status === 'denied' && (
                          <button
                            onClick={() => {
                              setSelectedDenyReason(product.attributes.deny_reason || 'No specific reason provided.');
                              setShowDenyModal(true);
                            }}
                            title="View Deny Reason"
                            className="w-8 h-8 rounded border border-red-500 text-red-500 flex items-center justify-center hover:bg-red-50 transition"
                          >
                            <AlertCircle className="w-4 h-4" />
                          </button>
                        )}
                        <a
                          href={`/landing/${product.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View Landing Page"
                          className="w-8 h-8 rounded border border-cyan-500 text-cyan-500 flex items-center justify-center hover:bg-cyan-50 transition"
                        >
                          <Globe className="w-4 h-4" />
                        </a>
                        <Link
                          to={`/admin/in-house-products/barcode/${product.id}`}
                          title="Generate Barcode"
                          className="w-8 h-8 rounded border border-cyan-500 text-cyan-500 flex items-center justify-center hover:bg-cyan-50 transition"
                        >
                          <BarcodeIcon className="w-4 h-4" />
                        </Link>
                        <a
                          href={`/product/${product.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View Main Product Page"
                          className="w-8 h-8 rounded border border-cyan-500 text-cyan-500 flex items-center justify-center hover:bg-cyan-50 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <Link
                          to={`/admin/in-house-products/edit/${product.id}`}
                          title="Edit Product"
                          className="w-8 h-8 rounded border border-blue-500 text-blue-500 flex items-center justify-center hover:bg-blue-50 transition"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          title="Delete Product"
                          className="w-8 h-8 rounded border border-red-500 text-red-500 flex items-center justify-center hover:bg-red-50 transition"
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

      {/* Deny Reason Modal */}
      {showDenyModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-red-50">
              <h2 className="font-bold text-red-600 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Product Denied
              </h2>
              <button onClick={() => setShowDenyModal(false)} className="text-red-400 hover:text-red-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-sm font-medium text-slate-700 mb-1">Reason for Denial:</p>
              <div className="bg-slate-50 p-3 rounded border border-slate-200 text-sm text-slate-600 mb-4">
                {selectedDenyReason}
              </div>
              <p className="text-xs text-slate-500 mb-2">
                Please edit your product to address the issues above. It will be re-submitted as a new request.
              </p>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setShowDenyModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded hover:bg-slate-50 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
