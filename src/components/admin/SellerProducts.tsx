import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Search, Settings, Edit, Eye, Trash2, CheckCircle, XCircle, History } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useToast } from '../ToastContext';

export default function SellerProducts() {
  const { status } = useParams<{ status: string }>();
  const { showToast } = useToast();

  const [showChangesModal, setShowChangesModal] = useState(false);
  const [selectedChanges, setSelectedChanges] = useState<string[]>([]);

  const openChangesModal = (changes: string[]) => {
    setSelectedChanges(changes && changes.length > 0 ? changes : ['No specific changes recorded.']);
    setShowChangesModal(true);
  };

  // Map URL status to page title
  const getPageTitle = () => {
    switch (status) {
      case 'new-requests': return 'New Products Requests';
      case 'update-requests': return 'Product Update Requests';
      case 'approved': return 'Approved Products';
      case 'denied': return 'Denied Products';
      default: return 'Seller Product List';
    }
  };

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [sellers, setSellers] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [subSubCategories, setSubSubCategories] = useState<any[]>([]);

  const [filterStore, setFilterStore] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSubCategory, setFilterSubCategory] = useState('');
  const [filterSubSubCategory, setFilterSubSubCategory] = useState('');

  useEffect(() => {
    const fetchOptions = async () => {
      const [
        { data: sellersData },
        { data: brandsData },
        { data: catData },
        { data: subCatData },
        { data: subSubCatData }
      ] = await Promise.all([
        supabase.from('sellers').select('id, shop_name'),
        supabase.from('brands').select('id, name'),
        supabase.from('categories').select('id, name'),
        supabase.from('sub_categories').select('id, name, category_id'),
        supabase.from('sub_sub_categories').select('id, name, sub_category_id')
      ]);

      if (sellersData) setSellers(sellersData);
      if (brandsData) setBrands(brandsData);
      if (catData) setCategories(catData);
      if (subCatData) setSubCategories(subCatData);
      if (subSubCatData) setSubSubCategories(subSubCatData);
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [status]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('in_house_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (status === 'new-requests') {
        query = query.contains('attributes', { request_status: 'new-requests' });
      } else if (status === 'update-requests') {
        query = query.contains('attributes', { request_status: 'update-requests' });
      } else if (status === 'approved') {
        query = query.contains('attributes', { request_status: 'approved' });
      } else if (status === 'denied') {
        query = query.contains('attributes', { request_status: 'denied' });
      }

      if (filterBrand) query = query.eq('brand_id', filterBrand);
      if (filterCategory) query = query.eq('category_id', filterCategory);
      if (filterSubCategory) query = query.eq('sub_category_id', filterSubCategory);
      if (filterSubSubCategory) query = query.ilike('sub_sub_category_id', `%${filterSubSubCategory}%`);
      if (filterStore) query = query.contains('attributes', { seller_id: filterStore });

      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch all sellers to map shop names
      const { data: sellersData, error: sellersError } = await supabase
        .from('sellers')
        .select('id, shop_name');
        
      if (sellersError) {
        console.error('Failed to fetch sellers:', sellersError);
      }
      
      const sellerMap = new Map();
      if (sellersData) {
        sellersData.forEach(s => sellerMap.set(s.id, s.shop_name));
      }

      // Ensure we only show products that have a request_status (i.e. are from sellers)
      const sellerProducts = (data || [])
        .filter(p => p.attributes?.request_status)
        .map(p => ({
          ...p,
          shop_name: p.attributes?.shop_name || (p.attributes?.seller_id ? sellerMap.get(p.attributes.seller_id) : 'Unknown Store')
        }));
        
      setProducts(sellerProducts);
    } catch (err) {
      console.error('Error fetching seller products:', err);
      showToast('Failed to fetch products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const [showDenyModal, setShowDenyModal] = useState(false);
  const [denyReason, setDenyReason] = useState('');
  const [productToDeny, setProductToDeny] = useState<string | null>(null);

  const handleStatusUpdate = async (id: string, newStatus: string, reason?: string) => {
    try {
      const productToUpdate = products.find(p => p.id === id);
      if (!productToUpdate) return;
      
      const updatedAttributes = {
        ...(productToUpdate.attributes || {}),
        request_status: newStatus
      };

      if (reason) {
        updatedAttributes.deny_reason = reason;
      }

      const payload: any = { attributes: updatedAttributes };
      
      // If approved, make it active
      if (newStatus === 'approved') {
        payload.is_active = true;
      }

      const { error } = await supabase
        .from('in_house_products')
        .update(payload)
        .eq('id', id);

      if (error) throw error;

      // Notify the seller
      if (productToUpdate.attributes?.seller_id) {
        await supabase.from('notifications').insert([{
          target_role: 'seller',
          target_user_id: productToUpdate.attributes.seller_id,
          title: `Product ${newStatus === 'approved' ? 'Approved' : 'Denied'}`,
          message: `Your product "${productToUpdate.name_en || 'Unknown'}" was ${newStatus}.${reason ? ` Reason: ${reason}` : ''}`,
          link: `/seller/products/list`
        }]);

        // Auto-remove the notification sent to admin for this product request
        const shopName = productToUpdate.shop_name || productToUpdate.attributes?.shop_name || 'Unknown Store';
        const prodName = productToUpdate.name_en || 'Unknown';
        const updateMessage = `Seller "${shopName}" updated the product "${prodName}".`;
        const newRequestMessage = `Seller "${shopName}" submitted a new product "${prodName}".`;

        await supabase
          .from('notifications')
          .delete()
          .in('message', [updateMessage, newRequestMessage]);
      }

      showToast(`Product ${newStatus} successfully!`);
      // Re-fetch to update list according to current tab
      fetchProducts();
      setShowDenyModal(false);
    } catch (err) {
      console.error(err);
      showToast('Failed to update product status', 'error');
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

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          📦 {getPageTitle()}
          <span className="bg-slate-200 text-slate-600 text-xs py-0.5 px-2 rounded-full">
            {products.length}
          </span>
        </h1>
      </div>

      {/* Filter Products Card */}
      <div className="bg-white rounded-md shadow-sm border border-slate-200 mb-6 p-5">
        <h2 className="text-sm font-bold text-slate-800 mb-4">Filter Products</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Store</label>
            <select 
              value={filterStore}
              onChange={(e) => setFilterStore(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded px-3 py-2 bg-slate-50 text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="">All Store</option>
              {sellers.map(s => <option key={s.id} value={s.id}>{s.shop_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Brand</label>
            <select 
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded px-3 py-2 bg-slate-50 text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="">All Brands</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
            <select 
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setFilterSubCategory('');
                setFilterSubSubCategory('');
              }}
              className="w-full text-sm border border-slate-200 rounded px-3 py-2 bg-slate-50 text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="">Select category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Sub Category</label>
            <select 
              value={filterSubCategory}
              onChange={(e) => {
                setFilterSubCategory(e.target.value);
                setFilterSubSubCategory('');
              }}
              className="w-full text-sm border border-slate-200 rounded px-3 py-2 bg-slate-50 text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="">Select Sub Category</option>
              {subCategories.filter(sc => !filterCategory || sc.category_id === filterCategory).map(sc => (
                <option key={sc.id} value={sc.id}>{sc.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Sub Sub Category</label>
            <select 
              value={filterSubSubCategory}
              onChange={(e) => setFilterSubSubCategory(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded px-3 py-2 bg-slate-50 text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="">Select Sub Sub Category</option>
              {subSubCategories.filter(ssc => !filterSubCategory || ssc.sub_category_id === filterSubCategory).map(ssc => (
                <option key={ssc.id} value={ssc.id}>{ssc.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button 
            onClick={() => {
              setFilterStore('');
              setFilterBrand('');
              setFilterCategory('');
              setFilterSubCategory('');
              setFilterSubSubCategory('');
              setTimeout(() => fetchProducts(), 0);
            }}
            className="px-6 py-2 bg-slate-100 text-slate-600 rounded text-sm font-medium hover:bg-slate-200 transition"
          >
            Reset
          </button>
          <button 
            onClick={() => fetchProducts()}
            className="px-6 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition"
          >
            Show data
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search Product Name" 
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-l text-sm w-64 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-r text-sm font-medium hover:bg-blue-700 transition">
              Search
            </button>
          </div>

          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded text-sm font-medium hover:bg-slate-50 transition flex items-center gap-2">
            <Download className="w-4 h-4" /> Export <span className="ml-1 text-[10px]">▼</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">SL</th>
                <th className="px-4 py-3 whitespace-nowrap">Product Name</th>
                <th className="px-4 py-3 whitespace-nowrap text-center">Category</th>
                <th className="px-4 py-3 whitespace-nowrap text-center">Selling Price</th>
                <th className="px-4 py-3 whitespace-nowrap text-center">Store</th>
                <th className="px-4 py-3 whitespace-nowrap text-center">Active Status</th>
                <th className="px-4 py-3 whitespace-nowrap text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-4">
                        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
                          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                          <line x1="12" y1="11" x2="12" y2="17"></line>
                          <line x1="12" y1="9" x2="12.01" y2="9"></line>
                        </svg>
                      </div>
                      <p className="text-sm">No data to show</p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product, idx) => (
                  <tr key={product.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3">{idx + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded border border-slate-200 bg-white flex items-center justify-center overflow-hidden shrink-0">
                          {product.thumbnail_url ? (
                            <img src={product.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-6 h-6 bg-slate-100" />
                          )}
                        </div>
                        <span className="font-medium text-slate-700 line-clamp-1 max-w-[200px]" title={product.name_en}>
                          {product.name_en}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-slate-600">
                      {[
                        categories.find((c: any) => c.id === product.category_id)?.name,
                        subCategories.find((c: any) => c.id === product.sub_category_id)?.name,
                        String(product.sub_sub_category_id || '').split(',').map(id => subSubCategories.find((c: any) => c.id === id)?.name).filter(Boolean).join(', ')
                      ].filter(Boolean).join(' => ') || 'Uncategorized'}
                    </td>
                    <td className="px-4 py-3 text-center">৳{parseFloat(product.unit_price || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-medium max-w-[100px] truncate block mx-auto" title={product.shop_name || 'Unknown Store'}>
                        {product.shop_name || 'Unknown Store'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div 
                        className={`w-9 h-5 rounded-full relative inline-block cursor-pointer transition-colors ${product.is_active ? 'bg-blue-600' : 'bg-slate-200'}`}
                        onClick={() => handleToggleActive(product)}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${product.is_active ? 'left-[18px]' : 'left-0.5'}`}></div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {status === 'update-requests' && (
                          <button 
                            onClick={() => openChangesModal(product.attributes?.changes || [])}
                            className="w-7 h-7 rounded border border-purple-400 flex items-center justify-center text-purple-500 hover:bg-purple-50 transition" title="View Changes"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(status === 'new-requests' || status === 'update-requests') && (
                          <>
                            <button 
                              onClick={() => handleStatusUpdate(product.id, 'approved')}
                              className="w-7 h-7 rounded border border-green-400 flex items-center justify-center text-green-500 hover:bg-green-50 transition" title="Approve"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => { setProductToDeny(product.id); setDenyReason(''); setShowDenyModal(true); }}
                              className="w-7 h-7 rounded border border-red-400 flex items-center justify-center text-red-500 hover:bg-red-50 transition" title="Deny"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <a 
                          href={`/product/${product.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-7 h-7 rounded border border-cyan-400 flex items-center justify-center text-cyan-500 hover:bg-cyan-50 transition" title="View"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </a>
                        <button 
                          onClick={() => handleDelete(product.id)}
                          className="w-7 h-7 rounded border border-red-400 flex items-center justify-center text-red-500 hover:bg-red-50 transition" title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Deny Modal */}
      {showDenyModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                Deny Product Request
              </h2>
              <button onClick={() => setShowDenyModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <label className="block text-sm font-medium text-slate-700 mb-2">Reason for Denial</label>
              <textarea 
                value={denyReason}
                onChange={(e) => setDenyReason(e.target.value)}
                placeholder="Explain why this product request was denied..."
                className="w-full border border-slate-200 rounded p-3 text-sm focus:outline-none focus:border-red-400"
                rows={4}
              ></textarea>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setShowDenyModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-200 rounded hover:bg-slate-300 transition"
              >
                Cancel
              </button>
              <button 
                onClick={() => productToDeny && handleStatusUpdate(productToDeny, 'denied', denyReason)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 transition"
              >
                Confirm Deny
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Changes Modal */}
      {showChangesModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <History className="w-4 h-4 text-purple-500" />
                Updated Changes
              </h2>
              <button onClick={() => setShowChangesModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              <ul className="list-disc pl-5 space-y-2 text-slate-700 text-sm">
                {selectedChanges.map((change, idx) => (
                  <li key={idx}>{change}</li>
                ))}
              </ul>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end">
              <button 
                onClick={() => setShowChangesModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-sm font-medium transition"
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
