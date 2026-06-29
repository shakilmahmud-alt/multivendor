import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Download, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RefundRequests() {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  const currentUserStr = localStorage.getItem('user');
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const isSeller = currentUser?.role === 'seller';

  const getStatusFromUrl = () => {
    const params = new URLSearchParams(location.search);
    return params.get('status') || 'all';
  };

  const status = getStatusFromUrl();

  useEffect(() => {
    fetchRefunds();
  }, [status]);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('refund_requests')
        .select(`
          *,
          orders!inner (
            id,
            total_amount,
            seller_id,
            customers (
              first_name,
              last_name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      if (isSeller && currentUser?.id) {
        query = query.eq('orders.seller_id', currentUser.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setRefunds(data || []);
    } catch (error) {
      console.error('Error fetching refunds:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      // Fetch current status and associated order
      const { data: currentRefund } = await supabase
        .from('refund_requests')
        .select('*, orders(total_amount)')
        .eq('id', id)
        .single();
        
      if (currentRefund && currentRefund.orders) {
        const oldStatus = currentRefund.status;
        const amount = Number(currentRefund.amount || 0);
        const currentTotal = Number(currentRefund.orders.total_amount || 0);

        if (oldStatus !== 'rejected' && newStatus === 'rejected') {
          // Restoring amount (deducted previously)
          const newTotal = currentTotal + amount;
          await supabase.from('orders').update({ total_amount: newTotal }).eq('id', currentRefund.order_id);
        } else if (oldStatus === 'rejected' && newStatus !== 'rejected') {
          // Deducting amount again
          const newTotal = currentTotal - amount;
          await supabase.from('orders').update({ total_amount: newTotal >= 0 ? newTotal : 0 }).eq('id', currentRefund.order_id);
        }
      }

      const { error } = await supabase.from('refund_requests').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      fetchRefunds();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-lg font-bold text-slate-800">Pending Refund Requests</h1>
        <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{refunds.length}</span>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="flex w-full max-w-sm">
            <input 
              type="text" 
              placeholder="Search by order id or refund id" 
              className="w-full border border-slate-300 rounded-l p-2 text-[13px] outline-none focus:border-[#0070c0]"
            />
            <button className="bg-[#0070c0] hover:bg-[#005a9c] text-white px-4 rounded-r font-medium text-[13px] transition">
              Search
            </button>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded text-slate-600 font-medium text-[13px] hover:bg-slate-50 transition">
              <Download className="w-4 h-4" /> Export 
            </button>
            <select className="border border-slate-300 rounded p-2 text-[13px] text-slate-700 outline-none w-32">
              <option value="all">All</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4 w-12">SL</th>
                <th className="p-4">Order Id</th>
                <th className="p-4">Product Info</th>
                <th className="p-4">Customer Info</th>
                <th className="p-4 text-center">Admin Fee (1.5%)</th>
                <th className="p-4 text-center">Total Amount (Customer)</th>
                <th className="p-4 text-center">Refund Status</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            {refunds.length > 0 ? (
              <tbody className="divide-y divide-slate-100">
                {refunds.map((refund, index) => (
                  <tr key={refund.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 text-slate-500 font-medium">{index + 1}</td>
                    <td className="p-4 text-blue-500 font-medium hover:underline cursor-pointer">
                      <Link to={`/admin/orders/details/${refund.order_id}`}>
                        {refund.order_id.substring(0, 8)}
                      </Link>
                    </td>
                    <td className="p-4 text-slate-600">Product Info (Dynamic)</td>
                    <td className="p-4 text-slate-600">
                      {refund.orders?.customers 
                        ? `${refund.orders.customers.first_name || ''} ${refund.orders.customers.last_name || ''}`.trim() || 'Guest customer'
                        : 'Guest customer'}
                    </td>
                    <td className="p-4 text-center font-bold text-slate-800">৳{(refund.amount * 0.015).toFixed(2)}</td>
                    <td className="p-4 text-center font-bold text-slate-800">৳{(refund.amount - (refund.amount * 0.015)).toFixed(2)}</td>
                    <td className="p-4 text-center">
                      <span className={`text-xs font-bold px-2 py-1 rounded inline-block ${
                        refund.status === 'pending' ? 'bg-orange-50 text-orange-600' :
                        refund.status === 'approved' ? 'bg-blue-50 text-blue-600' :
                        refund.status === 'refunded' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-red-50 text-red-600'
                      }`}>
                        {refund.status.charAt(0).toUpperCase() + refund.status.slice(1)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {isSeller ? null : (
                          <>
                            {refund.status === 'pending' && (
                              <>
                                <button onClick={() => updateStatus(refund.id, 'approved')} className="px-2.5 py-1.5 bg-blue-500 text-white rounded text-xs font-bold hover:bg-blue-600 transition">Approve</button>
                                <button onClick={() => updateStatus(refund.id, 'rejected')} className="px-2.5 py-1.5 bg-red-500 text-white rounded text-xs font-bold hover:bg-red-600 transition">Reject</button>
                              </>
                            )}
                            {refund.status === 'approved' && (
                              <>
                                <button onClick={() => updateStatus(refund.id, 'refunded')} className="px-2.5 py-1.5 bg-emerald-500 text-white rounded text-xs font-bold hover:bg-emerald-600 transition">Refund</button>
                                <button onClick={() => updateStatus(refund.id, 'rejected')} className="px-2.5 py-1.5 bg-red-500 text-white rounded text-xs font-bold hover:bg-red-600 transition">Reject</button>
                              </>
                            )}
                          </>
                        )}
                        <Link to={`/admin/orders/details/${refund.order_id}`}>
                          <button className="w-8 h-8 flex items-center justify-center text-blue-500 border border-blue-200 rounded hover:bg-blue-50 transition" title="View Order Details">
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            ) : (
              <tbody>
                <tr>
                  <td colSpan={8}>
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4">
                        <path d="M2 9v11a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-3.414a2 2 0 0 1-1.414-.586l-2-2A2 2 0 0 0 11.757 8H6a2 2 0 0 0-2 2z"></path>
                        <path d="M2 9h10V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v5z"></path>
                        <line x1="12" y1="12" x2="12" y2="16"></line>
                        <circle cx="12" cy="18" r="0.5"></circle>
                      </svg>
                      <span className="text-sm">No data to show</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
