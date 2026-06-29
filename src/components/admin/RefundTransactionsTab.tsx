import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Download, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RefundTransactionsTab() {
  const [refunds, setRefunds] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [dateFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: sData } = await supabase.from('sellers').select('*');
      if (sData) setSellers(sData);

      let query = supabase
        .from('refund_requests')
        .select(`
          *,
          orders (
            id,
            total_amount,
            payment_method,
            payment_status,
            seller_id,
            customers (
              first_name,
              last_name
            ),
            shipping_address
          )
        `)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      
      let filtered = data || [];

      // Filter by date
      const now = new Date();
      if (dateFilter === 'This Year') {
        filtered = filtered.filter(r => new Date(r.created_at).getFullYear() === now.getFullYear());
      } else if (dateFilter === 'This Month') {
        filtered = filtered.filter(r => {
          const d = new Date(r.created_at);
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        });
      } else if (dateFilter === 'This Week') {
        const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
        filtered = filtered.filter(r => new Date(r.created_at) >= firstDay);
      }

      setRefunds(filtered);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    let csv = 'SL,Product,Refund Id,Order Id,Shop Name,Payment Method,Payment Status,Paid By,Amount,Transaction Type\n';
    
    refunds.forEach((r, i) => {
      const order = r.orders || {};
      const shopName = order.seller_id ? (sellers.find(s => s.id === order.seller_id)?.shop_name || 'Vendor') : 'In-House';
      const custName = order.customers ? `${order.customers.first_name || ''} ${order.customers.last_name || ''}`.trim() : (order.shipping_address?.name || 'Guest');
      
      csv += `"${i + 1}","Product Info","${r.id.slice(0,8)}","${r.order_id.slice(0,8)}","${shopName}","${order.payment_method || 'cash'}","${order.payment_status || 'unpaid'}","${custName}","${r.amount.toFixed(2)}","Refund"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Refund_Transactions_${new Date().getTime()}.csv`;
    a.click();
  };

  const renderTableData = () => {
    let filtered = refunds;
    if (searchQuery) {
      filtered = filtered.filter(r => r.order_id.toLowerCase().includes(searchQuery.toLowerCase()) || r.id.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (filtered.length === 0) {
      return (
        <tr>
          <td colSpan={10} className="px-4 py-16 text-center text-slate-500">
            <div className="flex flex-col items-center justify-center">
              <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              No data to show
            </div>
          </td>
        </tr>
      );
    }

    return filtered.map((r, i) => {
      const order = r.orders || {};
      const shopName = order.seller_id ? (sellers.find(s => s.id === order.seller_id)?.shop_name || 'Vendor') : 'In-House';
      const custName = order.customers ? `${order.customers.first_name || ''} ${order.customers.last_name || ''}`.trim() : (order.shipping_address?.name || 'Guest');

      return (
        <tr key={r.id} className="hover:bg-slate-50 transition-colors text-xs border-b border-slate-100">
          <td className="px-4 py-3">{i + 1}</td>
          <td className="px-4 py-3 text-slate-500">Product Info (Dynamic)</td>
          <td className="px-4 py-3 font-medium text-slate-800">{r.id.slice(0,8)}</td>
          <td className="px-4 py-3 text-blue-500 hover:underline">
            <Link to={`/admin/orders/details/${r.order_id}`}>
              {r.order_id.slice(0,8)}
            </Link>
          </td>
          <td className="px-4 py-3">{shopName}</td>
          <td className="px-4 py-3 capitalize">{order.payment_method || 'cash'}</td>
          <td className="px-4 py-3">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${order.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              {order.payment_status || 'unpaid'}
            </span>
          </td>
          <td className="px-4 py-3">{custName}</td>
          <td className="px-4 py-3 font-bold text-slate-800">৳{r.amount.toFixed(2)}</td>
          <td className="px-4 py-3">Refunded</td>
        </tr>
      );
    });
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800">Total transaction</h3>
            <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs font-bold">{refunds.length}</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search by orders id or refund id" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-blue-500 w-64"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-medium transition">
              Search
            </button>
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="appearance-none border border-slate-300 rounded px-4 py-1.5 text-sm text-slate-700 bg-white focus:outline-none focus:border-blue-500 w-32"
              >
                <option value="All">All</option>
                <option value="This Year">This Year</option>
                <option value="This Month">This Month</option>
                <option value="This Week">This Week</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-medium transition">
              Filter
            </button>
            <button onClick={downloadCSV} className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-1.5 rounded text-sm font-medium transition flex items-center gap-2">
              <Download className="w-4 h-4" /> Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 whitespace-nowrap">
            <thead className="bg-white border-b border-slate-200 text-xs text-slate-800 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-4">SL</th>
                <th className="px-4 py-4">Product</th>
                <th className="px-4 py-4">Refund Id</th>
                <th className="px-4 py-4">Order Id</th>
                <th className="px-4 py-4">Shop Name</th>
                <th className="px-4 py-4">Payment Method</th>
                <th className="px-4 py-4">Payment Status</th>
                <th className="px-4 py-4">Paid By</th>
                <th className="px-4 py-4">Amount</th>
                <th className="px-4 py-4">Transaction Type</th>
              </tr>
            </thead>
            <tbody>
              {renderTableData()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
