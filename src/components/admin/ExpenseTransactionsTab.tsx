import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Download, ChevronDown, FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function ExpenseTransactionsTab() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState('This Year');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Stats
  const [totalExpense, setTotalExpense] = useState(0);
  const [totalFreeDelivery, setTotalFreeDelivery] = useState(0);
  const [totalCouponDiscount, setTotalCouponDiscount] = useState(0);

  useEffect(() => {
    fetchData();
  }, [dateFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const { data: coupons } = await supabase.from('coupons').select('code, coupon_bearer');
      const couponsMap = new Map(coupons?.map(c => [c.code, c.coupon_bearer]) || []);

      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      const { data: oData, error } = await query;
      if (error) throw error;
      
      let filteredOrders = oData || [];

      // Filter by date
      const now = new Date();
      if (dateFilter === 'This Year') {
        filteredOrders = filteredOrders.filter(o => new Date(o.created_at).getFullYear() === now.getFullYear());
      } else if (dateFilter === 'This Month') {
        filteredOrders = filteredOrders.filter(o => {
          const d = new Date(o.created_at);
          return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
        });
      } else if (dateFilter === 'This Week') {
        const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
        filteredOrders = filteredOrders.filter(o => new Date(o.created_at) >= firstDay);
      }

      const expenseRecords: any[] = [];
      let totalExp = 0;
      let freeDel = 0;
      let couponDisc = 0;

      filteredOrders.forEach((o, index) => {
        // Admin bears coupon discount if it's an admin coupon
        if (o.applied_coupon && couponsMap.get(o.applied_coupon) === 'admin' && parseFloat(o.coupon_discount) > 0) {
          const amt = parseFloat(o.coupon_discount);
          totalExp += amt;
          couponDisc += amt;
          expenseRecords.push({
            id: `EXP-${o.id}-${index}-C`,
            xid: `XID-${o.id.slice(0,6)}`,
            date: o.created_at,
            orderId: o.id,
            amount: amt,
            type: 'Coupon Discount'
          });
        }

        // Loyalty discount
        if (parseFloat(o.loyalty_discount) > 0) {
          const amt = parseFloat(o.loyalty_discount);
          totalExp += amt;
          expenseRecords.push({
            id: `EXP-${o.id}-${index}-L`,
            xid: `XID-${o.id.slice(0,6)}`,
            date: o.created_at,
            orderId: o.id,
            amount: amt,
            type: 'Loyalty Discount'
          });
        }
      });

      setExpenses(expenseRecords);
      setTotalExpense(totalExp);
      setTotalFreeDelivery(freeDel);
      setTotalCouponDiscount(couponDisc);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const monthlyData = Array(12).fill(0);
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  expenses.forEach(e => {
    const d = new Date(e.date);
    if (d.getFullYear() === new Date().getFullYear()) {
      monthlyData[d.getMonth()] += e.amount;
    }
  });

  const chartData = monthNames.map((name, i) => ({
    name: `${name}-${new Date().getFullYear()}`,
    Expense: monthlyData[i]
  }));

  const downloadCSV = () => {
    let csv = 'SL,XID,Transaction Date,Order ID,Expense Amount,Expense Type\n';
    
    expenses.forEach((e, i) => {
      csv += `"${i + 1}","${e.xid}","${new Date(e.date).toLocaleDateString()}","${e.orderId.slice(0,8)}","${e.amount.toFixed(2)}","${e.type}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Expense_Transactions_${new Date().getTime()}.csv`;
    a.click();
  };

  const renderTableData = () => {
    let filtered = expenses;
    if (searchQuery) {
      filtered = filtered.filter(e => e.orderId.toLowerCase().includes(searchQuery.toLowerCase()) || e.xid.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (filtered.length === 0) {
      return (
        <tr>
          <td colSpan={7} className="px-4 py-16 text-center text-slate-500">
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

    return filtered.map((e, i) => (
      <tr key={e.id} className="hover:bg-slate-50 transition-colors text-xs border-b border-slate-100">
        <td className="px-4 py-3">{i + 1}</td>
        <td className="px-4 py-3 font-mono text-slate-500">{e.xid}</td>
        <td className="px-4 py-3">{new Date(e.date).toLocaleString()}</td>
        <td className="px-4 py-3 font-medium text-slate-800">{e.orderId.slice(0,8)}</td>
        <td className="px-4 py-3 font-bold text-slate-800">৳{e.amount.toFixed(2)}</td>
        <td className="px-4 py-3">{e.type}</td>
        <td className="px-4 py-3 text-center">
          <button className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition">
            <Download className="w-4 h-4" />
          </button>
        </td>
      </tr>
    ));
  };

  return (
    <div className="p-6">
      {/* Filters */}
      <div className="bg-white rounded border border-slate-200 p-4 mb-6">
        <h3 className="text-sm font-bold text-slate-800 mb-3">Filter Data</h3>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 max-w-[300px]">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full appearance-none border border-slate-300 rounded px-4 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="This Year">This Year</option>
              <option value="This Month">This Month</option>
              <option value="This Week">This Week</option>
              <option value="Custom Date">Custom Date</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          <button onClick={fetchData} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded text-sm font-medium transition">
            Filter
          </button>
        </div>
      </div>

      {/* Stats and Charts */}
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        <div className="w-full md:w-1/3 space-y-4">
          <div className="bg-white border border-slate-200 rounded p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-amber-50 p-3 rounded-full"><FileText className="w-6 h-6 text-amber-500" /></div>
              <div>
                <h4 className="text-2xl font-black text-slate-800">৳{totalExpense.toFixed(2)}</h4>
                <span className="text-xs font-bold text-slate-500">Total Expense</span>
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-50 p-3 rounded-full"><FileText className="w-6 h-6 text-emerald-500" /></div>
              <div>
                <h4 className="text-2xl font-black text-slate-800">৳{totalFreeDelivery.toFixed(2)}</h4>
                <span className="text-xs font-bold text-slate-500">Free Delivery</span>
              </div>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded p-5 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 p-3 rounded-full"><FileText className="w-6 h-6 text-blue-500" /></div>
              <div>
                <h4 className="text-2xl font-black text-slate-800">৳{totalCouponDiscount.toFixed(2)}</h4>
                <span className="text-xs font-bold text-slate-500">Coupon Discount</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-2/3 bg-white border border-slate-200 rounded p-5 shadow-sm">
          <h4 className="font-bold text-slate-700 mb-4">Expense Statistics</h4>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} angle={-45} textAnchor="end" height={40} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(0)}k` : val} />
                <RechartsTooltip cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '5 5' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="Expense" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-800">Total Transactions</h3>
            <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs font-bold">{expenses.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search by Order ID or Tr..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-blue-500 w-64"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-medium transition">
              Search
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
                <th className="px-4 py-4">XID</th>
                <th className="px-4 py-4">Transaction Date</th>
                <th className="px-4 py-4">Order ID</th>
                <th className="px-4 py-4">Expense Amount</th>
                <th className="px-4 py-4">Expense Type</th>
                <th className="px-4 py-4 text-center">Action</th>
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
