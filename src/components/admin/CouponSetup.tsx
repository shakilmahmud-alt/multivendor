import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Eye, Edit, Trash2, Tag, Search, Download } from 'lucide-react';
import { useToast } from '../ToastContext';

export default function CouponSetup() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    coupon_type: '',
    title: '',
    code: '',
    bearer: '',
    shop_id: '',
    limit_per_user: '',
    discount_type: 'Amount',
    discount_amount: '',
    min_purchase: '',
    start_date: '',
    expire_date: '',
    target_type: 'All Shops'
  });

  const [editId, setEditId] = useState<string | null>(null);
  
  // Modal State
  const [viewCoupon, setViewCoupon] = useState<any>(null);

  useEffect(() => {
    fetchCoupons();
    fetchShops();
  }, []);

  const fetchCoupons = async () => {
    const { data, error } = await supabase
      .from('coupons')
      .select(`
        *,
        sellers(shop_name)
      `)
      .order('created_at', { ascending: false });
    if (!error && data) {
      const { data: ordersData } = await supabase.from('orders').select('applied_coupon').not('applied_coupon', 'is', null);
      if (ordersData) {
        const counts = ordersData.reduce((acc: any, order: any) => {
          if (order.applied_coupon) {
             acc[order.applied_coupon] = (acc[order.applied_coupon] || 0) + 1;
          }
          return acc;
        }, {});
        data.forEach(c => c.used_count = counts[c.code] || 0);
      } else {
        data.forEach(c => c.used_count = 0);
      }
      setCoupons(data);
    }
  };

  const fetchShops = async () => {
    const { data, error } = await supabase.from('sellers').select('id, shop_name');
    if (!error && data) setShops(data);
  };

  const handleInputChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, code });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isFirstOrder = formData.coupon_type === 'First Order';
    if (!formData.coupon_type || !formData.title || !formData.code || (!isFirstOrder && !formData.bearer) || !formData.start_date || !formData.expire_date) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    setLoading(true);
    let finalTargetType = isFirstOrder ? 'All Shops' : formData.target_type;
    let finalShopId = isFirstOrder ? null : null;

    if (!isFirstOrder && formData.target_type === 'Seller' && formData.shop_id) {
      finalShopId = formData.shop_id;
    } else if (!isFirstOrder && formData.target_type === 'Seller' && !formData.shop_id) {
      showToast('Please select a specific seller shop', 'error');
      setLoading(false);
      return;
    }

    const payload = {
      ...formData,
      bearer: isFirstOrder ? 'Admin' : formData.bearer,
      target_type: finalTargetType,
      shop_id: finalShopId,
      limit_per_user: isFirstOrder ? 1 : (parseInt(formData.limit_per_user) || 0),
      discount_amount: formData.coupon_type === 'Free Delivery' ? 0 : parseFloat(formData.discount_amount) || 0,
      discount_type: formData.coupon_type === 'Free Delivery' ? 'Amount' : formData.discount_type,
      min_purchase: parseFloat(formData.min_purchase) || 0,
      seller_approval: finalTargetType === 'Seller' ? 'Pending' : 'Approved'
    };

    try {
      if (editId) {
        const { error } = await supabase.from('coupons').update(payload).eq('id', editId);
        if (error) throw error;
        showToast('Coupon updated successfully!', 'success');
      } else {
        const { error } = await supabase.from('coupons').insert([payload]);
        if (error) throw error;
        
        // Push notification to sellers
        let targetSellers: string[] = [];
        if (finalTargetType === 'All Shops') {
          targetSellers = shops.map(s => s.id);
        } else if (finalTargetType === 'Seller' && finalShopId) {
          targetSellers = [finalShopId];
        }

        if (targetSellers.length > 0) {
          const notifs = targetSellers.map(sid => ({
            target_role: 'seller',
            target_user_id: sid,
            title: 'New Coupon Available!',
            message: `A new coupon "${formData.title}" has been published.`,
            type: 'coupon',
            link: '/seller/coupons',
            is_read: false
          }));
          await supabase.from('notifications').insert(notifs);
        }

        showToast('Coupon created successfully!', 'success');
      }
      setFormData({
        coupon_type: '', title: '', code: '', bearer: '', shop_id: '',
        limit_per_user: '', discount_type: 'Amount', discount_amount: '',
        min_purchase: '', start_date: '', expire_date: '', target_type: 'All Shops'
      });
      setEditId(null);
      fetchCoupons();
    } catch (err: any) {
      showToast(err.message || 'Error saving coupon', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (c: any) => {
    setEditId(c.id);
    setFormData({
      coupon_type: c.coupon_type || '',
      title: c.title || '',
      code: c.code || '',
      bearer: c.bearer || '',
      shop_id: c.shop_id || '',
      limit_per_user: c.limit_per_user?.toString() || '',
      discount_type: c.discount_type || 'Amount',
      discount_amount: c.discount_amount?.toString() || '',
      min_purchase: c.min_purchase?.toString() || '',
      start_date: c.start_date || '',
      expire_date: c.expire_date || '',
      target_type: c.target_type || 'All Shops'
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (!error) {
      showToast('Coupon deleted', 'success');
      fetchCoupons();
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase.from('coupons').update({ status: !currentStatus }).eq('id', id);
    if (!error) fetchCoupons();
  };

  return (
    <div className="w-full space-y-6 font-sans">
      
      {/* Form Section */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center gap-2">
          <Tag className="w-5 h-5 text-slate-700" />
          <h2 className="text-sm font-bold text-slate-800">Coupon Setup</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            
            {/* Row 1 */}
            <div>
              <label className="block text-[13px] text-slate-600 mb-1.5">Coupon Type</label>
              <select name="coupon_type" value={formData.coupon_type} onChange={handleInputChange} className="w-full p-2.5 bg-white border border-slate-200 rounded text-sm text-slate-700 outline-none focus:border-blue-400">
                <option value="">Select coupon type</option>
                <option value="Discount on Purchase">Discount on Purchase</option>
                <option value="Free Delivery">Free Delivery</option>
                <option value="First Order">First Order</option>
              </select>
            </div>
            <div>
              <label className="block text-[13px] text-slate-600 mb-1.5">Coupon Title</label>
              <input type="text" name="title" placeholder="Title" value={formData.title} onChange={handleInputChange} className="w-full p-2.5 bg-white border border-slate-200 rounded text-sm text-slate-700 outline-none focus:border-blue-400 placeholder-slate-400" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[13px] text-slate-600">Coupon Code</label>
                <button type="button" onClick={generateCode} className="text-xs text-blue-500 hover:text-blue-700 font-medium">Generate code</button>
              </div>
              <input type="text" name="code" placeholder="Ex: 90a4cerh1g" value={formData.code} onChange={handleInputChange} className="w-full p-2.5 bg-white border border-slate-200 rounded text-sm text-slate-700 outline-none focus:border-blue-400 placeholder-slate-400" />
            </div>

            {/* Row 2 */}
            {formData.coupon_type !== 'First Order' && (
              <>
                <div>
                  <label className="block text-[13px] text-slate-600 mb-1.5">Coupon Bearer</label>
                  <select name="bearer" value={formData.bearer} onChange={handleInputChange} className="w-full p-2.5 bg-white border border-slate-200 rounded text-sm text-slate-700 outline-none focus:border-blue-400">
                    <option value="">Select coupon bearer</option>
                    <option value="Admin">Admin</option>
                    <option value="Seller">Seller</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] text-slate-600 mb-1.5">Shop Target</label>
                  <select name="target_type" value={formData.target_type} onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, target_type: val, shop_id: val !== 'Seller' ? '' : formData.shop_id });
                  }} className="w-full p-2.5 bg-white border border-slate-200 rounded text-sm text-slate-700 outline-none focus:border-blue-400">
                    <option value="All Shops">All Shops</option>
                    <option value="In-house">In-house Products Only</option>
                    <option value="Seller">Specific Seller</option>
                  </select>
                </div>
                {formData.target_type === 'Seller' && (
                  <div>
                    <label className="block text-[13px] text-slate-600 mb-1.5">Select Seller Shop</label>
                    <select name="shop_id" value={formData.shop_id} onChange={handleInputChange} className="w-full p-2.5 bg-white border border-slate-200 rounded text-sm text-slate-700 outline-none focus:border-blue-400">
                      <option value="">Select shop</option>
                      {shops.map(shop => <option key={shop.id} value={shop.id}>{shop.shop_name}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-[13px] text-slate-600 mb-1.5">Limit For Same User</label>
                  <input type="number" name="limit_per_user" placeholder="Ex: 10" value={formData.limit_per_user} onChange={handleInputChange} className="w-full p-2.5 bg-white border border-slate-200 rounded text-sm text-slate-700 outline-none focus:border-blue-400 placeholder-slate-400" />
                </div>
              </>
            )}

            {/* Row 3 */}
            {formData.coupon_type !== 'Free Delivery' ? (
              <>
                <div>
                  <label className="block text-[13px] text-slate-600 mb-1.5">Discount Type</label>
                  <select name="discount_type" value={formData.discount_type} onChange={handleInputChange} className="w-full p-2.5 bg-white border border-slate-200 rounded text-sm text-slate-700 outline-none focus:border-blue-400">
                    <option value="Amount">Amount</option>
                    <option value="Percentage">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[13px] text-slate-600 mb-1.5">Discount Amount</label>
                  <input type="number" name="discount_amount" placeholder="Ex: 500" value={formData.discount_amount} onChange={handleInputChange} className="w-full p-2.5 bg-white border border-slate-200 rounded text-sm text-slate-700 outline-none focus:border-blue-400 placeholder-slate-400" />
                </div>
              </>
            ) : (
              <>
                <div className="hidden"></div>
                <div className="hidden"></div>
              </>
            )}
            <div>
              <label className="block text-[13px] text-slate-600 mb-1.5">Minimum Purchase (৳)</label>
              <input type="number" name="min_purchase" placeholder="Ex: 100" value={formData.min_purchase} onChange={handleInputChange} className="w-full p-2.5 bg-white border border-slate-200 rounded text-sm text-slate-700 outline-none focus:border-blue-400 placeholder-slate-400" />
            </div>

            {/* Row 4 */}
            <div>
              <label className="block text-[13px] text-slate-600 mb-1.5">Start Date</label>
              <input type="date" name="start_date" value={formData.start_date} onChange={handleInputChange} className="w-full p-2.5 bg-white border border-slate-200 rounded text-sm text-slate-700 outline-none focus:border-blue-400 text-slate-500" />
            </div>
            <div>
              <label className="block text-[13px] text-slate-600 mb-1.5">Expire Date</label>
              <input type="date" name="expire_date" value={formData.expire_date} onChange={handleInputChange} className="w-full p-2.5 bg-white border border-slate-200 rounded text-sm text-slate-700 outline-none focus:border-blue-400 text-slate-500" />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-8">
            <button type="button" onClick={() => setFormData({ coupon_type: '', title: '', code: '', bearer: '', shop_id: '', limit_per_user: '', discount_type: 'Amount', discount_amount: '', min_purchase: '', start_date: '', expire_date: '', target_type: 'All Shops' })} className="px-6 py-2 bg-slate-100 text-slate-600 font-medium text-sm rounded hover:bg-slate-200 transition">Reset</button>
            <button type="submit" disabled={loading} className="px-6 py-2 bg-[#0070c0] text-white font-medium text-sm rounded hover:bg-[#005a9c] transition">{loading ? 'Saving...' : (editId ? 'Update' : 'Submit')}</button>
          </div>
        </form>
      </div>

      {/* List Section */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-lg">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800">Coupon List</h2>
            <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">{coupons.length}</span>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <input type="text" placeholder="Search by Title or Code" className="pl-9 pr-4 py-2 border border-slate-200 rounded text-sm outline-none focus:border-blue-400 w-64" />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <button className="bg-[#0070c0] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#005a9c]">Search</button>
            <button className="border border-slate-200 text-slate-600 px-4 py-2 rounded text-sm font-medium hover:bg-slate-50 flex items-center gap-2">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-white text-slate-800 text-xs font-bold border-b border-slate-200">
              <tr>
                <th className="py-4 px-4">SL</th>
                <th className="py-4 px-4">Coupon</th>
                <th className="py-4 px-4">Target / Shop</th>
                <th className="py-4 px-4">Coupon Type</th>
                <th className="py-4 px-4">Duration</th>
                <th className="py-4 px-4">User Limit</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c, i) => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-4 px-4">{i + 1}</td>
                  <td className="py-4 px-4">
                    <p className="font-bold text-slate-800">{c.title}</p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Code: <span className="font-mono text-blue-600">{c.code}</span></p>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded">
                      {c.target_type === 'Seller' ? (c.sellers?.shop_name || 'Unknown Shop') : c.target_type}
                    </span>
                    {c.target_type === 'Seller' && (
                      <div className={`mt-1 text-[10px] font-bold ${c.seller_approval === 'Approved' ? 'text-green-500' : c.seller_approval === 'Rejected' ? 'text-red-500' : 'text-brand-500'}`}>
                        {c.seller_approval}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm">{c.coupon_type}</td>
                  <td className="py-4 px-4 text-xs">
                    {new Date(c.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })} - {new Date(c.expire_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="py-4 px-4 text-xs text-slate-500">
                    Limit: <span className="font-bold text-slate-700">{c.limit_per_user || '∞'}</span>, Used: <span className="font-bold text-slate-700">{c.used_count || 0}</span>
                  </td>
                  <td className="py-4 px-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={c.status} onChange={() => toggleStatus(c.id, c.status)} />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0070c0]"></div>
                    </label>
                  </td>
                  <td className="py-4 px-4 flex justify-center gap-2">
                    <button onClick={() => setViewCoupon(c)} className="p-1.5 border border-indigo-400 text-indigo-500 rounded hover:bg-indigo-50">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleEdit(c)} className="p-1.5 border border-cyan-400 text-cyan-500 rounded hover:bg-cyan-50">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 border border-pink-400 text-pink-500 rounded hover:bg-pink-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">No coupons found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Coupon Modal */}
      {viewCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Close */}
            <button onClick={() => setViewCoupon(null)} className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/40 text-white rounded-full transition">
              X
            </button>
            
            {/* Ticket Design */}
            <div className="flex bg-gradient-to-br from-[#0f4c81] to-[#0070c0] text-white">
              {/* Left Side (Details) */}
              <div className="flex-1 p-8 pr-12 relative bg-white text-slate-800 rounded-r-3xl">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-12 h-12 bg-gradient-to-br from-[#0f4c81] to-[#0070c0] rounded-full"></div>
                
                <h3 className="text-xl font-black mb-1">{viewCoupon.coupon_type}</h3>
                <div className="inline-block px-3 py-1 bg-slate-100 rounded-md text-slate-600 font-mono text-sm tracking-widest border border-slate-200 shadow-inner mb-6">
                  {viewCoupon.code}
                </div>
                
                <div className="space-y-2 text-sm">
                  <p className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500">Min Purchase</span>
                    <span className="font-bold">৳{viewCoupon.min_purchase}</span>
                  </p>
                  <p className="flex justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-500">Valid From</span>
                    <span className="font-medium">{new Date(viewCoupon.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </p>
                  <p className="flex justify-between pb-1">
                    <span className="text-slate-500">Valid Until</span>
                    <span className="font-bold text-red-500">{new Date(viewCoupon.expire_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </p>
                </div>
              </div>
              
              {/* Right Side (Value) */}
              <div className="w-40 flex flex-col items-center justify-center relative pl-4 border-l-[3px] border-dashed border-white/30">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 bg-white rounded-full"></div>
                <div className="text-center z-10">
                  <p className="text-4xl font-black drop-shadow-md">
                    {viewCoupon.discount_type === 'Amount' ? `৳${viewCoupon.discount_amount}` : `${viewCoupon.discount_amount}%`}
                  </p>
                  <p className="uppercase tracking-widest text-sm font-medium mt-1 opacity-90">OFF</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
