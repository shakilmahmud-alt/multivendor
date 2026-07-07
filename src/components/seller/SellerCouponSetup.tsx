import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Eye, CheckCircle, XCircle, Search } from 'lucide-react';
import { useToast } from '../ToastContext';

export default function SellerCouponSetup() {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [viewCoupon, setViewCoupon] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUserId(parsed.id);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchCoupons();
    }
  }, [userId]);

  const fetchCoupons = async () => {
    if (!userId) return;

    // Fetch coupons for this seller OR All Shops
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .or(`shop_id.eq.${userId},target_type.eq."All Shops"`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCoupons(data);
    }
  };

  const getApprovalStatus = (c: any) => {
    if (c.target_type === 'Seller') {
      return c.seller_approval || 'Pending';
    } else {
      const approved = c.approved_sellers || [];
      const rejected = c.rejected_sellers || [];
      if (approved.includes(userId)) return 'Approved';
      if (rejected.includes(userId)) return 'Rejected';
      return 'Pending';
    }
  };

  const handleApproval = async (c: any, status: string) => {
    let updateData: any = {};
    
    if (c.target_type === 'Seller') {
      updateData = { seller_approval: status };
    } else {
      const approved = [...(c.approved_sellers || [])];
      const rejected = [...(c.rejected_sellers || [])];
      
      // Remove from both lists first
      const appIdx = approved.indexOf(userId);
      if (appIdx > -1) approved.splice(appIdx, 1);
      const rejIdx = rejected.indexOf(userId);
      if (rejIdx > -1) rejected.splice(rejIdx, 1);
      
      if (status === 'Approved') approved.push(userId);
      if (status === 'Rejected') rejected.push(userId);
      
      updateData = { approved_sellers: approved, rejected_sellers: rejected };
    }

    const { error } = await supabase
      .from('coupons')
      .update(updateData)
      .eq('id', c.id);

    if (!error) {
      showToast(`Coupon ${status} successfully`, 'success');
      fetchCoupons();
    } else {
      showToast('Error updating status', 'error');
    }
  };

  return (
    <div className="w-full space-y-6 font-sans">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-lg">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-800">Coupon Offers</h2>
            <span className="bg-blue-100 text-blue-600 text-xs font-bold px-2 py-0.5 rounded-full">{coupons.length}</span>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <input type="text" placeholder="Search by Title or Code" className="pl-9 pr-4 py-2 border border-slate-200 rounded text-sm outline-none focus:border-blue-400 w-64" />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <button className="bg-[#0070c0] text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#005a9c]">Search</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-white text-slate-800 text-xs font-bold border-b border-slate-200">
              <tr>
                <th className="py-4 px-4">SL</th>
                <th className="py-4 px-4">Coupon</th>
                <th className="py-4 px-4">Target Type</th>
                <th className="py-4 px-4">Coupon Type</th>
                <th className="py-4 px-4">Duration</th>
                <th className="py-4 px-4">Admin Status</th>
                <th className="py-4 px-4">Your Approval</th>
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
                      {c.target_type}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm">{c.coupon_type}</td>
                  <td className="py-4 px-4 text-xs">
                    {new Date(c.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })} - {new Date(c.expire_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${c.status ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {c.status ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className={`font-bold text-xs ${getApprovalStatus(c) === 'Approved' ? 'text-green-500' : getApprovalStatus(c) === 'Rejected' ? 'text-red-500' : 'text-brand-500'}`}>
                      {getApprovalStatus(c)}
                    </div>
                  </td>
                  <td className="py-4 px-4 flex justify-center gap-2 items-center">
                    <button onClick={() => setViewCoupon(c)} className="p-1.5 border border-indigo-400 text-indigo-500 rounded hover:bg-indigo-50">
                      <Eye className="w-4 h-4" />
                    </button>
                    {getApprovalStatus(c) === 'Pending' && (
                      <>
                        <button onClick={() => handleApproval(c, 'Approved')} className="p-1.5 border border-green-400 text-green-500 rounded hover:bg-green-50 title-Approve">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleApproval(c, 'Rejected')} className="p-1.5 border border-red-400 text-red-500 rounded hover:bg-red-50 title-Reject">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
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
