import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useToast } from '../ToastContext';
import { Tag, Edit, Trash2 } from 'lucide-react';
import { uploadToCpanel } from '../../utils/mediaUpload';

export default function FlashDealSetup() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingDealId, setEditingDealId] = useState<string | null>(null);
  const [deals, setDeals] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [dealProducts, setDealProducts] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    start_date: '',
    end_date: '',
    banner: '',
    discount_type: 'Amount',
    discount_amount: '',
    min_purchase: ''
  });

  useEffect(() => {
    fetchDeals();
    fetchShops();
  }, []);

  const fetchDeals = async () => {
    try {
      const { data, error } = await supabase.from('flash_deals').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setDeals(data || []);
      
      if (data && data.length > 0) {
        const { data: prodData } = await supabase.from('flash_deal_products').select('*');
        if (prodData) setDealProducts(prodData);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchShops = async () => {
    const { data } = await supabase.from('sellers').select('id, shop_name');
    if (data) setShops(data);
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showToast('File size must be less than 2 MB', 'error');
        return;
      }
      setIsUploading(true);
      try {
        const url = await uploadToCpanel(file, 'banners');
        setFormData(prev => ({ ...prev, banner: url }));
        showToast('Image uploaded successfully!', 'success');
      } catch (err: any) {
        showToast(err.message || 'Failed to upload image', 'error');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleReset = () => {
    setFormData({
      title: '', start_date: '', end_date: '', banner: '',
      discount_type: 'Amount', discount_amount: '', min_purchase: ''
    });
    setEditingDealId(null);
  };

  const startEdit = (deal: any) => {
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    setFormData({
      title: deal.title || '',
      start_date: formatDate(deal.start_date),
      end_date: formatDate(deal.end_date),
      banner: deal.banner || '',
      discount_type: deal.discount_type || 'Amount',
      discount_amount: deal.discount_amount?.toString() || '',
      min_purchase: deal.min_purchase?.toString() || ''
    });
    setEditingDealId(deal.id);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this Flash Deal?')) return;
    try {
      const { error } = await supabase.from('flash_deals').delete().eq('id', id);
      if (error) throw error;
      showToast('Flash Deal deleted successfully!', 'success');
      fetchDeals();
    } catch (err: any) {
      showToast(err.message || 'Error deleting flash deal', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.banner) {
      showToast('Please upload a banner image.', 'error');
      return;
    }
    setLoading(true);

    try {
      const payload = {
        title: formData.title,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        banner: formData.banner,
        discount_type: formData.discount_type,
        discount_amount: parseFloat(formData.discount_amount) || 0,
        min_purchase: parseFloat(formData.min_purchase) || 0,
      };

      if (editingDealId) {
        const { error } = await supabase.from('flash_deals').update(payload).eq('id', editingDealId);
        if (error) throw error;
        showToast('Flash Deal updated successfully!', 'success');
      } else {
        const { data, error } = await supabase.from('flash_deals').insert([{ ...payload, status: 'active' }]).select();
        if (error) throw error;

        // Push notification to all sellers
        if (shops.length > 0) {
          const notifs = shops.map(shop => ({
            target_role: 'seller',
            target_user_id: shop.id,
            title: 'New Flash Deal Published!',
            message: `Join our new Flash Deal "${formData.title}" and boost your sales.`,
            type: 'flash_deal',
            link: '/seller/flash-deals/join',
            is_read: false
          }));
          await supabase.from('notifications').insert(notifs);
        }
        showToast('Flash Deal published successfully!', 'success');
      }

      handleReset();
      fetchDeals();
    } catch (err: any) {
      showToast(err.message || 'Error saving flash deal', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await supabase.from('flash_deals').update({ status: newStatus }).eq('id', id);
      fetchDeals();
    } catch (err: any) {
      showToast('Failed to update status', 'error');
    }
  };

  const getJoinedShopCount = (dealId: string) => {
    const submitted = dealProducts.filter(dp => dp.flash_deal_id === dealId && dp.status === 'submitted');
    const uniqueShops = new Set(submitted.map(dp => dp.seller_id));
    return uniqueShops.size;
  };

  return (
    <div className="w-full space-y-6 font-sans">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center gap-2">
          <Tag className="w-5 h-5 text-slate-700" />
          <h2 className="text-sm font-bold text-slate-800">{editingDealId ? 'Edit Flash Deal' : 'Flash Deal Setup'}</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            
            {/* Row 1 */}
            <div>
              <label className="block text-[13px] text-slate-600 mb-1.5">Title</label>
              <input type="text" name="title" value={formData.title} onChange={handleInputChange} required className="w-full p-2.5 bg-white border border-slate-200 rounded text-sm outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-[13px] text-slate-600 mb-1.5">Start Date</label>
              <input type="date" name="start_date" value={formData.start_date} onChange={handleInputChange} required className="w-full p-2.5 bg-white border border-slate-200 rounded text-sm outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-[13px] text-slate-600 mb-1.5">End Date</label>
              <input type="date" name="end_date" value={formData.end_date} onChange={handleInputChange} required className="w-full p-2.5 bg-white border border-slate-200 rounded text-sm outline-none focus:border-blue-400" />
            </div>

            {/* Row 2 */}
            <div>
              <label className="block text-[13px] text-slate-600 mb-1.5">Banner Image</label>
              <div className="relative border border-slate-200 rounded text-sm bg-white hover:border-blue-400 transition min-h-[42px] flex items-center justify-between px-3">
                {isUploading ? (
                  <span className="text-slate-500 animate-pulse text-xs">Uploading...</span>
                ) : formData.banner ? (
                  <div className="flex items-center gap-2 overflow-hidden w-full mr-8">
                    <img src={formData.banner} alt="Preview" className="w-8 h-8 rounded object-cover border border-slate-200 flex-shrink-0" />
                    <span className="text-xs text-slate-600 truncate">{formData.banner.split('/').pop()}</span>
                  </div>
                ) : (
                  <span className="text-slate-400 text-xs">Choose banner image...</span>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  disabled={isUploading}
                  className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                />
                {!isUploading && formData.banner && (
                  <button 
                    type="button" 
                    onClick={(e) => {
                      e.preventDefault();
                      setFormData(prev => ({ ...prev, banner: '' }));
                    }}
                    className="absolute right-2 text-slate-400 hover:text-red-500 p-1 rounded z-10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-[13px] text-slate-600 mb-1.5">Discount Type</label>
              <select name="discount_type" value={formData.discount_type} onChange={handleInputChange} className="w-full p-2.5 bg-white border border-slate-200 rounded text-sm outline-none focus:border-blue-400">
                <option value="Amount">Amount</option>
                <option value="Percentage">Percentage (%)</option>
              </select>
            </div>
            <div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[13px] text-slate-600 mb-1.5">Discount Amount</label>
                  <input type="number" name="discount_amount" value={formData.discount_amount} onChange={handleInputChange} required className="w-full p-2.5 bg-white border border-slate-200 rounded text-sm outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="block text-[13px] text-slate-600 mb-1.5">Min Purchase (৳)</label>
                  <input type="number" name="min_purchase" value={formData.min_purchase} onChange={handleInputChange} className="w-full p-2.5 bg-white border border-slate-200 rounded text-sm outline-none focus:border-blue-400" />
                </div>
              </div>
            </div>
            
          </div>

          <div className="flex justify-end gap-3 mt-4">
            {editingDealId && (
              <button 
                type="button" 
                onClick={handleReset} 
                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-sm font-medium transition"
              >
                Cancel Edit
              </button>
            )}
            <button type="submit" disabled={loading || isUploading} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded text-sm font-medium transition disabled:opacity-50">
              {loading ? 'Saving...' : isUploading ? 'Uploading Banner...' : editingDealId ? 'Update Flash Deal' : 'Publish Flash Deal'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-800">Flash Deals List</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="p-4">SL</th>
                <th className="p-4">Title</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Discount</th>
                <th className="p-4">Joined Shops</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deals.map((deal, idx) => (
                <tr key={deal.id} className="hover:bg-slate-50">
                  <td className="p-4 text-slate-600">{idx + 1}</td>
                  <td className="p-4 font-medium text-slate-800">{deal.title}</td>
                  <td className="p-4 text-slate-600">
                    <span className="block">{new Date(deal.start_date).toLocaleDateString()} - </span>
                    <span className="block">{new Date(deal.end_date).toLocaleDateString()}</span>
                  </td>
                  <td className="p-4 text-slate-600">
                    {deal.discount_type === 'Amount' ? '৳' : ''}{deal.discount_amount}{deal.discount_type === 'Percentage' ? '%' : ''}
                  </td>
                  <td className="p-4 text-blue-600 font-bold hover:underline">
                    <Link to={`/admin/flash-deals/details/${deal.id}`}>
                      {getJoinedShopCount(deal.id)}
                    </Link>
                  </td>
                  <td className="p-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={deal.status === 'active'} onChange={() => toggleStatus(deal.id, deal.status)} />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => startEdit(deal)}
                        className="text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1.5 rounded transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(deal.id)}
                        className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 p-1.5 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {deals.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-slate-500">No flash deals found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
